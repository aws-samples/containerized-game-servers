#!/bin/bash -x

GAME_SERVER_IMAGE=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$GAME_REPO:$GAME_SERVER_TAG
GAME_ARM_SERVER_IMAGE=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$GAME_REPO:$GAME_ARM_SERVER_TAG
GAME_AMD_SERVER_IMAGE=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$GAME_REPO:$GAME_AMD_SERVER_TAG
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $GAME_SERVER_IMAGE

docker manifest create $GAME_SERVER_IMAGE --amend $GAME_ARM_SERVER_IMAGE --amend $GAME_AMD_SERVER_IMAGE
docker manifest push $GAME_SERVER_IMAGE
