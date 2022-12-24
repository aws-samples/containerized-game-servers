#!/bin/bash
  
account=$(aws sts get-caller-identity --output text --query Account)
region="us-west-2"
repo="craftci"
repo_name='.dkr.ecr.'$region'.amazonaws.com/'$repo':aarch64py3agones'
repo_url=$account$repo_name
#docker rmi `docker images| grep $repo | awk '{print $3}'` --force
aws ecr get-login-password --region $region | docker login --username AWS --password-stdin $repo_url
docker build -t $repo_url --build-arg GITHUB_CRAFT_BRANCH=$GITHUB_CRAFT_BRANCH -f ./Dockerfile .
docker push $repo_url
