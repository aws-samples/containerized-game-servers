#!/bin/bash 
echo "Starting stk sidecar"

if [ "${WAIT_TO_PLAYERS}" == "" ]; then
  echo '[ERROR] Env variable WAIT_TO_PLAYERS has no value set' 1>&2
  exit 1
fi
if [ "${FREQ_CHECK_SESSION}" == "" ]; then
  echo '[ERROR] Env variable FREQ_CHECK_SESSION has no value set' 1>&2
  exit 1
fi
if [ "${NUM_IDLE_SESSION}" == "" ]; then
  echo '[ERROR] Env variable NUM_IDLE_SESSION has no value set' 1>&2
  exit 1
fi

sleep ${WAIT_TO_PLAYERS}
tcpdump -l -n udp port 8080 > /capture_file &
/monitor_session.sh 
