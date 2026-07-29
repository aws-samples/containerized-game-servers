#!/bin/bash -x

# Env-driven so the CDK CodeBuild project can build/push into the deploying
# account, while manual runs still work via the fallbacks below.
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID:-$(aws sts get-caller-identity --output text --query Account)}
AWS_REGION=${AWS_REGION:-us-west-2}
SPOTSIG_REPO=${SPOTSIG_REPO:-spotsig}
SPOTSIG_TAG=${SPOTSIG_TAG:-aarch64}

SPOTSIG_IMAGE=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$SPOTSIG_REPO:$SPOTSIG_TAG

aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $SPOTSIG_IMAGE
docker build -t $SPOTSIG_IMAGE .
docker push $SPOTSIG_IMAGE
