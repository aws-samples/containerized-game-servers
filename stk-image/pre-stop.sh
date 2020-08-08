#!/bin/bash

echo  "## Caught SIGTERM"
echo  "## deregister game-server comes here"
game_server_id=`cat $SHARED_FOLDER/GAME_SERVER_ID`
game_server_name=`cat $SHARED_FOLDER/GAME_SERVER_GROUP_NAME`

aws gamelift deregister-game-server --game-server-group-name $game_server_name --game-server-id $game_server_id 
exit $?
