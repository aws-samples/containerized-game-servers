# Continuously deliver art and code changes with CodeBuild

This sample pulls the latest docker images from the game docker registry (ECR) and deploys it to EKS. 

# How to start?

Install and configure AWS CLI to resolve the current region and account numbers

Install NPM and CDK

Configure the notification email you wish to get notifications about build status

- Create an EKS cluster as stated in the README
- Execute `cdk deploy --parameters clusterName=stk-gameservers  --parameters ecrRepoName=stk`
- Give permissions to CodeBuild to deploy to EKS. e.g: `eksctl create iamidentitymapping --cluster stk-gameservers --region us-east-2 --arn arn:aws:iam::742301976366:role/codeBuildEKSDeployRole --group system:masters`

# What does it do?

CDK will provision a new CodePipeline and docker build stage to deploy the game server and game test clients to EKS. 