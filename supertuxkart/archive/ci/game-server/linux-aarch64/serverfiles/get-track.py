#!/usr/bin/python3

from enum import Enum
import random

class StkTrack(Enum):
  sandtrack=1
  scotland=2
  abyss=3
  volcano_island=4
  hacienda=5
  cornfield_crossing=6
  snowtuxpeak=7
  ravenbridge_mansion=8
  zengarden=9
  cocoa_temple=10
  olivermath=11
  gran_paradiso_island=12
  lighthouse=13
  candela_city=14
  snowmountain=15
  minigolf=16
  black_forest=17
  mines=18
  stk_enterprise=19
  xr591=20

#t=str(StkTrack(random.randint(1,20)))
t=str(StkTrack(1))

print(t.split(".",1)[1])
