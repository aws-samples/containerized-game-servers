#!/bin/bash

echo "Starting monitor sessions"

capture_file="/capture_file"
num_of_no_session_events=0

game_server_id=`cat $SHARED_FOLDER/GAME_SERVER_ID`
instance_id=`cat $SHARED_FOLDER/INSTANCE_ID`
game_server_name=`cat $SHARED_FOLDER/GAME_SERVER_GROUP_NAME`

echo "reading  game server attr from shared folder"
echo game_server_name=$game_server_name
echo instance_id=$instance_id
echo game_server_id=$game_server_id

while true
do
  current_time=`date '+%H:%M'`
  num_of_packet=`wc -l $capture_file | awk '{print $1}'`
  if [ "$num_of_packet" -ge 1 ]; then 
    last_session_packet_time=`tail -1 $capture_file| awk -F\: '{print $1":"$2}'`
    if [ "$current_time" != "$last_session_packet_time" ]; then
      (( num_of_no_session_events += 1 ))
      echo num_of_no_session_events=$num_of_no_session_events
      if [ "$num_of_no_session_events" -ge "$NUM_IDLE_SESSION" ]; then 
        echo "no acvite sessions in the last $FREQ_CHECK_SESSION*$num_of_no_session_events seconds, going to terminate the game server"
        echo aws gamelift deregister-game-server --game-server-group-name $game_server_name --game-server-id $game_server_id
        echo kubectl delete pod $POD_NAME -n $NAMESPACE
      fi
    fi
    echo $current_time $last_session_packet_time
    echo aws gamelift update-game-server --game-server-group-name $game_server_name --game-server-id $game_server_id --utilization-status "UTILIZED"
  fi
  curl -d "{}" -H "Content-Type: application/json" -X POST http://localhost:${AGONES_SDK_HTTP_PORT}/health
  echo aws gamelift update-game-server --game-server-group-name $game_server_name --game-server-id $game_server_id --health-check "HEALTHY"
  sleep ${FREQ_CHECK_SESSION}
done
