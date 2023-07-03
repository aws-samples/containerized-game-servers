#!/bin/bash

NGINX_IMAGE=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$GAME_REPO:nginx
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $NGINX_IMAGE

docker buildx use gamebuilder
docker buildx build --push --platform linux/arm64,linux/amd64 -t $NGINX_IMAGE . 
