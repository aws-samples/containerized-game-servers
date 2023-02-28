#!/bin/bash -x

. /root/.bashrc
echo "ENDPOINT="$ENDPOINT

echo -en "\n## Caught SIGTERM\n";
echo -en "\n## deregister game-server $ENDPOINT\n";

if [ "$IS_AGONES" = "True" ]; then
  curl -s -d "{}" -H "Content-Type: application/json" -X POST http://localhost:${AGONES_SDK_HTTP_PORT}/shutdown
  echo -en "called to http://localhost:${AGONES_SDK_HTTP_PORT}/shutdown"
fi

psql -A -e -t -U postgres -w -c "update servers set is_ready=0 where endpoint='$ENDPOINT';"
echo "psql exit code="$?
if (( $?>0 ))
then
  echo "ERR-DB"
  exit 0
fi
