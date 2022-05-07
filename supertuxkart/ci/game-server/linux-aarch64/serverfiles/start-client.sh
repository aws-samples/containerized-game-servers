#!/bin/bash -x
	
if [ -z ${GAME_MODE+x} ];
then
  GAME_MODE=0
fi
endpoint=`psql -A -q -t -w -c "select endpoint from servers where is_ready=1 and num_active_session<"$MAXPLAYERS" order by created_at desc limit 1;"`
if [ -z ${endpoint}];
then
  echo "No game servers available, waiting for one to be ready"
else
  echo export ENDPOINT=$endpoint >> /root/.bashrc
  psql -A -e -t  -w -c "update servers set num_active_session=num_active_session+"$NETWORK_AI",updated_at=NOW() where endpoint='$endpoint';"
  echo "psql exit code="$?
  if (( $?>0 ))
  then
    echo "ERR-DB"
    exit 0
  fi
  /cmake_build/bin/supertuxkart --connect-now=$endpoint --network-ai=$NETWORK_AI --connection-debug --auto-connect --owner-less &
  /pub-game-actions-cw.sh
fi
