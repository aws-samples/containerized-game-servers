#!/bin/bash -x

game_track=`/get-track.py`
echo export TRACK=$game_track >> /root/.bashrc

game_mode=`/get-mode.py`
echo export MODE=$game_mode >> /root/.bashrc

game_location=`/get-location.py`
echo export SERVER_LOCATION=$game_location >> /root/.bashrc

game_difficulty=`echo $(( RANDOM % 4 ))`
echo export DIFFICULTY=$game_difficulty >> /root/.bashrc

game_max_players=`awk -v min=2 -v max=25 'BEGIN{srand(); print int(min+rand()*(max-min+1))}'`
echo export MAX_PLAYERS=$game_max_players >> /root/.bashrc
	
endpoint=`psql -A -q -t -w -c "select endpoint from servers where is_ready=1 and substr(location,1,7)=substr('"$game_location"',1,7) and num_active_session<"$MAXPLAYERS" order by created_at desc limit 1;"`
if [ -z ${endpoint}];
then
  echo "No game servers available, waiting for one to be ready, TBD match-miss record, need to add to the db fro ml training"
  echo " if no match found, record the miss of all active servers with this client attributes as miss."
else
  echo export ENDPOINT=$endpoint >> /root/.bashrc
  psql -A -e -t -w -c "update servers set num_active_session=num_active_session+"$NETWORK_AI",updated_at=NOW() where endpoint='$endpoint';"
  echo "psql exit code="$?
  if (( $?>0 ))
  then
    echo "ERR-DB update servers set num_active_session"
    exit 0
  fi
  psql -A -e -t -w -c "insert into sessions(client_id,created_at,updated_at,location,endpoint,mode,track,max_players,difficulty) values ('$POD_NAME',NOW(),NOW(),'$game_location','$endpoint','$game_mode','$game_track','$game_max_players','$game_difficulty') returning id;"
  echo "psql exit code="$?
  if (( $?>0 ))
  then
    echo "ERR-DB insert into sessions"
    exit 0
  fi
  /cmake_build/bin/supertuxkart --connect-now=$endpoint --network-ai=$NETWORK_AI $MISC_ARGS &
  /pub-game-actions-cw.sh
fi
