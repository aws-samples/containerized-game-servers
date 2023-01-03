#!/bin/sh
  
echo "Creating docker image repositories"
aws cloudformation create-stack --stack-name ecr-authapp-repos --template-body file://./ecr-auth-app-repos.json
