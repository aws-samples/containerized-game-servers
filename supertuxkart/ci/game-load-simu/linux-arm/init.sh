#!/bin/bash

account=$(aws sts get-caller-identity --output text --query Account)
region=$(grep region ~/.aws/config | awk -F\= '{print $2}' | sed 's/ //g')
npm install aws-cdk-lib
. ~/.bash_profile
cdk bootstrap aws://$account/$region
npm install
cdk deploy --parameters notificationEmail=birayaha@amazon.com --parameters gitRepoName=game-load-simu
