#!/bin/bash -x

. /root/.bashrc
echo "ENDPOINT="$ENDPOINT

echo -en "\n## Caught SIGTERM\n";
echo -en "\n## deregister game-server $ENDPOINT\n";
psql -A -e -t -U postgres -w -c "update servers set is_ready=0 where endpoint='$ENDPOINT';"
aws sqs send-message --queue-url ${DEREGISTER_Q} --message-body "$ENDPOINT"
echo "psql exit code="$?
if (( $?>0 ))
then
  echo "ERR-DB"
  exit 0
fi