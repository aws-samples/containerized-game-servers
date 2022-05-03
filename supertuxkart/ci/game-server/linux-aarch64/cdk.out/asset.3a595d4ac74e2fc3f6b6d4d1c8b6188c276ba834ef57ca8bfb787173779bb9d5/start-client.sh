#!/bin/bash
	
trap sighandler TERM QUIT EXIT KILL

sighandler () {
  echo -en "\n## Caught SIGTERM\n";
  echo -en "\n## deregister game-server $game_server_endpoint $game_server_id \n";
  exit $?
}
sleep 1

if [ -z ${GAME_MODE+x} ];
then
  GAME_MODE=0
fi
while true
do
  /cmake_build/bin/supertuxkart --connect-now=$GAMESERVER_ENDPOINT --network-ai=$NETWORK_AI --auto-connect --owner-less&
  sleep 60
done
