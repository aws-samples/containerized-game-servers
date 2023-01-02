#!/bin/bash
  
repo="authapp"
repo_name='.dkr.ecr.'${AWS_REGION}'.amazonaws.com/'$repo':py39'${INSTANCE_ARCH}'64'
repo_url=${AWS_ACCOUNT_ID}$repo_name

aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin $repo_url
docker build -t $repo_url .
docker push $repo_url
