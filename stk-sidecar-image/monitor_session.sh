#!/bin/bash

echo "Starting monitor sessions"

num_of_no_session_events=0

while true
do
  current_time=`date '+%H:%M'`
  last_session_packet_time=`tail -1 capture_file| awk -F\: '{print $1":"$2}'`
  if [ "$current_time" != "$last_session_packet_time" ]; then
    (( num_of_no_session_events += 1 ))
    echo num_of_no_session_events=$num_of_no_session_events
    if [ "$num_of_no_session_events" -ge "$NUM_IDLE_SESSION" ]; then 
      echo "no acvite sessions in the last $FREQ_CHECK_SESSION*$num_of_no_session_events seconds, going to terminate the game server"
      kubectl delete pod $POD_NAME -n $NAMESPACE
    fi
  fi
  echo $current_time $last_session_packet_time
  sleep ${FREQ_CHECK_SESSION}
done
