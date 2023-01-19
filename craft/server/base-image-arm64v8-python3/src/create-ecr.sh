#!/bin/sh
  
echo "Creating docker image repositories"
cat ecr-baseimage-repos.json.template | envsubst > ecr-baseimage-repos.json
aws cloudformation create-stack --stack-name ecr-baseimage-repos --template-body file://./ecr-baseimage-repos.json
