#!/bin/bash

npm install aws-cdk-lib
. ~/.bash_profile
cdk bootstrap aws://$AWS_ACCOUNT_ID/$AWS_REGION
npm install
cdk deploy --app "npx ts-node --prefer-ts-exts ./spot-sig-pipeline.ts" --parameters SPOTSIGREPO=$SPOTSIG_REPO --parameters SPOTSIGTAG=$SPOTSIG_TAG --parameters GITHUBUSER=$GITHUB_USER --parameters GITHUBREPO=$GITHUB_REPO --parameters GITHUBBRANCH=$GITHUB_BRANCH
