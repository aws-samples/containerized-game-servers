#!/bin/bash -x
echo `date`
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

game_theme_track=`psql -A -q -t -w -c "/*start-server.sh*/select theme from trackmap where track='$game_track';"|sed 's/ //g'`
echo export TRACKTHEME=$game_theme_track >> /root/.bashrc

game_max_players=`awk -v min=36 -v max=64 'BEGIN{srand(); print int(min+rand()*(max-min+1))}'`
echo export MAX_PLAYERS=$game_max_players >> /root/.bashrc

laps=`awk -v min=10 -v max=19 'BEGIN{srand(); print int(min+rand()*(max-min+1))}'`

PUBLIC_IPV4=`/get-public-ipv4.py`
echo export UDP_SOCKET_IP=$PUBLIC_IPV4 >> /root/.bashrc
ENDPOINT=$PUBLIC_IPV4:$game_server_dynamic_port
echo export ENDPOINT=$ENDPOINT >> /root/.bashrc
id=`psql -A -q -t -w -c "/*start-server.sh*/insert into servers(created_at,updated_at,location,endpoint,mode,track,tracktheme,max_players,difficulty,is_ready,pod_name) values (NOW(),NOW(),'$game_location','"$ENDPOINT"','$game_mode','$game_track','$game_theme_track','$game_max_players','$game_difficulty',1,'$POD_NAME') returning id;"`
echo "psql exit code="$?
if [ -z "$id" ]
then
  echo "ERR-DB"
fi

echo export SERVER_ID=$id >> /root/.bashrc

cd /stk-code
/cmake_build/bin/supertuxkart --server-config=/stk-code/server_config.xml --port=$game_server_dynamic_port $MISC_ARGS --difficulty=$game_difficulty --max-players=$game_max_players --track=$game_track --laps=$laps
