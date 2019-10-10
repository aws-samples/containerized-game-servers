# AWS Loft Gaming Day (Stockholm, Oct. 2019)
This page describes the steps to be executed in the workshop. We assume you have a Github account under your control and an AWS account. 

## Environment Preparation 
In reality we are going to use two different git repos. The first is the repo that holds game-server binaries. This repo is decoupled from repositories that handles deployment and operations as it hooked to a CI system so we dont want every change in the game binaires to impact deployments of other artifacts e.g. SQS queus, DynamoDB tables. Therefore, the second repo include the “control plane” components that allocate and schedule the gameservers. e.g. Kubernetes specs, SQS queus, and DynamoDB tables. In this workshop, we are going to use one repo only.

### Workspace preparation
1. Fork the github repo from [aws-samples](https://github.com/aws-samples/containerized-game-servers). 
You will connect your git repo to your CodeBuild, the CI system we use. Therefore, you can't use git branches. 
2. Create a Cloud9 Environment in `eu-central-1` (Frankfurt region). Using the [link](https://us-west-2.console.aws.amazon.com/cloud9/home?region=eu-central-1). Name it `games-loft-workshop`. Choose the `t2.micro` instance. Cloud will spin up an EC2 instance in your account in `eu-central-1`. 
3. Create an admin role to assign the cloud9 workspace so we can provision the required resources (EKS cluster, SQS queues, DynamoDB tables, ECR registries and more). Click [here](https://console.aws.amazon.com/iam/home?region=eu-central-1#/roles$new?step=type). Under ***Choose the service that will use this role*** choose EC2. Click next and add the first role **AdministratorAccess**. Finally, assign this role to the EC2 instance that runs your Cloud9 workspace. Go to the [EC2 instances page](https://eu-central-1.console.aws.amazon.com/ec2/v2/home?region=eu-central-1#Instances:sort=instanceId) and choose the instance that its name starts with *aws-cloud9*. Then *Actions->Instance Settings->Attach/Replace IAM Role* and assign the role created.
* Cloud9 normally manages IAM credentials dynamically. This isn’t currently compatible with the EKS IAM authentication, so we will disable it and rely on the IAM role instead. Therefore, we are going to disable the assigned Cloud9 credentials as indicated in the ![image](/images/cloud9-iam-disable.png) below. 
4. Execute the script [workspace_prep.sh](/workshop/env_prep/workspace_prep.sh) via the Cloud9 workspace. *Please note that there few messages prompts during the ssh key generator install*
5. Execute the script [create_aws_objects.sh](/workshop/env_prep/create_aws_objects.sh) via the Cloud9 workspace.
This script will provision AWS objects like Docker image registry thru ECR to store the game-server images as well as other workloads we deploy on EKS. It will also create SQS queues for the game-server to report status e.g., `init` or `terminating`. Finally, we will create few DynamoDB tables to persist system events. 

***Safety Tip -***
*pls pay attention to the AWS region you are using in your scripts. The workshop designed to be executed in the Frankfurt region but can be modifed to other supported AWS regions* 


## Creating the game-server CI pipeline
Create a CodeBuild project that builds a docker image off of the game-server binaries and assets we forked in [step 1](Environment Preparation/1). Before creating the project. Make sure you have the region and account number in [buildspec.yml](buildspec.yml) correct. Should be `eu-central-1` and your AWS account number.
For creating the CodeBuild project follow the steps in the CodeBuild console. 
1. Create build project Under project config choose your favorite name. 
2. For the source config use GitHub and point to your GitHub repo you forked. For the Environment section use Managed image with Amazon Linux 2, Standard runtime and the image it offers. ***Make sure you enable the Privileged flag otherwise the `docker` command can’t be executed*** 
3. Under `Service Role` choose `New service role` use the name offered and capture it for the next step. Finally choose the `Use buildspec file`, and click on the create project button. 
4. After the CodeBuild project has been created we need to grant the service permissions to authenticate ECR so it can push the game-server images. Therefore, go to IAM console and search the service role created with the project and add inline policy that allows `Elastic Container Registry` to execute `GetAuthorizationToken`. The JSON policy should look like:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "ecr:InitiateLayerUpload",
                "ecr:UploadLayerPart",
                "ecr:CompleteLayerUpload",
                "ecr:BatchCheckLayerAvailability",
                "ecr:PutImage"            ],
            "Resource": "arn:aws:ecr:region:account:repository/multiplayersample-build"
        },
        {
            "Sid": "VisualEditor1",
            "Effect": "Allow",
            "Action": "ecr:GetAuthorizationToken",
            "Resource": "*"
        }
    ]
}
```

4. By now we have our game binaries and assets in GitHub and our build scripts in CodeBuild. The next step is to pipeline the build process so it will be triggered by updates made to the game binaries and assets. We do it be adding a CodePipeline project. 
Start with Create pipeline, ***choose the service role we created*** and modified in the CodeBuild project. 
The source stage will use the code commit details and use the defaults. The build provider should be CodeBuild pointing to the project we just created. Skip the deploy step as EKS will handle that for us. Review and create pipeline. At this point, the pipeline will perform the first build and push the game-server binaries to ECR. This step should take 10-15 minutes so please move to the next step.

## The EKS cluster setup 
The recommended EKS cluster setup is listed in https://docs.aws.amazon.com/eks/latest/userguide/create-cluster.html 
For that you need to install `eksctl`
1. Install [eksctl tool](https://docs.aws.amazon.com/eks/latest/userguide/getting-started-eksctl.html) on your local machine.
2. Configure the cluster spec and execute the create cluster command.
***make sure the region configured is the region you run the workshop. `eu-north-1` in our example.***
We also assume you have an ssh public key set in your machine. e.g., `~/.ssh/id_rsa.pub` in such case you can ssh to the EC2 instacne directly. Otherwise configure the value `publicKeyPath` in [cluster-w-gs-mixed-nodegroup.yaml](/workshop/eks/specs/cluster-w-gs-mixed-nodegroup.yaml)
To create the cluster by executing:
```bash
eksctl create cluster -f eks/specs/cluster.yaml
```

***while the cluster is being created, pls check the status of the game-server pipeline created in the previous section (Creating the game-server CI pipeline). Review the pipeline status. Both Source and Build steps should be green. If not, ask for help from one of the moderators.***

3. Enable the game-servers to perform actions like publishing status to SQS(the queues created at the env prep section) or autoscaling i.e., spin-up or spin-down nodes when needed. 

    3.1 Discover the IAM role attached to the node-group created with the cluster by searching roles in the IAM console with the following pattern:`eksctl-CLUSTER_NAME-NODEGROUP_NAME-NodeInstanceRole` capture the IAM role and add the following Inline policy.
    
    3.2 Create the following inline policies 
    
***SQS*** - DeleteMessage, GetQueueUrl, ReceiveMessage, and SendMessage to gameserver-GSQueue and spotint-SpotQueue created in the first section of the workshop. The queue names can be retrieved via `aws sqs list-queues`. The SQS inline policy will look like:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "sqs:DeleteMessage",
                "sqs:GetQueueUrl",
                "sqs:ReceiveMessage",
                "sqs:SendMessage"
            ],
            "Resource": [
                "arn:aws:sqs:us-east-1:356566070122:gameserver-dynamodb-table-GSQueue-guid",
                "arn:aws:sqs:us-east-1:356566070122:spotint-dynamodb-table-SpotQueue-guid"
            ]
        }
    ]
}
```
***CloudWatch*** - PutMetricData. The cloudwatch policy will look like:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": "cloudwatch:PutMetricData",
            "Resource": "*"
        }
    ]
}

