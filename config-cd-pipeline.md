# Game Server Continuous Deployment 

We assume that by now, you have the k8s workload deployed and running. Any changes require an image build or a k8s config change to be applied. In this module we show how we use your favorite Git (CodeCommit or Github) as a single source of truth for declarative workload specification. With CodeCommit at the center and CodePipeline, devops can make pull requests to accelerate and simplify the application config, and deployment to EKS. Finally, we apply the least privilege security concept that limits the access required to the build process, eliminate the need for manual modifications and centralized monitoring system through CloudWatch.


To continue from the point we left in the workshop, we have a set of k8s specs and cluster specs in [eks](/workshop/eks/). To implement a system that continuously applies changes made to the workload specification we will use CodeCommit to store the regional cluster state, [specs](/workshop/eks/specs) folder. Then we configure a CodePipeline project that is triggered by pull request on the CodeCommit. The pipeline execute a script that iterates through the spec folder and enforce the workload specifications.

1. Modify `post_eks_deploy.sh` to include the region and the preferred name for the role to be assigned e.g., "codebuild-cd-"${AWS_REGION} and execute [create_cd_role.sh](/bin/create_cd_role.sh). 

2. Create a CodeBuild project that apply changes made in the kube specs or config maps. Before creating the project. Make sure you have the region and account number in [cd-buildspec.yml](cd-buildspec.yml) correct. Should be `eu-central-1` and your AWS account number.
For creating the CodeBuild project follow the steps in the CodeBuild console.
	1. Create build project Under project config choose your favorite name. 
	2. For the source config use CodeCommit and point to your CodeCommit repo you created in the first step. For the Environment section use Managed image with Amazon Linux 2, Standard runtime and the image it offers. ***Make sure you enable the Privileged flag otherwise the `docker` command can’t be executed*** 
	3. Under `Service Role` choose `New service role` use the name offered and capture it for the next step.
    4. Finally configure the cd-buildspec.yml file.

Discover the role created by the CodeBuild project. Its name is codebuild-{codebuild name}-service-role. Add inline policy that adds eks:DescribeCluster as follow:
```yaml
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": "eks:DescribeCluster",
            "Resource": "*"
        }
    ]
}
```
4. Add assume role to the role created in step 2. 
```yaml
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": "sts:AssumeRole",
            "Resource": "arn:aws:iam::356566070122:role/codebuild-cd-us-west-2"
        }
    ]
}
```
Create pipeline, ***choose the service role we created*** and modified in the CodeBuild project. 
The source stage will use the code commit details and use the defaults. The build provider should be CodeBuild pointing to the project we just created. Skip the deploy step as EKS will handle that for us. Review and create pipeline. 
