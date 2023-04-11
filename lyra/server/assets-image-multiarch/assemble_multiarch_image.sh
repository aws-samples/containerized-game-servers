#!/bin/bash -x

GAME_ASSETS_IMAGE=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$GAME_REPO:$GAME_ASSETS_TAG
GAME_ASSETS_ARM_IMAGE=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$GAME_REPO:$GAME_ARM_ASSETS_TAG
GAME_ASSETS_AMD_IMAGE=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$GAME_REPO:$GAME_AMD_ASSETS_TAG
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $GAME_ASSETS_IMAGE

docker manifest create $GAME_ASSETS_IMAGE --amend $GAME_ASSETS_ARM_IMAGE --amend $GAME_ASSETS_AMD_IMAGE
docker manifest push $GAME_ASSETS_IMAGE
