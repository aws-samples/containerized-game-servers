#!/bin/bash -x
STDOUT="/root/.config/supertuxkart/config-0.10/server_config.log"
is_ready="False"
while true
do
  if [ "$IS_AGONES" = "True" ]; then
    curl -s -d "{}" -H "Content-Type: application/json" -X POST http://localhost:${AGONES_SDK_HTTP_PORT}/health
  fi
  ready_server=`cat $STDOUT| grep "ProtocolManager: A 11ServerLobby protocol has been started."`
  if [ ! -z "$ready_server" ]; then
    if [ "$is_ready" = "False" ]; then
      if [ "$IS_AGONES" = "True" ]; then
        curl -s -d "{}" -H "Content-Type: application/json" -X POST http://localhost:${AGONES_SDK_HTTP_PORT}/ready  
      fi
      is_ready="True"
    fi
  fi
  peer_list=`cat $STDOUT|grep  "STKHost:.* has just connected"| awk '{print $16"-"$9}'`
  if [ ! -z "$peer_list" ]; then
    if [ "$IS_AGONES" = "True" ]; then
      curl -s -d "{}" -H "Content-Type: application/json" -X POST http://localhost:${AGONES_SDK_HTTP_PORT}/allocate
    fi
  fi
  for peer in $peer_list; do
    echo "/alpha/player/connect playerID="$peer
    if [ "$IS_AGONES" = "True" ]; then
      curl -s -d '{"playerID": "'$peer'"}' -H "Content-Type: application/json" -X POST http://localhost:${AGONES_SDK_HTTP_PORT}/alpha/player/connect
    fi
  done
  sleep 10
done
