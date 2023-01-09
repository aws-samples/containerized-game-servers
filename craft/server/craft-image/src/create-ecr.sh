#!/bin/sh
  
echo "Creating docker image repositories"
aws cloudformation create-stack --stack-name ecr-craft-image-repo --template-body file://./ecr-craft-repo.json
