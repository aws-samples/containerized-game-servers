#!/bin/bash -x

game_server_dynamic_port=`/get-port.py`
echo export UDP_SOCKET_PORT=$game_server_dynamic_port >> /root/.bashrc 

game_track=`/get-track.py`
echo export TRACK=$game_track >> /root/.bashrc

game_mode=`/get-mode.py`
echo export MODE=$game_mode >> /root/.bashrc

game_location=`/get-location.py`
echo export SERVER_LOCATION=$game_location >> /root/.bashrc

game_difficulty=`echo $(( RANDOM % 4 ))`
echo export DIFFICULTY=$game_difficulty >> /root/.bashrc

game_theme_track=`psql -A -q -t -w -c "select theme from trackmap where track='$game_track';"`
echo export TRACKTHEME=$game_theme_track >> /root/.bashrc

game_max_players=`awk -v min=2 -v max=25 'BEGIN{srand(); print int(min+rand()*(max-min+1))}'`
echo export MAX_PLAYERS=$game_max_players >> /root/.bashrc

#LOCATION=`kubectl get nodes -o json | jq '.items[].metadata.labels."topology.kubernetes.io/zone"'`
if [ -z "$game_server_dynamic_port" ]
then
  game_server_dynamic_port=8081
fi
PUBLIC_IPV4=`curl http://169.254.169.254/latest/meta-data/public-ipv4`
ENDPOINT=$PUBLIC_IPV4:$game_server_dynamic_port
echo export ENDPOINT=$ENDPOINT >> /root/.bashrc
id=`psql -A -e -t -U postgres -w -c "insert into servers(created_at,updated_at,location,endpoint,mode,track,tracktheme,max_players,difficulty,is_ready) values (NOW(),NOW(),'$game_location','"$ENDPOINT"','$game_mode','$game_track','$game_theme_track','$game_max_players','$game_difficulty',1) returning id;"`
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
#/cmake_build/bin/supertuxkart --server-config=/stk-code/server_config.xml --mode $MODE --port=$game_server_dynamic_port $MISC_ARGS --difficulty=$game_difficulty --max-players=$game_max_players --track=$game_track
/cmake_build/bin/supertuxkart --server-config=/stk-code/server_config.xml --port=$game_server_dynamic_port $MISC_ARGS
