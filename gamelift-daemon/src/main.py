#!/usr/bin/env python3
import asyncio, boto3, json, random, requests, os, signal, sys 
from time import sleep

from kubernetes import client, config
from kubernetes.client.rest import ApiException

import click
import redis 
from ec2_metadata import ec2_metadata

# Global variables
gamelift = boto3.client('gamelift', region_name=os.getenv('AWS_REGION'))
ec2 = boto3.client('autoscaling', region_name=os.getenv('AWS_REGION'))
r = redis.from_url('redis://' + os.getenv('REDIS_URL')) # move to cmdline flag?
config.load_incluster_config()
core_v1_client = client.CoreV1Api()
custom_obj_client = client.CustomObjectsApi()
instance_id = ec2_metadata.instance_id
game_server_id = instance_id
game_server_group_name = os.getenv('GAME_SERVER_GROUP_NAME') # move to cmdline flag?
grace_period = 30
loop = asyncio.get_event_loop()

def drain_pods(node_name):
    # Removes all Kubernetes pods from the specified node
    # Not currently implemented. Need to assess whether to allow the termination handler to drain pods.
    field_selector = {
        "spec": {
            "nodeName": node_name
        }
    }
    pods = core_v1_client.list_pod_for_all_namespaces(watch=False, field_selector=field_selector)

    print('Number of pods to delete: ' + str(len(pods.items)), flush=True)

    for pod in pods.items:
        print(f'Deleting pod {pod.metadata.name} in namespace {pod.metadata.namespace}', flush=True)
        if 'grace_period' in globals():
            body = {
                'apiVersion': 'policy/v1beta1',
                'kind': 'Eviction',
                'metadata': {
                    'name': pod.metadata.name,
                    'namespace': pod.metadata.namespace,
                    'grace_period_seconds': grace_period
                }
            }
        else:
            body = {
                'apiVersion': 'policy/v1beta1',
                'kind': 'Eviction',
                'metadata': {
                    'name': pod.metadata.name,
                    'namespace': pod.metadata.namespace
                }
            }
        core_v1_client.create_namespaced_pod_eviction(pod.metadata.name + '-eviction', pod.metadata.namespace, body)

async def deregister_game_server(game_server_group_name, game_server_id):
    cordon_body = {
        "spec": {
            "unschedulable": True
        }
    }
    # Cordon the node so no new game servers are scheduled onto the instance
    try:
        core_v1_client.patch_node(ec2_metadata.private_hostname, cordon_body)
        print(f'Node {instance_id} has been cordoned', flush=True)
    except ApiException as e:
        print(f'Exception when calling CoreV1Api->patch_node: {e}\n')
    
    patch_body = {
        "spec": {
            "tolerations": [
                {
                    "effect": "NoExecute",
                    "key": "gamelift.aws/status",
                    "operator": "Equal",
                    "value": "DRAINING"
                },
                {
                    "key": "agones.dev/gameservers",
                    "operator": "Equal",
                    "value": "true",
                    "effect": "NoExecute"
                },
                {
                    "key": "gamelift.aws/status",
                    "operator": "Equal",
                    "value": "ACTIVE",
                    "effect": "NoExecute"
                },
                {
                    "key": "node.kubernetes.io/not-ready",
                    "operator": "Exists",
                    "effect": "NoExecute",
                    "tolerationSeconds": 300
                },
                {
                    "key": "node.kubernetes.io/unreachable",
                    "operator": "Exists",
                    "effect": "NoExecute",
                    "tolerationSeconds": 300
                }
            ]
        }
    }
    
    try:
        api_response = custom_obj_client.list_cluster_custom_object(group='agones.dev', version='v1', plural='gameservers')
    except ApiException as e:
        print("Exception when calling CustomObjectsApi->list_cluster_custom_object: %s\n" % e)
    
    game_servers = api_response['items']
    print(game_servers)
    filtered_list = list(filter(lambda x: x['status']['state']=='Allocated' and x['status']['nodeName']==ec2_metadata.private_hostname, game_servers))
    for item in filtered_list:
        print(f"Updating {item['metadata']['name']} with toleration", flush=True)
        # Patch game server pod with toleration for DRAINING
        core_v1_client.patch_namespaced_pod(name=item['metadata']['name'], namespace=item['metadata']['namespace'], body=patch_body)
    
    # Change taint to DRAINING
    taint_body = {
        "spec": {
            "taints": [
                {
                    "key": "gamelift.aws/status",
                    "value": "DRAINING",
                    "effect": "NoExecute"
                },
                {
                    "key": "agones.dev/gameservers",
                    "value": "true",
                    "effect": "NoExecute"
                }
            ]
        }
    }
    try:
        core_v1_client.patch_node(ec2_metadata.private_hostname, taint_body)
        print(f'Node {instance_id} has been tainted', flush=True)
    except ApiException as e:
        print(f'Exception when calling CoreV1Api->patch_node: {e}\n')

