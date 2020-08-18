#!/usr/bin/env python3
import boto3, random, requests, os, signal, sys 
from time import sleep

from kubernetes import client, config
from kubernetes.client.rest import ApiException

import click
from ec2_metadata import ec2_metadata

# Global variables
gamelift = boto3.client('gamelift', region_name=os.getenv('AWS_REGION'))
ec2 = boto3.client('autoscaling', region_name=os.getenv('AWS_REGION'))
config.load_incluster_config()
api_instance = client.CoreV1Api()
instance_id = ec2_metadata.instance_id
game_server_id = instance_id
game_server_group_name = os.getenv('GAME_SERVER_GROUP_NAME')

def deregister_game_server(game_server_group_name, game_server_id):
    body='[{"op": "add", "path": "/spec/unschedulable", "value": True}]'
    # Cordon the node so no new game servers are scheduled onto the instance
    try:
        api_instance.patch_node(name=ec2_metadata.private_hostname, body=json.loads(body))
        print('Node %s has been cordoned' % instance_id, flush=True)
    except ApiException as e:
        print("Exception when calling CoreV1Api->patch_node: %s\n" % e)
    # Deregister the instance from FleetIQ
    gamelift.deregister_game_server(
        GameServerGroupName=game_server_group_name,
        GameServerId=game_server_id
    )
    print('Instance %s has been deregistered from FleetIQ' % game_server_id, flush=True)
    while ec2_metadata.spot_instance_action == None:
        print('Waiting for termination notification', flush=True)
        sleep(5)
    print('Shutting down', flush=True)
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
        print('Instance is not healthy, re-trying in %d' % 5 + backoff, flush=True)
        backoff = randint(1,10)
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

def is_healthy(instance_id):
    asg_instance = ec2.describe_auto_scaling_instances(
        InstanceIds=[
            instance_id
        ]
    )
    instance_health = asg_instance['AutoScalingInstances'][0]['HealthStatus']
    logging.debug('The instance is', instance_health)
    return instance_health   

@click.command()
@click.option('--failure-threshold', help='Number of times to try before giving up', type=click.IntRange(1, 5, clamp=True), default=3)
@click.option('--healthcheck-interval', help='How often in seconds to perform the healthcheck', type=click.IntRange(5, 60, clamp=True), default=60)
def main(failure_threshold, healthcheck_interval):
    initialize_game_server(game_server_group_name, game_server_id, instance_id)
    
    # Check game server health
    i=0
    while i < failure_threshold:
        if is_healthy(instance_id) != "HEALTHY":
            i = i + 1
        else: 
            gamelift.update_game_server(
                GameServerGroupName=game_server_group_name,
                GameServerId=game_server_id,
                HealthCheck='HEALTHY'
            )
            print('Instance is healthy', flush=True)
        sleep(healthcheck_interval)
    print('Instance is no longer viable', flush=True)
    deregister_game_server(game_server_group_name, game_server_id)

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