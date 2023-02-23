#!/usr/bin/python3

from enum import Enum
import random

class StkPlayerSkill(Enum):
  somewhatcasualplayer=0
  casualplayer=1
  somewhatseriousplayer=2
  seriousplayer=3
  somewhatkillerplayer=4
  killerplayer=5
  somewhatcloseskill=6
  closeskill=7

#m=str(StkPlayerSkill(random.randint(0,7)))
m=str(StkPlayerSkill(0))
print(m.split(".",1)[1])
