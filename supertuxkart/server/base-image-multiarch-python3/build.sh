#!/bin/bash -x
BASE_IMAGE=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$BASE_REPO:$BASE_IMAGE_TAG
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $BASE_IMAGE
docker buildx use craftbuilder
docker buildx build --push --platform linux/arm64,linux/amd64 -t $BASE_IMAGE .
