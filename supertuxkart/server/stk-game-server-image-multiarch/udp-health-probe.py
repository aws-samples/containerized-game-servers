#!/usr/local/bin/python

import enet
import random
import sys
import os
import signal
import psycopg2
import requests
from datetime import datetime as dt

os.system(". /root/.bashrc")

user=os.environ['PGUSER']
password=os.environ['PGPASSWORD']
dbhost=os.environ['PGHOST']
database=os.environ['PGUSER']
IS_AGONES=os.environ['IS_AGONES']

if IS_AGONES == 'True':
  AGONES_SDK_HTTP_PORT=os.environ['AGONES_SDK_HTTP_PORT']

def db_write(sql,param):
  try:
    connection = psycopg2.connect(user=user,
      password=password,
      host=dbhost,
      port="5432",
      database=database)
    cursor = connection.cursor()
    cursor.execute(sql,param)
    connection.commit()
    if "returning" in sql:
      ret = cursor.fetchone()[0]
    else:
      ret = cursor.rowcount
    return ret
  except (Exception, psycopg2.Error) as error:
    print("Failed to insert/update - {0}".format(error))
    sys.stdout.flush()
  finally:
    if connection:
      cursor.close()
      connection.close()

udp_socket_port_str=os.environ.get('UDP_SOCKET_PORT')
if udp_socket_port_str is None:
  print("UDP_SOCKET_PORT is not populated yet. going to skip this probe")
  sys.stdout.flush()
  sys.exit(0)
udp_socket_port=int(udp_socket_port_str)

udp_socket_ip=os.environ.get('UDP_SOCKET_IP').encode('utf-8')
if udp_socket_ip is None:
  print("UDP_SOCKET_IP is not populated yet. going to skip this probe")
  sys.stdout.flush()
  sys.exit(0)

print("checking health of udp endpoint %s %s" %(udp_socket_ip,udp_socket_port))
endpoint=udp_socket_ip+':'+udp_socket_port

host = enet.Host(None, 1, 0, 0)
addr=enet.Address(udp_socket_ip,udp_socket_port)
peer = host.connect(addr,1)
if peer:
  event = host.service(1000)
  if event.type == enet.EVENT_TYPE_CONNECT:
    sql = """update servers set updated_at=%s,is_ready=1 where endpoint=%s returning id"""
    params=[dt.now(),endpoint]
    db_write(sql,params)
    if IS_AGONES == 'True':
      headers={'Content-Type':'application/json'}
      url='http://localhost:'+AGONES_SDK_HTTP_PORT+'/health'
      r=requests.post(url,headers=headers,json={})
      print("%s: CONNECT - report health to agones %s" %(event.peer.address,r))
      sys.stdout.flush()
  else:
    print("%s: DISCONNECT number %d" % event.peer.address,i)
    sys.stdout.flush()
    sql = """update servers set updated_at=%s,is_ready=0 where endpoint=%s returning id"""
    params=[dt.now(),endpoint]
    db_write(sql,params)
    os.system("/srv-sigstop.sh")
