#!/bin/sh

echo "Configure iam access to repo and sqs"
aws iam create-policy \
    --policy-name craftIAMPolicy \
    --policy-document file://craft_iam_policy.json

eksctl create iamserviceaccount \
  --cluster=${CLUSTER_NAME} \
  --namespace=default \
  --name=adaptivecraft \
  --role-name "CraftRole" \
  --attach-policy-arn=arn:aws:iam::${AWS_ACCOUNT_ID}:policy/craftIAMPolicy \
  --approve
