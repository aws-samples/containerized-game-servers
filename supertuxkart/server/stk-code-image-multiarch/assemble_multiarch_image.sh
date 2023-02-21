#!/bin/bash -x

GAME_CODE_IMAGE=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$GAME_REPO:$GAME_CODE_TAG
GAME_CODE_ARM_IMAGE=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$GAME_REPO:$GAME_ARM_CODE_TAG
GAME_CODE_AMD_IMAGE=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$GAME_REPO:$GAME_AMD_CODE_TAG
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $GAME_CODE_IMAGE

docker manifest create $GAME_CODE_IMAGE --amend $GAME_CODE_ARM_IMAGE --amend $GAME_CODE_AMD_IMAGE
docker manifest push $GAME_CODE_IMAGE
