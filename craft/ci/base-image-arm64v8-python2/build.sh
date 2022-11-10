#!/bin/bash
account=$(aws sts get-caller-identity --output text --query Account)
region="us-west-2"
repo="craft-base-image"

priv_repo_name='.dkr.ecr.'$region'.amazonaws.com/'$repo':arm64v8-python-2'
priv_repo_url=$account$repo_name

pub_repo_url="public.ecr.aws/m2l1d0b2/arm64v8-python-2"
aws ecr get-login-password --region $region | docker login --username AWS --password-stdin $priv_repo_url
docker build -t $pub_repo_url .

docker logout public.ecr.aws
aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws  
docker push $pub_repo_url
