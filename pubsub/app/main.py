import json, os, time
import boto3
import redis

r = redis.from_url('redis://' + os.getenv('REDIS_URL'))
gamelift = boto3.client('gamelift', region_name=os.getenv('AWS_REGION'))
params = {
    'GameServerGroupName': os.getenv('GAME_SERVER_GROUP_NAME'),
    'Limit': 1
}
results = []
while True:
    while params.get('NextToken') != '':
        response = gamelift.describe_game_server_instances(**params)
        results.extend(response['GameServerInstances'])
        try:
            params['NextToken'] = response['NextToken']
        except Exception as e:
            break

    for result in results:
        print(f'Publishing status on channel {result["InstanceId"]}')
        r.publish(result['InstanceId'], json.dumps(result))

    time.sleep(60)