```
***EC2 Auto Scaling*** - DescribeAutoScalingGroups, DescribeAutoScalingInstances, SetDesiredCapacity, TerminateInstanceInAutoScalingGroup. Discover the ASG ARN by executing:
```bash
aws autoscaling describe-auto-scaling-groups|jq '.AutoScalingGroups[].AutoScalingGroupARN'
```

The autoscale inline policy will look like:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "autoscaling:SetDesiredCapacity",
                "autoscaling:TerminateInstanceInAutoScalingGroup"
            ],
            "Resource": "arn:aws:autoscaling:us-east-1:num:autoScalingGroup:guid:autoScalingGroupName/eksctl-gs-us-east-1-nodegroup-mixed-instances-1-NodeGroup-guid"
        },
        {
            "Sid": "VisualEditor1",
            "Effect": "Allow",
            "Action": [
                "autoscaling:DescribeAutoScalingInstances",
                "autoscaling:DescribeAutoScalingGroups"
            ],
            "Resource": "*"
        }
    ]
}
```

4. The last step is deploying cluster-autoscaler so new EC2 instances can be added or remove per the demand for game/chat servers dictated by autopilot. The spec for cluster-autoscaler is [cluster_autoscaler.yml](/workshop/eks/specs/cluster_autoscaler.yml).

   4.1 Discover the autoscaling name to configure by executing 
    ```
    aws autoscaling describe-auto-scaling-groups|jq '.AutoScalingGroups[].AutoScalingGroupName'
    ```
    
   4.2 Edit [cluster_autoscaler.yml](/workshop/eks/specs/cluster_autoscaler.yml) by adding the asg name to line #138 `--nodes=2:100:` and modify the `AWS_REGION` value. e.g.,

