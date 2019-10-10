#!/bin/sh 
#source ./export_locally.sh
echo "Starting the game server terminator"
if [ "${NAMESPACE}" == "" ]; then
  echo '[ERROR] Environment variable `NAMESPACE` has no value set.' 1>&2
  exit 1
fi

if [ "${POD_NAME}" == "" ]; then
  echo '[ERROR] Environment variable `POD_NAME` has no value set.' 1>&2
  exit 1
fi

if [ "${TTL}" == "" ]; then
  echo '[ERROR] Environment variable `TTL` has no value set.' 1>&2
  exit 1
fi

if [ "${FREQUENCY}" == "" ]; then
  echo '[ERROR] Environment variable `FREQUENCY` has no value set.' 1>&2
  exit 1
fi

START=`date "+%s"`
END=$(( $START+$TTL ))

while true
do
  CURRENT=`date "+%s"`
  echo "CURRENT="$CURRENT
  echo "END="$END
  if [ $CURRENT -gt $END ]; then
    echo "about to terminate the game-server as the TTL elapsed"
    kubectl delete po ${POD_NAME} -n ${NAMESPACE}
    echo "game-server is terminating"   
  fi
  echo "sleeping for ${FREQUENCY} to allow the scale operations"
  sleep ${FREQUENCY}
done
