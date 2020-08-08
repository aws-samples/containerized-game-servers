#!/bin/bash

echo "Starting monitor sessions"

num_of_no_session_events=0

game_server_id=`cat $SHARED_FOLDER/GAME_SERVER_ID`
instance_id=`cat $SHARED_FOLDER/INSTANCE_ID`
game_server_name=`cat $SHARED_FOLDER/GAME_SERVER_GROUP_NAME`

echo "reading from shared folder"
echo $game_server_name
echo $instance_id
echo $game_server_id

while true
do
  current_time=`date '+%H:%M'`
  last_session_packet_time=`tail -1 capture_file| awk -F\: '{print $1":"$2}'`
  if [ "$current_time" != "$last_session_packet_time" ]; then
    (( num_of_no_session_events += 1 ))
    echo num_of_no_session_events=$num_of_no_session_events
    if [ "$num_of_no_session_events" -ge "$NUM_IDLE_SESSION" ]; then 
      echo "no acvite sessions in the last $FREQ_CHECK_SESSION*$num_of_no_session_events seconds, going to terminate the game server"
      aws gamelift update-game-server --game-server-group-name $game_server_name --game-server-id $game_server_id --utilization-status "AVAILABLE"
      kubectl delete pod $POD_NAME -n $NAMESPACE
    fi
  fi
  echo $current_time $last_session_packet_time
  sleep ${FREQ_CHECK_SESSION}
  aws gamelift update-game-server --game-server-group-name $game_server_name --game-server-id $game_server_id --utilization-status "UTILIZED"
done