```yaml
137             - --skip-nodes-with-local-storage=false
138             - --nodes=2:100:eksctl-gs-us-east-1-nodegroup-mixed-instances-1-NodeGroup-guid
139           env:
140             - name: AWS_REGION
141               value: us-east-1
14
```


   4.3 Deploy cluster autoscaler by executing:
   ```bash
   kubectl apply -f eks/specs/cluster_autoscaler.yml
   ```
   Review the logs by discovering the pods name
   ```bash
   kubectl logs `kubectl get po -n kube-system| grep cluster-autoscaler| awk '{print $1}'` -n kube-system
   ```
## Sample workload deployment
   In this section we deploy to EKS the game-server image we created using the CI pipeline
   1. Discover the SQS queue that a game-server publishes its status. 
    
    aws sqs list-queues| grep gameserver
    
   e.g., `gameserver-GSQueue-53KMDTED5ML4`
    
   Populate the `QUEUENAME` in [game-server.yaml](/workshop/eks/specs/game-server.yaml)
    
   2. Discover the image registry url of the game-server image created by the CI pipline. 
   
    aws ecr describe-repositories | jq '.repositories[].repositoryUri'| grep multiplayersample
   
   Populate the `image` value in [game-server.yaml](/workshop/eks/specs/game-server.yaml)
    e.g.,
    ```yaml
    ...
            - name: QUEUENAME
          value: "gameserver-dynamodb-table-GSQueue-53KMDTED5ML4"
        image: 356566070122.dkr.ecr.us-east-1.amazonaws.com/multiplayersample-build
        imagePullPolicy: Always
    ...
    ```
    
   1.3 Deploy the game-server to EKS
   
    
    kubectl create -f eks/specs/game-server.yaml
    
    
   After few minutes the game-server image we built will be deployed and running in the EKS cluster. To view the game-server execute:
    
    
    kubectl get po
    
  Next optional step is to connect a game client and play the game. The game play is left to the reader to review [Lumberyard Sample Projects and Levels](https://docs.aws.amazon.com/lumberyard/latest/userguide/sample-projects-levels-intro.html) 
   
  Our next step will deploy the game-server autopilot for prediction-based game-server auto-scale. 

 ## Deploy game-server autopilot  
Now that we have the game server running, we can schedule the autopilot client to autoscale based on predictions. It uses a trained model that predict the number of game-servers needed. In this workshop, we are going to focus only on the client side only. The client is backed by a model that learns usage patterns and adopt the predictions based on emerging game-server allocation in a specific cluster. Autopilot client set the needed size of the game-servers. If there is a need for more EC2 instances, there will be game-server jobs that are pending. That will indicate the clsuter_autoscaler that we deployed in previous step to add more EC2 instances. 
   To deploy autopilot execute:
   
   ```
   kubectl apply -f autopilot-client.yaml
   ```
   
   After the pod is scheduled check its stdour/err by executing:
   
   ```
   kubectl logs `kubectl get po | grep autopilot| awk '{print $1}'`
   ```
   
   After few minutes, we can start seeing metrics populated in cloudwatch.
