#!/bin/bash -x

. /root/.bashrc
echo "ENDPOINT="$ENDPOINT
echo "SESSION_ID="$SESSION_ID
	
echo -en "\n## Caught SIGTERM\n";
echo -en "\n## deregister game-server $ENDPOINT\n";
psql -A -e -t -U postgres -w -c "update servers set num_active_session=num_active_session-"$NETWORK_AI" where endpoint='$ENDPOINT';"
echo "psql exit code="$?
if (( $?>0 ))
then
  echo "ERR-DB update servers set num_active_session"
  exit 0
fi
psql -A -e -t -U postgres -w -c "update sessions set session_length=updated_at-created_at,is_active=0 where id='$SESSION_ID';"
echo "psql exit code="$?
if (( $?>0 ))
then
  echo "ERR-DB update sessions set num_active_session"
  exit 0
fi
psql -A -e -t -U postgres -w -c "update server_sessions set session_length=updated_at-created_at,is_active=0 where id='$SERVER_SESSION_ID';"
echo "psql exit code="$?
if (( $?>0 ))
then
  echo "ERR-DB update sessions set num_active_session"
  exit 0
fi
