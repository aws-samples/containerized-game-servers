#!/bin/bash 

GAME_IMAGE_REPO=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$GAME_IMAGE:$GAME_IMAGE_TAG
export BASE_IMAGE_REPO="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$BASE_IMAGE:$BASE_IMAGE_TAG"
cat Dockerfile.template | envsubst > Dockerfile
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $GAME_IMAGE_REPO
docker build --build-arg GITHUB_CRAFT=$GITHUB_CRAFT --build-arg GITHUB_CRAFT_BRANCH=$GITHUB_CRAFT_BRANCH -t $GAME_IMAGE_REPO -f ./Dockerfile . 
docker push $GAME_IMAGE_REPO
