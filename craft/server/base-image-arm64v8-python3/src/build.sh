#!/bin/bash

BASE_IMAGE_REPO=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$BASE_IMAGE:$BASE_IMAGE_TAG

aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $BASE_IMAGE_REPO
docker build -t $BASE_IMAGE_REPO .
docker push $BASE_IMAGE_REPO
