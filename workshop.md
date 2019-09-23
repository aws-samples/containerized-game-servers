# AWS Loft in Stockholm
This page describes the steps to be executed in the workshop. We assume you have github repository under you control and an AWS account. If you haven't done so, pls install the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html) and git tools using your favorite distribution.  

***Safety Tip -***
*pls pay attention to the AWS region you are using in your scripts. The workshop designed to be executed in the Stockholm region but can be modifed to other supported AWS regions* 

## Environment Preparation 
In reality we are going to use two different git repos. The first is the repo that holds game-server binaries. This repo is decoupled from repositories that handles deployment and operations as it hooked to a CI system so we dont want every change in the game binaires to impact deployments of other artifacts e.g. SQS queus, DynamoDB tables. Therefore, the second repo include the “control plane” components that allocate and schedule the gameservers. e.g. Kubernetes specs, SQS queus, and DynamoDB tables. 

1. Fork the github repo from [aws-samples](https://github.com/aws-samples/containerized-game-servers). 
You will connect your git repo to your CodeBuild, the CI system we use. Therefore, you can't use git branches. 

2. Execute TBD the [create_aws_objects.sh](/workshop/env_prep/create_aws_objects.sh). 
This script will provision AWS objects like Docker image registry thru ECR to store the game-server images as well as other workloads we deploy on EKS. It will also create SQS queues for the game-server to report status e.g., `init` or `terminating`. Finally, we will create few DynamoDB tables to persist system events. 

3. 
