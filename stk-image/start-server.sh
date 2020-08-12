#!/bin/bash

trap sighandler TERM QUIT EXIT KILL

sighandler () {
  echo -en "\n## Caught SIGTERM\n";
  echo -en "\n## deregister game-server $game_server_endpoint $game_server_id \n";
  aws gamelift deregister-game-server --game-server-group-name $GAME_SERVER_GROUP_NAME --game-server-id $game_server_id 
  exit $?
}

./cmake_build/bin/supertuxkart --server-config=/home/supertuxkart/stk-code/server_config.xml
