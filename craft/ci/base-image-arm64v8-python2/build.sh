#!/bin/bash
aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws  
account=$(aws sts get-caller-identity --output text --query Account)
region="us-west-2"
repo="craft-base-image"
#repo_name='.dkr.ecr.'$region'.amazonaws.com/'$repo':arm64v8-python-2'
#repo_url=$account$repo_name
repo_url="public.ecr.aws/y4b6s6y1/arm64v8-python-2"
aws ecr get-login-password --region $region | docker login --username AWS --password-stdin $repo_url
docker build -t $repo .
docker tag $repo:latest $repo_url
docker push $repo_url
