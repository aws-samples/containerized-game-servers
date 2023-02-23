#!/usr/bin/python3

import time
import random
import socket

time.sleep(random.randint(0,10))
try:
  s=socket.socket(socket.AF_INET, socket.SOCK_STREAM)
  #print("socket created")
  s.bind(('',0))
except socket.error as msg:
  print("bind failed. Error is %s %s",msg[0],msg[1])
#print("socket bind complete")
port=s.getsockname()[1]
s.close()
#print("dynamic port generated is %s",port)
print(port)