async def termination_handler(game_server_group_name,game_server_id):
    while ec2_metadata.spot_instance_action == None:
        print('Waiting for termination notification', flush=True)
        await asyncio.sleep(5)
    print('Shutting down', flush=True)
    
    # Drain pods from the instance
    drain_pods(ec2_metadata.private_hostname)
    
    # Deregister the instance from FleetIQ
    gamelift.deregister_game_server(
        GameServerGroupName=game_server_group_name,
        GameServerId=game_server_id
    )
    print(f'Instance {game_server_id} has been deregistered from FleetIQ', flush=True)
    exit(0)

def initialize_game_server(game_server_group_name, game_server_id, instance_id):
    try:
        # Register game server instance
        print('Registering game server', flush=True)  
        gamelift.register_game_server(
            GameServerGroupName=game_server_group_name,
            GameServerId=game_server_id,
            InstanceId=instance_id
        )
    except gamelift.exceptions.ConflictException as error:
        print('The game server is already registered', flush=True)
        pass
    # Update the game server status to healthy
    backoff = 0
    while is_healthy(instance_id) != 'HEALTHY':
        print(f'Instance is not healthy, re-trying in {5 + backoff}', flush=True)
        backoff = random.randint(1,10)
    print('Updating game server health', flush=True)
    gamelift.update_game_server(
        GameServerGroupName=game_server_group_name,
        GameServerId=game_server_id,
        HealthCheck='HEALTHY'
    )
    # Claim the game server
    print('Claiming game server', flush=True)
    try: 
        gamelift.claim_game_server(
            GameServerGroupName=game_server_group_name,
            GameServerId=game_server_id
        )
    except gamelift.exceptions.ConflictException as error: 
        print('The instance has already been claimed', flush=True)
    # Update game server status 
    print('Changing status to utilized', flush=True)
    gamelift.update_game_server(
        GameServerGroupName=game_server_group_name,
        GameServerId=game_server_id,
        UtilizationStatus='UTILIZED'
    )
    # Adding taint to node
    taint_body = {
        "spec": {
            "taints": [
                {
                    "key": "gamelift.aws/status",
                    "value": "ACTIVE",
                    "effect": "NoExecute"
                },
                {
                    "key": "agones.dev/gameservers",
                    "value": "true",
                    "effect": "NoExecute"
                }
            ]
        }
    }
    try:
        core_v1_client.patch_node(ec2_metadata.private_hostname, taint_body)
        print(f'Node {instance_id} has been tainted', flush=True)
    except ApiException as e:
        print(f'Exception when calling CoreV1Api->patch_node: {e}\n')

def is_healthy(instance_id):
    asg_instance = ec2.describe_auto_scaling_instances(
        InstanceIds=[
            instance_id
        ]
    )
    instance_health = asg_instance['AutoScalingInstances'][0]['HealthStatus']
    print(f'The instance is {instance_health}', flush=True)
    return instance_health   

async def update_health_status(game_server_group_name, game_server_id):
    while True:
        gamelift.update_game_server(
            GameServerGroupName=game_server_group_name,
            GameServerId=game_server_id,
            HealthCheck='HEALTHY'
        )
        print('Updated Gamelift game server health')
        await asyncio.sleep(60)

async def get_health_status(instance_id, game_server_group_name, game_server_id, healthcheck_interval):
    # Check instance health
    pubsub = r.pubsub()
    pubsub.subscribe(instance_id)
    print('Starting message loop', flush=True)
    for raw_message in pubsub.listen():
        if raw_message['type'] != "message":
            continue
        message = json.loads(raw_message['data'])
        print(f"Instance {message['InstanceId']} status is: {message['InstanceStatus']}", flush=True)
        print(message, flush=True)
        if message['InstanceStatus'] == 'DRAINING':
            print('Instance is no longer viable', flush=True)
            await asyncio.wait_for(deregister_game_server(game_server_group_name, game_server_id), timeout=300)
            await termination_handler(game_server_group_name,game_server_id)
        else: 
            print('Waiting for next signal')
            await asyncio.sleep(healthcheck_interval)

@click.command()
@click.option('--failure-threshold', help='Number of times to try before giving up', type=click.IntRange(1, 5, clamp=True), default=3)
@click.option('--healthcheck-interval', help='How often in seconds to perform the healthcheck', type=click.IntRange(5, 60, clamp=True), default=60)
def main(failure_threshold, healthcheck_interval):
    initialize_game_server(game_server_group_name, game_server_id, instance_id)

    try: 
        asyncio.ensure_future(update_health_status(game_server_group_name, game_server_id))
        asyncio.ensure_future(get_health_status(instance_id, game_server_group_name, game_server_id, healthcheck_interval))
        loop.run_forever()
    except Exception as e: 
        pass
    finally:
        loop.close()

def sigterm_handler(signal, frame):
# degister game server on exit
    gamelift.deregister_game_server(
        GameServerGroupName=game_server_group_name,
        GameServerId=game_server_id
    )
    sys.exit(0)

#logging.basicConfig(format='%(asctime)s [%(levelname)s] - %(message)s', datefmt='%d-%b-%y %H:%M:%S', level=logging.INFO)
signal.signal(signal.SIGTERM, sigterm_handler)
if __name__ == "__main__":
    main()