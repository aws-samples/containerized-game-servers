#!/bin/sh

echo "Creating docker image registries"
aws ecr create-repository --repository-name autopilot
aws ecr create-repository --repository-name spot-sig-handler
aws ecr create-repository --repository-name minecraft-server
aws ecr create-repository --repository-name multiplayersample-build


echo "Creating queues: gameserver.fifo and spotint.fifo"
aws cloudformation create-stack --stack-name gameserver-dynamodb-q --template-body file://./gameserver.json
aws cloudformation create-stack --stack-name spotint-dynamodb-q --template-body file://./spotint.json

echo "Creating DyanmoDB table latest-observations" 
aws cloudformation create-stack --stack-name latest-observations-dynamodb-table --template-body file://./latest_observations.json
aws cloudformation create-stack --stack-name game-server-status-by-endpoint-dynamodb-table --template-body file://./game_server_status_by_endpoint.json

echo "Waiting for the DyanmoDB table latest-observations to be created"
sleep 120

echo "Initializing latest-observations" 
aws dynamodb put-item --table-name latest_observations --item file://./init_observation.json
