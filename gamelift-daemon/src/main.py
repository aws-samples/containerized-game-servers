#!/usr/bin/env python3
from ec2_metadata import ec2_metadata
import boto3, signal, sys, logging, random, click
from time import sleep
from kubernetes import client, config
from kubernetes.client.rest import ApiException

gamelift = boto3.client('gamelift', region_name='us-west-2')
ec2 = boto3.client('autoscaling', region_name='us-west-2')
config.load_incluster_config()
api_instance = client.CoreV1Api()

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
    instance_id = ec2_metadata.instance_id
    game_server_id = instance_id
    game_server_group_name = 'agones-game-servers'
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
    body='[{"op": "add", "path": "/spec/unschedulable", "value": True}]'
    try:
        api_instance.patch_node(name=ec2_metadata.private_hostname, body=json.loads(body))
        print('Node %s has been cordoned' % instance_id, flush=True)
    except ApiException as e:
        print("Exception when calling CoreV1Api->patch_node: %s\n" % e)

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