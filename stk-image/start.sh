#!/bin/bash

#trap sighandler TERM QUIT EXIT KILL
trap "echo TERM" TERM
trap "echo KILL" KILL
trap "echo QUIT" QUIT
trap "echo INT" INT
trap "echo EXIT" EXIT

sighandler () {
  echo -en "\n## Caught SIGTERM\n";
  echo -en "\n## deregister game-server comes here\n";
  aws gamelift deregister-game-server --game-server-group-name $GAME_SERVER_GROUP_NAME --game-server-id $game_server_id 
  exit $?
}


port=`kubectl get svc $POD_NAME -n $NAMESPACE -o json|jq '.spec.ports[].nodePort'`
hostname=`curl 169.254.169.254/latest/meta-data/public-hostname`
instance_id=`curl 169.254.169.254/latest/meta-data/instance-id`
game_server_endpoint=$hostname:$port
game_server_id=`uuid`
echo "export game-server for pre-stop"
echo $game_server_id > $SHARED_FOLDER/GAME_SERVER_ID
echo $instance_id > $SHARED_FOLDER/INSTANCE_ID
echo $GAME_SERVER_GROUP_NAME > $SHARED_FOLDER/GAME_SERVER_GROUP_NAME
echo "register $game_server_endpoint"
aws gamelift register-game-server --game-server-group-name $GAME_SERVER_GROUP_NAME --game-server-id $game_server_id --instance-id $instance_id
./cmake_build/bin/supertuxkart --server-config=/home/supertuxkart/stk-code/server_config.xml
