#!/bin/bash 


if [ "${FREQ_CHECK_SESSION}" == "" ]; then
  echo '[ERROR] Env variable FREQ_CHECK_SESSION has no value set' 1>&2
  exit 1
fi
if [ "${NUM_IDLE_SESSION}" == "" ]; then
  echo '[ERROR] Env variable NUM_IDLE_SESSION has no value set' 1>&2
  exit 1
fi
/populate_game_server_attr.sh 1>&2 
tcpdump -l -n udp port 8080 > /capture_file &
/monitor_session.sh 1>&2 &
/home/supertuxkart/stk-code/start-server.sh 1>&2
