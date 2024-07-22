import { Stack, StackProps, CfnParameter  } from 'aws-cdk-lib';
import { Construct } from 'constructs'
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as iam from "aws-cdk-lib/aws-iam";

export class BasePipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
  const BUILDX_VER = new CfnParameter(this,"BUILDXVER",{type:"String"});
  const BASE_REPO = new CfnParameter(this,"BASEREPO",{type:"String"});
  const BASE_IMAGE_TAG = new CfnParameter(this,"BASEIMAGETAG",{type:"String"});
  
  //codecommit repository that will contain the containerized app to build
  const gitrepo = new codecommit.Repository(this, `gitrepo`, {
    repositoryName:BASE_REPO.valueAsString,
    description: "base image for CRAFT repository, includes all the build phases",
    code: codecommit.Code.fromDirectory('./server','main'),
  });
  //const gitrepo = codecommit.Repository.fromRepositoryName(this,`gitrepo`,CODE_COMMIT_REPO.valueAsString)
    
  const base_registry = new ecr.Repository(this,`base_repo`,{
    repositoryName:BASE_REPO.valueAsString,
    imageScanOnPush: true
  });
  //const base_registry = ecr.Repository.fromRepositoryName(this,`base_repo`,BASE_REPO.valueAsString)
  
  //create a roleARN for codebuild 
  const buildRole = new iam.Role(this, 'BaseCodeBuildDeployRole',{
    roleName: "BaseCodeBuildDeployRole",
    assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
  });
  
  buildRole.addToPolicy(new iam.PolicyStatement({
    resources: ['*'],
    actions: ['ssm:*'],
  }));
    
  const base_image_build = new codebuild.Project(this, `BaseImageBuild`, {
    environment: {privileged:true,buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_ARM_2},
    role: buildRole,
    buildSpec: codebuild.BuildSpec.fromObject(
      {
        version: "0.2",
        env: {
          'exported-variables': [
            'AWS_ACCOUNT_ID','AWS_REGION','BASE_REPO','BASE_IMAGE_TAG','BUILDX_VER'
          ],
        },
        phases: {
          build: {
            commands: [
              `chmod +x ./enable-buildx.sh && ./enable-buildx.sh`,
              `export AWS_ACCOUNT_ID="${this.account}"`,
              `export AWS_REGION="${this.region}"`,
              `export BASE_REPO="${BASE_REPO.valueAsString}"`,
              `export BUILDX_VER="${BUILDX_VER.valueAsString}"`,
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
  const sourceOuput = new codepipeline.Artifact();
  const pipeline = new codepipeline.Pipeline(this,`BASEPipeline`, {
    stages: [
     {
       stageName: 'Source',
       actions: [
       new codepipeline_actions.CodeCommitSourceAction({
         actionName: 'CodeCommit_Source',
         repository: gitrepo,
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
     },
    ]
    });
  }
}
