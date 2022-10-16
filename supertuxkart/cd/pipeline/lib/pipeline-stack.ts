import { Stack, StackProps, CfnParameter, RemovalPolicy, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import * as codecommit from "aws-cdk-lib/aws-codecommit";
//import * as sns from "aws-cdk-lib/aws-sns";
//import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";
import * as codepipeline_actions from "aws-cdk-lib/aws-codepipeline-actions";
//import * as notifications from "aws-cdk-lib/aws-codestarnotifications";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as path from 'path';


export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    //parameters that can be passed from the command line

    //notification parameters
    /*const notifyPhone = new CfnParameter(this, "notifyPhone", {
      type: "String",
      description: "The recipient phone number for pipeline notification",
      default: "+11111111111",
    });

    const notificationEmail = new CfnParameter(this, "notificationEmail", {
      type: "String",
      description: "The recipient email for pipeline notifications",
      default: "user@email.com",
    });*/


    const ecrRepoName = new CfnParameter(this, "ecrRepoName", {
      type: "String",
      description: "The name of the ecr registry",
      default: "stk",
    });
    
    
    //sns topic for pipeline notifications
    /*const pipelineNotifications = new sns.Topic(this, "BuildNotifications");
    pipelineNotifications.addSubscription(
      new subscriptions.SmsSubscription(`${notifyPhone.valueAsString}`)
    );
    pipelineNotifications.addSubscription(
      new subscriptions.EmailSubscription(`${notificationEmail.valueAsString}`)
    );*/
    

     //name of target EKS cluster
    const clusterName = new CfnParameter(this, "clusterName", {
      type: "String",
      description: "The name of the eks cluster",
      default: "stk-gameservers",
    });

    
    //packaging deployment manifests as assets
    const serverManifest = new Asset(this, 'serverManifest', {
      path: path.join(__dirname, 'stk-server-nodeport.yaml')
    });
    
    const clientManifest = new Asset(this, 'clientManifest', {
      path: path.join(__dirname, 'stk-client.yaml')
    });
    
  
    
    //create a roleARN for codebuild 
    const deployRole = new iam.Role(this, 'codeBuildEKSDeployRole', { roleName: "codeBuildEKSDeployRole",
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
    });
    
    
     deployRole.addToPolicy(new iam.PolicyStatement({
      resources: ['*'],
      actions: ['ssm:*'],
    }));
    
    
    //giving permissions to codebuild for eks
    deployRole.addToPolicy(new iam.PolicyStatement({
      resources: ['*'],
      actions: ['eks:*'],
    }));
    
    //giving permissions to codebuild for s3
    deployRole.addToPolicy(new iam.PolicyStatement({
      resources: ['*'],
      actions: ['s3:*'],
    }));
    

   new CfnOutput(this, 'iamidentitymapping command', { value: `eksctl create iamidentitymapping --cluster ${  clusterName.valueAsString } --region ${ this.region  } --arn ${ deployRole.roleArn } --group system:masters` });

    //deploy docker image using codebuild
    
    const deployproject = new codebuild.Project(this, `dockerDeploy`, {
      environment: {
        privileged: true,
        //buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_ARM_2,
      },
      role: deployRole,
      
      buildSpec: codebuild.BuildSpec.fromObject({
        version: "0.2",
        phases: {
          build: {
            commands: [
              `export AWS_REGION=${ this.region  }`,
              `export AWS_ACCOUNT_ID=${ this.account }`,
              `curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp`,
              `mv /tmp/eksctl /usr/local/bin`,
              `aws eks update-kubeconfig --region ${ this.region } --name ${ clusterName.valueAsString }`,
              `IMAGE_TAG=$(aws ssm get-parameter --name stk-image-latest-tag | jq '.Parameter.Value' | tr -d '"')`,
              `aws s3 cp ${ serverManifest.s3ObjectUrl } stk-server-nodeport.yaml`,
              `envsubst < stk-server-nodeport.yaml | kubectl apply -f -`,
            ],
          },
        },
        artifacts: {
          files: ["imageDetail.json"],
        },
      }),
    });
    
      //granting read on manifests assets to codebuild
    serverManifest.grantRead(deployproject.grantPrincipal);
    clientManifest.grantRead(deployproject.grantPrincipal);
 
 
    // here we define our pipeline and put together the assembly line
    // using each of the components we created earlier
    const sourceOuput = new codepipeline.Artifact();
    var imageTag =  ssm.StringParameter.fromStringParameterAttributes(this, 'ImageTag', { parameterName: 'stk-image-latest-tag',}).stringValue;
    const pipeline = new codepipeline.Pipeline(this, `containerPipeline`, {
      stages: [
        {
          stageName: "Source",
          actions: [
            new codepipeline_actions.EcrSourceAction({
              actionName: "ECR_Source",
              repository: ecr.Repository.fromRepositoryName(this, 'registry',ecrRepoName.valueAsString),
              output: sourceOuput,
              imageTag: imageTag
            }),
          ],
        },
        {
          stageName: "EKSDeployment",
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: "Deploy_Code",
              input: sourceOuput,
              project: deployproject,
            }),
          ],
        },
      ],
    });
    
    /*const deployNotificationRule = new notifications.NotificationRule(this, 'deployNotificationRule', {
    source: deployproject,
    events: [
      'codebuild-project-build-state-succeeded',
      'codebuild-project-build-state-failed',
    ],
    targets: [pipelineNotifications],
  });*/

  }
}
