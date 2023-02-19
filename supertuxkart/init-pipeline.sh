#!/bin/bash

npm install aws-cdk-lib
. ~/.bash_profile
cdk bootstrap aws://$AWS_ACCOUNT_ID/$AWS_REGION
npm install
cdk deploy --app "npx ts-node --prefer-ts-exts ./pipeline.ts" --parameters BASEREPO=$BASE_REPO --parameters BASEIMAGETAG=$BASE_IMAGE_TAG --parameters CODECOMMITREPO=$CODE_COMMIT_REPO --parameters GAMEREPO=$GAME_REPO --parameters GAMEASSETSTAG=$GAME_ASSETS_TAG --parameters SVNSTK=$SVN_STK --parameters GITHUBSTK=$GITHUB_STK --parameters GITHUBSTKBRANCH=$GITHUB_STK_BRANCH --parameters GAMECODETAG=$GAME_CODE_TAG --parameters GAMESERVERTAG=$GAME_SERVER_TAG
