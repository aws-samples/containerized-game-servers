#!/bin/bash
  
account=$(aws sts get-caller-identity --output text --query Account)
region="us-west-2"
repo="craftci"
repo_name='.dkr.ecr.'$region'.amazonaws.com/'$repo':aarch64py2'
repo_url=$account$repo_name

aws ecr get-login-password --region $region | docker login --username AWS --password-stdin $repo_url
docker build -t $repo_url -f ./Dockerfile-aarch64-py2 .
docker push $repo_url
