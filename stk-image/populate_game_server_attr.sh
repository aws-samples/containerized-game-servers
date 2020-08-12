#!/bin/bash

echo "populate game server attr"

hostname=`curl 169.254.169.254/latest/meta-data/public-hostname`
instance_id=`curl 169.254.169.254/latest/meta-data/instance-id`
game_server_id=`uuid`
echo "export game-server for pre-stop"
echo $game_server_id > $SHARED_FOLDER/GAME_SERVER_ID
echo $instance_id > $SHARED_FOLDER/INSTANCE_ID
echo $GAME_SERVER_GROUP_NAME > $SHARED_FOLDER/GAME_SERVER_GROUP_NAME

echo "register $game_server_endpoint"
aws gamelift register-game-server --game-server-group-name $GAME_SERVER_GROUP_NAME --game-server-id $game_server_id --instance-id $instance_id
