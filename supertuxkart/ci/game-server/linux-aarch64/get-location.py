#!/usr/bin/python3

from enum import Enum
import random

class StkLocation(Enum):
  uswest2a=1
  uswest2b=2
  uswest2c=3
  uswest1a=4
  uswest1b=5
  useast1a=6
  useast1b=7
  useast1c=8
  useast1d=9
  useast1e=10
  useast2a=11
  useast2b=12
  useast2c=13
  useast2d=14
  useast2e=15

t=str(StkLocation(random.randint(1,15)))

print(t.split(".",1)[1])
