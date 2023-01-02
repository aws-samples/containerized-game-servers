#!/bin/bash
#TODO: automate pub_repo create
docker logout public.ecr.aws
aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws  
docker build -t $BASE_IMAGE_REPO .
docker push $BASE_IMAGE_REPO
