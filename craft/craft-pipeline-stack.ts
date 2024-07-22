import { Stack, StackProps, CfnParameter  } from 'aws-cdk-lib';
import { Construct } from 'constructs'
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as iam from "aws-cdk-lib/aws-iam";

export class CraftPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
  const BUILDX_VER = new CfnParameter(this,"BUILDX_VER",{type:"String"});
  const BASE_REPO = new CfnParameter(this,"BASEREPO",{type:"String"});
  const BASE_IMAGE_TAG = new CfnParameter(this,"BASEIMAGETAG",{type:"String"});
  const GAME_REPO = new CfnParameter(this,"GAMEREPO",{type:"String"});
  const GAME_CODE_TAG = new CfnParameter(this,"GAMECODETAG",{type:"String"});
  const GAME_ARM_CODE_TAG = new CfnParameter(this,"GAMEARMCODETAG",{type:"String"});
  const GAME_AMD_CODE_TAG = new CfnParameter(this,"GAMEAMDCODETAG",{type:"String"});
  const GITHUB_CRAFT = new CfnParameter(this,"GITHUBCRAFT",{type:"String"});
  const GITHUB_CRAFT_BRANCH = new CfnParameter(this,"GITHUBCRAFTBRANCH",{type:"String"});
  
  //codecommit repository that will contain the containerized app to build
  const gitrepo = new codecommit.Repository(this, `gitrepo`, {
    repositoryName:GAME_REPO.valueAsString,
    description: "CRAFT repository for the pipeline, includes all the build phases",
    code: codecommit.Code.fromDirectory('./server','main'),
  });
  //const gitrepo = codecommit.Repository.fromRepositoryName(this,`gitrepo`,CODE_COMMIT_REPO.valueAsString)
    
  const base_registry = ecr.Repository.fromRepositoryName(this,`base_repo`,BASE_REPO.valueAsString)

  const craft_registry = new ecr.Repository(this,`game_repo`,{
    repositoryName:GAME_REPO.valueAsString,
    imageScanOnPush: true
  });

  //create a roleARN for codebuild 
  const buildRole = new iam.Role(this, 'CraftCodeBuildDeployRole',{
    roleName: "CraftCodeBuildDeployRole",
    assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
  });
  
  buildRole.addToPolicy(new iam.PolicyStatement({
    resources: ['*'],
    actions: ['ssm:*'],
  }));
    
  const craft_code_image_arm_build = new codebuild.Project(this, `CRAFTCodeImageArmBuild`, {
    environment: {privileged:true,buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_ARM_2},
    role: buildRole,
    buildSpec: codebuild.BuildSpec.fromObject(
      {
        version: "0.2",
        env: {
          'exported-variables': [
            'AWS_ACCOUNT_ID','AWS_REGION','BASE_REPO','BASE_IMAGE_TAG','GAME_REPO','GITHUB_CRAFT','GITHUB_CRAFT_BRANCH','GAME_ARM_CODE_TAG'
          ],
        },
        phases: {
          build: {
            commands: [
              `export AWS_ACCOUNT_ID="${this.account}"`,
              `export AWS_REGION="${this.region}"`,
              `export BASE_REPO="${BASE_REPO.valueAsString}"`,
              `export BASE_IMAGE_TAG="${BASE_IMAGE_TAG.valueAsString}"`,
              `export GAME_REPO="${GAME_REPO.valueAsString}"`,
              `export GAME_CODE_TAG="${GAME_ARM_CODE_TAG.valueAsString}"`,
              `export GITHUB_CRAFT="${GITHUB_CRAFT.valueAsString}"`,
              `export GITHUB_CRAFT_BRANCH="${GITHUB_CRAFT_BRANCH.valueAsString}"`,
              `cd craft-image-multiarch`,
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

  const craft_code_image_amd_build = new codebuild.Project(this, `CRAFTCodeImageAmdBuild`, {
    environment: {privileged:true,buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_3},
    role: buildRole,
    buildSpec: codebuild.BuildSpec.fromObject(
      {
        version: "0.2",
        env: {
          'exported-variables': [
            'AWS_ACCOUNT_ID','AWS_REGION','BASE_REPO','BASE_IMAGE_TAG','GAME_REPO','GITHUB_CRAFT','GITHUB_CRAFT_BRANCH','GAME_AMD_CODE_TAG'
          ],
        },
        phases: {
          build: {
            commands: [
              `export AWS_ACCOUNT_ID="${this.account}"`,
              `export AWS_REGION="${this.region}"`,
              `export BASE_REPO="${BASE_REPO.valueAsString}"`,
              `export BASE_IMAGE_TAG="${BASE_IMAGE_TAG.valueAsString}"`,
              `export GAME_REPO="${GAME_REPO.valueAsString}"`,
              `export GAME_CODE_TAG="${GAME_AMD_CODE_TAG.valueAsString}"`,
              `export GITHUB_CRAFT="${GITHUB_CRAFT.valueAsString}"`,
              `export GITHUB_CRAFT_BRANCH="${GITHUB_CRAFT_BRANCH.valueAsString}"`,
              `cd craft-image-multiarch`,
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

  const craft_code_image_assembly = new codebuild.Project(this, `CRAFTCodeImageMultiarchAssembly`, {
    environment: {privileged:true,buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_ARM_2},
    role: buildRole,
    buildSpec: codebuild.BuildSpec.fromObject(
      {
        version: "0.2",
        env: {
          'exported-variables': [
            'AWS_ACCOUNT_ID','AWS_REGION','GAME_REPO','GAME_AMD_CODE_TAG','GAME_ARM_CODE_TAG','GAME_CODE_TAG'
          ],
        },
        phases: {
          build: {
            commands: [
              `export AWS_ACCOUNT_ID="${this.account}"`,
              `export AWS_REGION="${this.region}"`,
              `export GAME_REPO="${GAME_REPO.valueAsString}"`,
              `export GAME_AMD_CODE_TAG="${GAME_AMD_CODE_TAG.valueAsString}"`,
              `export GAME_ARM_CODE_TAG="${GAME_ARM_CODE_TAG.valueAsString}"`,
              `export GAME_CODE_TAG="${GAME_CODE_TAG.valueAsString}"`,
              `cd craft-image-multiarch`,
              `chmod +x ./assemble_multiarch_image.sh && ./assemble_multiarch_image.sh`
            ],
          }
        },
        artifacts: {
          files: ['imageDetail.json']
        },
      }
    ),
  });

  //allow the buildProject principal to push images to ecr
  base_registry.grantPullPush(craft_code_image_arm_build.grantPrincipal);
  base_registry.grantPullPush(craft_code_image_amd_build.grantPrincipal);
  craft_registry.grantPullPush(craft_code_image_assembly.grantPrincipal);

  // here we define our pipeline and put together the assembly line
  // using each of the components we created earlier
  const sourceOuput = new codepipeline.Artifact();
  
  const pipeline = new codepipeline.Pipeline(this,`CRAFTPipeline`);

  pipeline.addStage({
      stageName: 'Source',
      actions: [
      new codepipeline_actions.CodeCommitSourceAction({
        actionName: 'CodeCommit_Source',
        repository: gitrepo,
        output: sourceOuput,
        branch: 'main'
      }),
      ]
  });
  pipeline.addStage({
      stageName: 'CraftCodeARMImageBuild',
      actions: [
      new codepipeline_actions.CodeBuildAction({
        actionName: 'Build_Code',
        input: sourceOuput,
        project: craft_code_image_arm_build
      })
      ]
  });
  pipeline.addStage({
      stageName: 'CraftCodeAMDImageBuild',
      actions: [
      new codepipeline_actions.CodeBuildAction({
        actionName: 'Build_Code',
        input: sourceOuput,
        project: craft_code_image_amd_build
      })
      ]
  });
  pipeline.addStage({
      stageName: 'CraftCodeImageMultiarchAssembly',
      actions: [
      new codepipeline_actions.CodeBuildAction({
        actionName: 'Build_Code',
        input: sourceOuput,
        project: craft_code_image_assembly
      })
      ]
  });
  }
}
