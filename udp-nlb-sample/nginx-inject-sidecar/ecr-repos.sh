#!/bin/sh

echo "Creating docker image repositories"
aws cloudformation create-stack --stack-name ecr-repos-nginx-sidecar-injector --template-body file://./ecr-repos.json
