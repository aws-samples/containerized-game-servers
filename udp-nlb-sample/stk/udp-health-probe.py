#!/usr/local/bin/python

import enet
import random
import sys
import os

udp_socket_port=int(os.environ.get('UDP_SOCKET_PORT'))
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
        os.system("service nginx stop")
'''
    #optional - try to send data over the wire
    elif event.type == enet.EVENT_TYPE_RECEIVE:
        print("%s: IN:  %r" % (event.peer.address, event.packet.data))
    msg = bytes(bytearray([random.randint(0,255) for i in range(40)]))
    packet = enet.Packet(msg)
    peer.send(0, packet)
'''
