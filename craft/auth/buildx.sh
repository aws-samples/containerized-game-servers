#!/bin/bash
 
INSTANCE_ARCH="multiarch" 
REPO="authapp"
repo_name='.dkr.ecr.'${AWS_REGION}'.amazonaws.com/'$REPO':py39'${INSTANCE_ARCH}'64'
repo_url=${AWS_ACCOUNT_ID}$repo_name

aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin $repo_url
docker buildx use craftbuilder
docker buildx build --push --cache-to type=inline --cache-from type=registry,ref=$repo_url --platform linux/arm64,linux/amd64 -t $repo_url .
