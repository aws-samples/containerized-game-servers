#!/bin/bash -x

GAME_SERVER_IMAGE=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$GAME_REPO:$GAME_SERVER_TAG
export GAME_CODE_IMAGE="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$GAME_REPO:$GAME_CODE_TAG"
cat Dockerfile.template | envsubst > Dockerfile
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $GAME_SERVER_IMAGE
docker buildx use craftbuilder
docker buildx build --push --platform linux/arm64,linux/amd64  -t $GAME_SERVER_IMAGE . 
