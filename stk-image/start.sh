#!/bin/bash

trap sighandler TERM;

sighandler() {
  echo -en "\n## Caught SIGTERM\n";
  echo -en "\n## deregister game-server comes here\n";
  exit $?
}


port=`kubectl get svc $POD_NAME -n $NAMESPACE -o json|jq '.spec.ports[].nodePort'`
hostname=`curl 169.254.169.254/latest/meta-data/public-hostname`
game_server_endpoint=$hostname:$port
echo "register $game_server_endpoint"
./cmake_build/bin/supertuxkart --server-config=/home/supertuxkart/stk-code/server_config.xml
