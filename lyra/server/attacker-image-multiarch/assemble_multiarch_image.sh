#!/bin/bash -x

GAME_ATTACKER_IMAGE=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$GAME_REPO:$GAME_ATTACKER_TAG
GAME_ATTACKER_ARM_IMAGE=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$GAME_REPO:$GAME_ARM_ATTACKER_TAG
GAME_ATTACKER_AMD_IMAGE=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$GAME_REPO:$GAME_AMD_ATTACKER_TAG
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $GAME_ATTACKER_IMAGE

docker manifest create $GAME_ATTACKER_IMAGE --amend $GAME_ATTACKER_ARM_IMAGE --amend $GAME_ATTACKER_AMD_IMAGE
docker manifest push $GAME_ATTACKER_IMAGE
