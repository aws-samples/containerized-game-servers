#!/bin/bash -x

GAME_ASSETS_IMAGE=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$GAME_REPO:$GAME_ASSETS_TAG
export BASE_IMAGE="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$BASE_REPO:$BASE_IMAGE_TAG"
cat Dockerfile.template | envsubst > Dockerfile
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $GAME_ASSETS_IMAGE

docker build --build-arg S3_LYRA_ASSETS=$S3_LYRA_ASSETS -t $GAME_ASSETS_IMAGE .
docker push $GAME_ASSETS_IMAGE
