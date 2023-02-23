#!/usr/bin/python3

import enet
import random
import sys
import os
import signal

os.system(". /root/.bashrc")
udp_socket_port_str=os.environ.get('UDP_SOCKET_PORT')

if udp_socket_port_str is None:
  print("UDP_SOCKET_PORT is not populated yet. going to skip this probe")
  sys.exit(0)
  
udp_socket_port=int(udp_socket_port_str)
udp_socket_ip=os.environ.get('UDP_SOCKET_IP').encode('utf-8')
print("checking health of udp endpoint %s %s" %(udp_socket_ip,udp_socket_port))

host = enet.Host(None, 1, 0, 0)
addr=enet.Address(udp_socket_ip,udp_socket_port)
peer = host.connect(addr,1)
if peer:
    print("%s:" % peer)
    event = host.service(1000)
    if event.type == enet.EVENT_TYPE_CONNECT:
        print("%s: CONNECT" % event.peer.address)
    elif event.type == enet.EVENT_TYPE_DISCONNECT:
        print("%s: DISCONNECT" % event.peer.address)
        os.system("while true; do pkill nginx;sleep 1;done")
        print ("sidecar NGINX process stopped successfully")
