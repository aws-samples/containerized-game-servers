#!/usr/local/bin/python

import socket
import time
import os

port=int(os.environ['PORT'])
host=os.environ['HOST']

packet_file=open("./cli_udp_game_session_cap.txt","r")
_packet_data=packet_file.read()
packet_data=_packet_data.split("\n")
sock=socket.socket(socket.AF_INET,type=socket.SOCK_DGRAM)
while(True):
  for packet in packet_data:
    bytes_to_send=str.encode(packet)
    try:
      sock.sendto(bytes_to_send,(host,port))
      response=sock.recv(0)
      print('sending {}; recv {}'.format(bytes_to_send,response))
    except Exception as e:
      print('{}'.format(e))
    time.sleep(1)
