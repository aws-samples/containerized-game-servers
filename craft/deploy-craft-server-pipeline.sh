#!/bin/bash

npm install aws-cdk-lib
. ~/.bash_profile
cdk bootstrap aws://$AWS_ACCOUNT_ID/$AWS_REGION
npm install
cdk deploy --app "npx ts-node --prefer-ts-exts ./craft-pipeline.ts" --parameters BUILDXVER=$BUILDX_VER --parameters BASEREPO=$BASE_REPO --parameters BASEIMAGETAG=$BASE_IMAGE_TAG  --parameters GAMEREPO=$GAME_REPO --parameters GITHUBCRAFT=$GITHUB_CRAFT --parameters GITHUBCRAFTBRANCH=$GITHUB_CRAFT_BRANCH --parameters GAMEARMCODETAG=$GAME_ARM_CODE_TAG --parameters GAMEAMDCODETAG=$GAME_AMD_CODE_TAG  --parameters GAMECODETAG=$GAME_CODE_TAG
