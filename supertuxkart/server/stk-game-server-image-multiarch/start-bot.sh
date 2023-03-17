#!/bin/bash -x

player_track=`/get-track.py`
echo export TRACK=$player_track >> /root/.bashrc

player_mode=`/get-mode.py`
echo export MODE=$player_mode >> /root/.bashrc

player_skill=`/get-player-skill.py`
echo export SKILL=$player_skill >> /root/.bashrc

player_location=`/get-location.py`
echo export SERVER_LOCATION=$player_location >> /root/.bashrc

player_difficulty=`echo $(( RANDOM % 4 ))`
echo export DIFFICULTY=$player_difficulty >> /root/.bashrc

player_max_players=`awk -v min=2 -v max=25 'BEGIN{srand(); print int(min+rand()*(max-min+1))}'`
echo export MAX_PLAYERS=$player_max_players >> /root/.bashrc

player_theme_track=`psql -A -q -t -w -c "/*start-client.sh*/select theme from trackmap where track='$player_track';"|sed 's/ //g'`
echo export TRACKTHEME=$player_theme_track >> /root/.bashrc

#if [ -z $LAPS ]; then
#  laps=`awk -v min=10 -v max=19 'BEGIN{srand(); print int(min+rand()*(max-min+1))}'`
#else
#  laps=$LAPS
#fi

if [[ $APP == 'stksrv-noml' ]]
then
  endpoint=`psql -A -q -t -w -c "/*start-client.sh*/select endpoint from servers where is_ready=1 and substr(location,1,7)=substr('"$player_location"',1,7) and max_players>num_active_session+"$NETWORK_AI" and tracktheme='$player_theme_track' order by created_at desc limit 1;"`
fi

if [[ $APP == 'stksrv-ml' ]]
then
  endpoint=`psql -A -q -t -w -c "/*start-client.sh-test-model*/select endpoint from (select endpoint,max(estimate_session_length_xg(location,track,tracktheme,mode,difficulty,'$player_difficulty','$player_location','$player_track','$player_theme_track','$player_mode','$player_skill')::NUMERIC) as estimate from servers where is_ready=1 and max_players>num_active_session+"$NETWORK_AI" and created_at>NOW()-'24 hour'::INTERVAL group by endpoint order by estimate desc limit 1) as t;"`
  endpoint=`psql -A -q -t -w -c "/*start-client.sh-test-model*/select endpoint from (select endpoint,max(ltrim(split_part(estimate_session_length_mult_clas(location,track,tracktheme,mode,difficulty,'$player_difficulty','$player_location','$player_track','$player_theme_track','$player_mode','$player_skill'),',',1),'(')::INTEGER) as estimate from servers where is_ready=1 and max_players>num_active_session+"$NETWORK_AI" and created_at>NOW()-'24 hour'::INTERVAL group by endpoint order by estimate desc limit 1) as t;"`
fi

if [ -z ${endpoint}];
then
  echo "No game servers available, waiting for one to be ready, match-miss record, placing player in lobby"
  endpoint="lobby"
fi

echo export ENDPOINT=$endpoint >> /root/.bashrc
psql -A -e -t -w -c "/*start-client.sh*/update servers set num_active_session=num_active_session+"$NETWORK_AI",updated_at=NOW() where endpoint='$endpoint';"
echo "psql exit code="$?
if (( $?>0 ))
then
  echo "ERR-DB update servers set num_active_session"
  exit 0
fi
session_id=`psql -A -q -t -w -c "/*start-client.sh*/insert into sessions(app,client_id,created_at,updated_at,location,endpoint,mode,track,tracktheme,max_players,difficulty,is_active,player_skill) values ('$APP','$POD_NAME',NOW(),NOW(),'$player_location','$endpoint','$player_mode','$player_track','$player_theme_track','$player_max_players','$player_difficulty',1,'$player_skill') returning id;"`
if [ -z "$session_id" ]
then
  echo "ERR-DB insert into sessions"
  exit 0
fi
echo export SESSION_ID=$session_id >> /root/.bashrc

if [[ $endpoint != 'lobby' ]]
then
  server_session_id=`psql -A -q -t -w -c "/*start-client.sh*/insert into server_sessions(created_at,updated_at,endpoint,s_location,s_track,s_tracktheme,s_mode,s_difficulty,p_difficulty,p_location,p_track,p_tracktheme,p_mode,p_skill) select NOW(),NOW(),endpoint,location,track,tracktheme,mode,difficulty,'$player_difficulty','$player_location','$player_track','$player_theme_track','$player_mode','$player_skill' from servers where endpoint='$endpoint' returning id;"`
  if [ -z "$server_session_id" ]
  then
    echo "ERR-DB insert into server_sessions"
    exit 0
  fi
  echo export SERVER_SESSION_ID=$server_session_id >> /root/.bashrc
fi
cd /stk-code
./cmake_build/bin/supertuxkart --connect-now=$endpoint --network-ai=$NETWORK_AI $MISC_ARGS &
/bot-game-actions-cw.sh
