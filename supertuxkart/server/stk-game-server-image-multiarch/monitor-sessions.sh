#!/bin/bash -x
STDOUT="/root/.config/supertuxkart/config-0.10/server_config.log"
is_ready="False"
while true
do
  curl -s -d "{}" -H "Content-Type: application/json" -X POST http://localhost:${AGONES_SDK_HTTP_PORT}/health
  ready_server=`tail -40000 $STDOUT| grep "ProtocolManager: A 11ServerLobby protocol has been started."`
  if [ ! -z "$ready_server" ]; then
    if [ "$is_ready" = "False" ]; then
      curl -s -d "{}" -H "Content-Type: application/json" -X POST http://localhost:${AGONES_SDK_HTTP_PORT}/ready  
      is_ready="True"
    fi
  fi
  conn_peer_list=`tail -40000 $STDOUT|grep  "STKHost:.* has just connected"| awk '{print $16"-"$9}'|sed 's/-/H/g'| sed 's/:/C/g' | sed 's/\./D/g'`
  if [ ! -z "$conn_peer_list" ]; then
    curl -s -d "{}" -H "Content-Type: application/json" -X POST http://localhost:${AGONES_SDK_HTTP_PORT}/allocate
  fi
  for peer in $conn_peer_list; do
    echo "/alpha/player/connect playerID="$peer
    curl -s -d '{"playerID": "'$peer'"}' -H "Content-Type: application/json" -X POST http://localhost:${AGONES_SDK_HTTP_PORT}/alpha/player/connect
  done
  
  disconn_peer_list=`tail -40000 $STDOUT|grep  "STKHost:.* has just disconnected"| awk '{print $16"-"$9}'|sed 's/-/H/g'| sed 's/:/C/g' | sed 's/\./D/g'`

  #for conn_peer in $conn_peer_list; do
  #for disconn_peer in $disconn_peer_list; do
  #  if [[ "$
  #done
  #done

  player_capacity=`curl -s -d '{}' -H "Content-Type: application/json" -X GET http://localhost:${AGONES_SDK_HTTP_PORT}/alpha/player/capacity`
  player_count=`curl -s -H "Content-Type: application/json" -X GET http://localhost:${AGONES_SDK_HTTP_PORT}/alpha/player/count`
  player_connected=`curl -s -H "Content-Type: application/json" -X GET http://localhost:${AGONES_SDK_HTTP_PORT}/alpha/player/connected`
  sleep 10
done
