#!/bin/bash 
echo "Starting stk sidecar"

if [ "${WAIT_TO_PLAYERS}" == "" ]; then
  echo '[ERROR] Env variable WAIT_TO_PLAYERS has no value set' 1>&2
  exit 1
fi

sleep ${WAIT_TO_PLAYERS}
tcpdump -l -n udp port 8080 > /capture_file &
