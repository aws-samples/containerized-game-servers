#!/bin/bash -x
GAME_SERVER_IMAGE=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$GAME_REPO:$GAME_SERVER_TAG
export GAME_CODE_IMAGE="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$GAME_REPO:$GAME_CODE_TAG"
export GAME_ASSETS_IMAGE="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$GAME_REPO:$GAME_ASSETS_TAG"
export BASE_IMAGE="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$BASE_REPO:$BASE_IMAGE_TAG"
cat Dockerfile.template | envsubst > Dockerfile
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $GAME_SERVER_IMAGE
docker buildx use craftbuilder
docker buildx build --push --cache-to type=inline --cache-from type=registry,ref=$GAME_SERVER_IMAGE --platform linux/amd64,linux/arm64  -t $GAME_SERVER_IMAGE . 
#docker build -t $GAME_SERVER_IMAGE . 
#docker push $GAME_SERVER_IMAGE
