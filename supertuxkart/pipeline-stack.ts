import { Stack, StackProps, CfnParameter  } from 'aws-cdk-lib';
import { Construct } from 'constructs'
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as iam from "aws-cdk-lib/aws-iam";

export class StkPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
  const BASE_REPO = new CfnParameter(this,"BASEREPO",{type:"String"});
  const BASE_IMAGE_TAG = new CfnParameter(this,"BASEIMAGETAG",{type:"String"});
  const CODE_COMMIT_REPO = new CfnParameter(this,"CODECOMMITREPO",{type:"String"});
  //parameters that can be passed from the command line
  //const GAME_REPO = new CfnParameter(this,"GAME_REPO",{type:"String"});
  //const GAME_ASSETS_TAG = new CfnParameter(this,"GAME_ASSETS_TAG",{type:"String"});
  //const GAME_CODE_TAG = new CfnParameter(this,"GAME_CODE_TAG",{type:"String"});
  //const GAME_SERVER_TAG = new CfnParameter(this,"GAME_SERVER_TAG",{type:"String"});
  //const GITHUB_STK = new CfnParameter(this,"GITHUB_STK",{type:"String"});
  //const GITHUB_STK_BRANCH = new CfnParameter(this,"GITHUB_STK_BRANCH",{type:"String"});
  //const SVN_STK = new CfnParameter(this,"SVN_STK",{type:"String"});
  
  //codecommit repository that will contain the containerized app to build
  const repo = new codecommit.Repository(this, `gitRepo`, {
    repositoryName:CODE_COMMIT_REPO.valueAsString,
    description: "STK repository for the pipeline, includes all the build phases",
    code: codecommit.Code.fromDirectory('./server','main'),
  });
    
  //docker repository to store container images
  const base_registry = new ecr.Repository(this,`base_repo`,{
    repositoryName:BASE_REPO.valueAsString,
    imageScanOnPush: true
  });

  //create a roleARN for codebuild 
  const buildRole = new iam.Role(this, 'StkCodeBuildDeployRole',{
    roleName: "StkCodeBuildDeployRole",
    assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
  });
  
  buildRole.addToPolicy(new iam.PolicyStatement({
    resources: ['*'],
    actions: ['ssm:*'],
  }));
    
  const base_image_build = new codebuild.Project(this, `BaseImageBuild`, {
    environment: {privileged:true,buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_ARM_2},
    role: buildRole,
    //cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER, codebuild.LocalCacheMode.CUSTOM),
    buildSpec: codebuild.BuildSpec.fromObject(
      {
        version: "0.2",
        env: {
          'exported-variables': [
            'AWS_ACCOUNT_ID','AWS_REGION','BASE_REPO','BASE_IMAGE_TAG'
          ],
        },
        phases: {
          build: {
            commands: [
              `export AWS_ACCOUNT_ID="${this.account}"`,
              `export AWS_REGION="${this.region}"`,
              `export BASE_REPO="${BASE_REPO.valueAsString}"`,
              `export BASE_IMAGE_TAG="${BASE_IMAGE_TAG.valueAsString}"`,
              `cd base-image-multiarch-python3`,
              `chmod +x ./build.sh && ./build.sh`
            ],
          }
        },
        artifacts: {
          files: ['imageDetail.json']
        },
      }
    ),
  });
    
  //we allow the buildProject principal to push images to ecr
  base_registry.grantPullPush(base_image_build.grantPrincipal);

  // here we define our pipeline and put together the assembly line
  // using each of the components we created earlier
  const sourceOuput = new codepipeline.Artifact();
  const pipeline = new codepipeline.Pipeline(this,`STKPipeline`, {
    stages: [
     {
       stageName: 'Source',
       actions: [
       new codepipeline_actions.CodeCommitSourceAction({
         actionName: 'CodeCommit_Source',
         repository: repo,
         output: sourceOuput,
         branch: 'main'
       }),
       ]
     },
     {
       stageName: 'BaseImageBuild',
       actions: [
       new codepipeline_actions.CodeBuildAction({
         actionName: 'Build_Code',
         input: sourceOuput,
         project: base_image_build
       }),
       ]
     }
    ]
    });
  }
}