#!/bin/bash
export PGUSER=`cat $SECRET_FILE | jq -r '.username'`
export PGDATABASE=`cat $SECRET_FILE | jq -r '.username'`
export PGPASSWORD=`cat $SECRET_FILE | jq -r '.password'`
export PGHOST=`cat $SECRET_FILE | jq -r '.host'`
export PGPORT=`cat $SECRET_FILE | jq -r '.port'`
cd craft
./monitor_active_game_sessions.sh&
python server.py
