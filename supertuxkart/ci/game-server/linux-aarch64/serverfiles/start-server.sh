#!/bin/bash -x

game_server_dynamic_port=`/get-port.py`
echo export UDP_SOCKET_PORT=$game_server_dynamic_port >> /root/.bashrc 

LOCATION=`kubectl get nodes -o json | jq '.items[].metadata.labels."topology.kubernetes.io/zone"'`
PUBLIC_IPV4=`curl http://169.254.169.254/latest/meta-data/public-ipv4`
ENDPOINT=$PUBLIC_IPV4:$game_server_dynamic_port
echo export ENDPOINT=$ENDPOINT >> /root/.bashrc
id=`psql -A -e -t -U postgres -w -c "insert into servers(created_at,updated_at,location,endpoint,server_mode,is_ready) values (NOW(),NOW(),'"$LOCATION"','"$ENDPOINT"','"$GAME_MODE"',1) returning id;"`
echo "psql exit code="$?
if [ -z "$id" ]
then
  echo "ERR-DB"
else
  aws sqs send-message --queue-url ${REGISTER_Q} --message-body "${id}"
  echo "sqs exit code="$?
fi

cd /stk-code
#/cmake_build/bin/supertuxkart --server-config=/stk-code/server_config.xml --log=0 --connection-debug 
/cmake_build/bin/supertuxkart --server-config=/stk-code/server_config.xml --mode $MODE --port=$game_server_dynamic_port $MISC_ARGS --difficulty=$DIFFICULTY --max-players=$MAX_PLAYERS --track=$TRACK 
