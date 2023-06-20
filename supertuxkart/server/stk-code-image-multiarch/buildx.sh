#!/bin/bash -x
arch=$(uname -i)

GAME_CODE_IMAGE=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$GAME_REPO:$GAME_CODE_TAG
export GAME_ASSETS_IMAGE=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$GAME_REPO:$GAME_ASSETS_TAG
export BASE_IMAGE="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$BASE_REPO:$BASE_IMAGE_TAG"
cat Dockerfile.template | envsubst > Dockerfile
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $GAME_CODE_IMAGE

docker buildx use craftbuilder
docker buildx build --push --cache-to type=inline --cache-from type=registry,ref=$GAME_CODE_IMAGE --platform linux/arm64,linux/amd64 --build-arg GITHUB_STK=$GITHUB_STK --build-arg GITHUB_STK_BRANCH=$GITHUB_STK_BRANCH -t $GAME_CODE_IMAGE . 