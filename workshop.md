# AWS Loft in Stockholm
This page describes the steps to be executed in the workshop. We assume you have a Github account under your control and an AWS account. If you haven't done so, pls install the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html) and git tools using your favorite distribution.  

***Safety Tip -***
*pls pay attention to the AWS region you are using in your scripts. The workshop designed to be executed in the Stockholm region but can be modifed to other supported AWS regions* 

## Environment Preparation 
In reality we are going to use two different git repos. The first is the repo that holds game-server binaries. This repo is decoupled from repositories that handles deployment and operations as it hooked to a CI system so we dont want every change in the game binaires to impact deployments of other artifacts e.g. SQS queus, DynamoDB tables. Therefore, the second repo include the “control plane” components that allocate and schedule the gameservers. e.g. Kubernetes specs, SQS queus, and DynamoDB tables. 

1. Fork the github repo from [aws-samples](https://github.com/aws-samples/containerized-game-servers). 
You will connect your git repo to your CodeBuild, the CI system we use. Therefore, you can't use git branches. 

2. Execute TBD the [create_aws_objects.sh](/workshop/env_prep/create_aws_objects.sh). 
This script will provision AWS objects like Docker image registry thru ECR to store the game-server images as well as other workloads we deploy on EKS. It will also create SQS queues for the game-server to report status e.g., `init` or `terminating`. Finally, we will create few DynamoDB tables to persist system events. 

## Creating the game-server CI pipeline
Create a CodeBuild project that builds a docker image off of the game-server binaries and assets we forked in [step 1](Environment Preparation/1). 
For creating the CodeBuild project follow the steps in the CodeBuild console. 
1. Create build project Under project config choose your favorite name. For the source config use GitHub and point to your GitHub repo you forked. For the Environment section use Managed image with Amazon Linux 2, Standard runtime and the image it offers. ***Make sure you enable the Privileged flag otherwise the `docker` command can’t be executed*** 
Under `Service Role` choose `New service role` use the name offered. Finally choose the `Use buildspec file`, and click on the create project button. 
