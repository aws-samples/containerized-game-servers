#!/bin/bash

trap sighandler TERM QUIT EXIT KILL

sighandler () {
  echo -en "\n## Caught SIGTERM\n";
  echo -en "\n## deregister game-server $game_server_endpoint $game_server_id \n";
  echo aws gamelift deregister-game-server --game-server-group-name $GAME_SERVER_GROUP_NAME --game-server-id $game_server_id 
  exit $?
}
sleep 10
curl -d "{}" -H "Content-Type: application/json" -X POST http://localhost:${AGONES_SDK_HTTP_PORT}/ready
./cmake_build/bin/supertuxkart --server-config=/home/supertuxkart/stk-code/server_config.xml --log=0 --connection-debug
