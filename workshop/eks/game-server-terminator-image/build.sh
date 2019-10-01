#!/bin/bash

source ../account.conf
region="us-west-2"
image_name="gs-term"
repo='.dkr.ecr.'$region'.amazonaws.com/'$image_name':latest'
repo_url=$account$repo

$(aws ecr get-login --no-include-email --region $region)
docker build -t $image_name .
docker tag $image_name:latest $repo_url
docker push $repo_url
