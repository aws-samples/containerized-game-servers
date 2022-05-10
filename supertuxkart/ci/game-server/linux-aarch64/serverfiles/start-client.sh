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

game_theme_track=`psql -A -q -t -w -c "select theme from trackmap where track='$game_track';"`
echo export TRACKTHEME=$game_theme_track >> /root/.bashrc
	
endpoint=`psql -A -q -t -w -c "select endpoint from servers where is_ready=1 and substr(location,1,7)=substr('"$game_location"',1,7) and num_active_session<"$MAXPLAYERS" and tracktheme='$game_theme_track' order by created_at desc limit 1;"`
if [ -z ${endpoint}];
then
  echo "No game servers available, waiting for one to be ready, match-miss record, adding to server_sessions"
  is_match=0
  psql -A -e -t -w -c "insert into server_sessions(created_at,updated_at,endpoint,s_location,s_track,s_tracktheme,s_mode,s_difficulty,p_difficulty,p_location,p_track,p_tracktheme,p_mode,is_match) select NOW(),NOW(),endpoint,location,track,tracktheme,mode,difficulty,'$game_difficulty','$game_location','$game_track','$game_theme_track','$game_mode','$is_match' from servers where is_ready=1;"
  echo "psql exit code="$?
  if (( $?>0 ))
  then
    echo "ERR-DB insert into server_sessions"
    exit 0
  fi
else
  is_match=1
  echo export ENDPOINT=$endpoint >> /root/.bashrc
  psql -A -e -t -w -c "update servers set num_active_session=num_active_session+"$NETWORK_AI",updated_at=NOW() where endpoint='$endpoint';"
  echo "psql exit code="$?
  if (( $?>0 ))
  then
    echo "ERR-DB update servers set num_active_session"
    exit 0
  fi
  session_id=`psql -A -e -t -w -c "insert into sessions(client_id,created_at,updated_at,location,endpoint,mode,track,tracktheme,max_players,difficulty,is_active) values ('$POD_NAME',NOW(),NOW(),'$game_location','$endpoint','$game_mode','$game_track','$game_theme_track','$game_max_players','$game_difficulty',1) returning id;"`
  echo "psql exit code="$?
  if (( $?>0 ))
  then
    echo "ERR-DB insert into sessions"
    exit 0
  fi
  echo export SESSION_ID=$session_id >> /root/.bashrc
  server_session_id=`psql -A -e -t -w -c "insert into server_sessions(created_at,updated_at,endpoint,s_location,s_track,s_tracktheme,s_mode,s_difficulty,p_difficulty,p_location,p_track,p_tracktheme,p_mode,is_match) select NOW(),NOW(),endpoint,location,track,tracktheme,mode,difficulty,'$game_difficulty','$game_location','$game_track','$game_theme_track','$game_mode','$is_match' from servers where endpoint='$endpoint' returning id;"`
  echo "psql exit code="$?
  if (( $?>0 ))
  then
    echo "ERR-DB insert into server_sessions"
    exit 0
  fi
  echo export SERVER_SESSION_ID=$server_session_id >> /root/.bashrc
  /cmake_build/bin/supertuxkart --connect-now=$endpoint --network-ai=$NETWORK_AI $MISC_ARGS &
  /pub-game-actions-cw.sh
fi
