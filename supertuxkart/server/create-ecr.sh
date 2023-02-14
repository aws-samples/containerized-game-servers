#!/bin/sh
  
echo "Creating docker image repositories"
aws cloudformation create-stack --stack-name ecr-stk-image-repo --template-body file://./ecr-stk-repo.json
