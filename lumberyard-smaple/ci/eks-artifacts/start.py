#!/usr/bin/python
import sys
import os
import socket
import random
import subprocess
import boto3
import json
import signal
from datetime import datetime
from ec2_metadata import ec2_metadata

region=os.environ['AWS_DEFAULT_REGION']
print('Region is:{}'.format(region))

# global variables 
public_hostname=''
public_port=''
private_ipv4=''
instance_type=''



now=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

# Get the service resource
sqs_cli=boto3.resource('sqs',region_name=region)

# Get the queue
queuename=os.environ['QUEUENAME']
print 'queuename='+queuename
queue = sqs_cli.get_queue_by_name(QueueName=queuename)

# Get the server group
group=os.environ['GROUP']

def sigterm_handler(_signo, _stack_frame):
    print 'in sigterm_handler'
    publish_game_server_status('terminating','gs')
      

def publish_game_server_status(status,server_type):
    print 'in publish_game_server_status with hostname='+public_hostname+' port='+str(public_port)+' region='+region+' status='+status+' type='+server_type
    data=[]
    data.append({'public_hostname':public_hostname,'instance_type':instance_type,'datetime':now,'public_port':public_port,'region':region,'status':status,'type':server_type})
    print str(data)
    try:
       # Send the message to the queue 
       response = queue.send_message(
           MessageBody=str(data)
       )

       # The response is NOT a resource, but gives you a message ID and MD5
       print('response message id is '+response.get('MessageId'))
    except Exception as e:
        print 'error publishing server status via SQS'
        print str(e)

def get_rand_port():
    print 'in get random port'
    # Attempting to get random port
    try:
      s=socket.socket(socket.AF_INET, socket.SOCK_STREAM)
      print 'socket created'
      s.bind(('',0))
    except socket.error as msg:
      print 'bind failed. Error is '+str(msg[0])+' Msg '+msg[1]
    print 'socket bind complete '
    # Capture the port and release the socket
    port=s.getsockname()[1]
    s.close()
    print 'dynamic port to start the game server is '+str(port)
    return port

if __name__ == '__main__':
  # Catch SIGTERM to report game-server status
  signal.signal(signal.SIGTERM, sigterm_handler)

  # Getting instance type
  instance_type=ec2_metadata.instance_type
  # Getting ports and hostname from the platform
  public_port=get_rand_port()
  print 'got server port '+str(public_port)
  os.environ['SERVER_PORT'] = str(public_port)
  print 'populated the SERVER_PORT environment variable before launching the game-server'

  public_hostname=ec2_metadata.public_hostname
  print 'The public hostname of the game server is '+public_hostname 

  private_ipv4=ec2_metadata.private_ipv4
  print 'The local hostname of the game server is '+private_ipv4
  
  # Publishing game-server init status
  publish_game_server_status('init','gs')

  # Starting the game-server 
  subprocess.call(['/start.sh'])
