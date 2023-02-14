#!/bin/bash -x

GAME_IMAGE_REPO=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$GAME_IMAGE:$GAME_IMAGE_TAG
export BASE_IMAGE_REPO="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$BASE_IMAGE:$BASE_IMAGE_TAG"
cat Dockerfile.template | envsubst > Dockerfile
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $GAME_IMAGE_REPO

docker buildx use craftbuilder
docker buildx build --push --platform linux/arm64,linux/amd64 --build-arg SVN_STK=$SVN_STK --build-arg GITHUB_STK=$GITHUB_STK --build-arg GITHUB_STK_BRANCH=$GITHUB_CRAFT_BRANCH -t $GAME_IMAGE_REPO . 
