#!/bin/bash

cd craft
./monitor_active_game_sessions.sh&
python server.py
