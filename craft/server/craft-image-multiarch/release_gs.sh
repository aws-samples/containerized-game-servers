#!/bin/bash -x

export PGUSER=`cat $SECRET_FILE | jq -r '.username'`
export PGDATABASE=`cat $SECRET_FILE | jq -r '.username'`
export PGPASSWORD=`cat $SECRET_FILE | jq -r '.password'`
export PGHOST=`cat $SECRET_FILE | jq -r '.host'`
export PGPORT=`cat $SECRET_FILE | jq -r '.port'`

game_server_end_point=$(curl -s -H "Content-Type: application/json" -X GET http://localhost:${AGONES_SDK_HTTP_PORT}/gameserver | jq '.status | .address + " " + (.ports[].port|tostring)')

psql -A -q -t -w -c "
/*monitor_active_game_sessions*/ update game_server_pool set updated_at=NOW(),status=0 where pod='""$MY_POD_NAME""';
"
echo "psql exit code="$?

echo "remove /tmp/healthy to execlude from NLB target group"
rm /tmp/healthy
