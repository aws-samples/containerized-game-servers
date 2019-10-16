#!/bin/sh

echo "Creating docker image repositories"
aws cloudformation create-stack --stack-name ecr-repos --template-body file://./ecr-repos.json

echo "Creating queues: gameserver.fifo and spotint.fifo"
aws cloudformation create-stack --stack-name gameserver-q --template-body file://./gameserver-q.json
aws cloudformation create-stack --stack-name spotint-q --template-body file://./spotint-q.json

echo "Creating DynamoDB table latest-observations"
aws cloudformation create-stack --stack-name spotint-table --template-body file://./spotint-table.json
aws cloudformation create-stack --stack-name latest-observations-dynamodb-table --template-body file://./latest_observations-table.json
aws cloudformation create-stack --stack-name game-server-status-by-endpoint-dynamodb-table --template-body file://./game_server_status_by_endpoint-table.json

echo "Waiting for the DynamoDB table latest-observations to be created"
aws dynamodb wait table-exists --table-name latest_observations

echo "Initializing latest-observations"
aws dynamodb put-item --table-name latest_observations --item file://./init_observation.json
