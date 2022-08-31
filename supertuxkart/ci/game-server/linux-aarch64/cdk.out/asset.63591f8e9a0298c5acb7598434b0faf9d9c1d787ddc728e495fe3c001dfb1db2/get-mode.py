#!/usr/bin/python3

from enum import Enum
import random

class StkMode(Enum):
  grandprixnormal=0
  grandprixtimetrial=1
  timenormal=2
  normal=3
  timetrail=4
  timesoccer=5
  soccer=6
  freeforall=7
  capturetheflag=8

m=str(StkMode(random.randint(0,8)))
print(m.split(".",1)[1])
