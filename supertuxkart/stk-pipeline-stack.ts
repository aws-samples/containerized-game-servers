import { Stack, StackProps, CfnParameter  } from 'aws-cdk-lib';
import { Construct } from 'constructs'
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as iam from "aws-cdk-lib/aws-iam";

export class StkPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
  const BUILDX_VER = new CfnParameter(this,"BUILDX_VER",{type:"String"});
  const BASE_REPO = new CfnParameter(this,"BASEREPO",{type:"String"});
  const BASE_IMAGE_TAG = new CfnParameter(this,"BASEIMAGETAG",{type:"String"});
  const GAME_REPO = new CfnParameter(this,"GAMEREPO",{type:"String"});
  const GAME_ASSETS_TAG = new CfnParameter(this,"GAMEASSETSTAG",{type:"String"});
  const GAME_CODE_TAG = new CfnParameter(this,"GAMECODETAG",{type:"String"});
  const GAME_ARM_CODE_TAG = new CfnParameter(this,"GAMEARMCODETAG",{type:"String"});
  const GAME_AMD_CODE_TAG = new CfnParameter(this,"GAMEAMDCODETAG",{type:"String"});
  const GAME_SERVER_TAG = new CfnParameter(this,"GAMESERVERTAG",{type:"String"});
  const SVN_STK = new CfnParameter(this,"SVNSTK",{type:"String"});
  const GITHUB_STK = new CfnParameter(this,"GITHUBSTK",{type:"String"});
  const GITHUB_STK_BRANCH = new CfnParameter(this,"GITHUBSTKBRANCH",{type:"String"});
  
  //codecommit repository that will contain the containerized app to build
  const gitrepo = new codecommit.Repository(this, `gitrepo`, {
    repositoryName:GAME_REPO.valueAsString,
    description: "STK repository for the pipeline, includes all the build phases",
    code: codecommit.Code.fromDirectory('./server','main'),
  });
  //const gitrepo = codecommit.Repository.fromRepositoryName(this,`gitrepo`,CODE_COMMIT_REPO.valueAsString)
    
  const base_registry = ecr.Repository.fromRepositoryName(this,`base_repo`,BASE_REPO.valueAsString)

  const stk_registry = new ecr.Repository(this,`game_repo`,{
    repositoryName:GAME_REPO.valueAsString,
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
    
  const stk_assets_image_build = new codebuild.Project(this, `STKAssetsImageBuild`, {
    environment: {privileged:true,buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_ARM_2},
    cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER, codebuild.LocalCacheMode.CUSTOM),
    role: buildRole,
    buildSpec: codebuild.BuildSpec.fromObject(
      {
        version: "0.2",
        env: {
          'exported-variables': [
            'AWS_ACCOUNT_ID','AWS_REGION','BASE_REPO','BASE_IMAGE_TAG','GAME_REPO','GAME_ASSETS_TAG','SVN_STK','BUILDX_VER'
          ],
        },
        phases: {
          build: {
            commands: [
              `chmod +x ./enable-buildx.sh && ./enable-buildx.sh`,
              `export AWS_ACCOUNT_ID="${this.account}"`,
              `export AWS_REGION="${this.region}"`,
              `export BUILDX_VER="${BUILDX_VER.valueAsString}"`,
              `export BASE_REPO="${BASE_REPO.valueAsString}"`,
              `export BASE_IMAGE_TAG="${BASE_IMAGE_TAG.valueAsString}"`,
              `export GAME_REPO="${GAME_REPO.valueAsString}"`,
              `export GAME_ASSETS_TAG="${GAME_ASSETS_TAG.valueAsString}"`,
              `export SVN_STK="${SVN_STK.valueAsString}"`,
              `cd stk-assets-image-multiarch`,
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
    
  const stk_code_image_arm_build = new codebuild.Project(this, `STKCodeImageArmBuild`, {
    environment: {privileged:true,buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_ARM_2},
    cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER, codebuild.LocalCacheMode.CUSTOM),
    role: buildRole,
    buildSpec: codebuild.BuildSpec.fromObject(
      {
        version: "0.2",
        env: {
          'exported-variables': [
            'AWS_ACCOUNT_ID','AWS_REGION','BASE_REPO','BASE_IMAGE_TAG','GAME_REPO','GAME_ASSETS_TAG','GITHUB_STK','GITHUB_STK_BRANCH','GAME_ARM_CODE_TAG','BUILDX_VER'
          ],
        },
        phases: {
          build: {
            commands: [
              `chmod +x ./enable-buildx.sh && ./enable-buildx.sh`,
              `export AWS_ACCOUNT_ID="${this.account}"`,
              `export AWS_REGION="${this.region}"`,
              `export BUILDX_VER="${BUILDX_VER.valueAsString}"`,
              `export BASE_REPO="${BASE_REPO.valueAsString}"`,
              `export BASE_IMAGE_TAG="${BASE_IMAGE_TAG.valueAsString}"`,
              `export GAME_REPO="${GAME_REPO.valueAsString}"`,
              `export GAME_ASSETS_TAG="${GAME_ASSETS_TAG.valueAsString}"`,
              `export GAME_CODE_TAG="${GAME_ARM_CODE_TAG.valueAsString}"`,
              `export GITHUB_STK="${GITHUB_STK.valueAsString}"`,
              `export GITHUB_STK_BRANCH="${GITHUB_STK_BRANCH.valueAsString}"`,
              `cd stk-code-image-multiarch`,
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

  const stk_code_image_amd_build = new codebuild.Project(this, `STKCodeImageAmdBuild`, {
    environment: {privileged:true,buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_3},
    cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER, codebuild.LocalCacheMode.CUSTOM),
    role: buildRole,
    buildSpec: codebuild.BuildSpec.fromObject(
      {
        version: "0.2",
        env: {
          'exported-variables': [
            'AWS_ACCOUNT_ID','AWS_REGION','BASE_REPO','BASE_IMAGE_TAG','GAME_REPO','GAME_ASSETS_TAG','GITHUB_STK','GITHUB_STK_BRANCH','GAME_AMD_CODE_TAG','BUILDX_VER'
          ],
        },
        phases: {
          build: {
            commands: [
              `chmod +x ./enable-buildx.sh && ./enable-buildx.sh`,
              `export AWS_ACCOUNT_ID="${this.account}"`,
              `export AWS_REGION="${this.region}"`,
              `export BUILDX_VER="${BUILDX_VER.valueAsString}"`,
              `export BASE_REPO="${BASE_REPO.valueAsString}"`,
              `export BASE_IMAGE_TAG="${BASE_IMAGE_TAG.valueAsString}"`,
              `export GAME_REPO="${GAME_REPO.valueAsString}"`,
              `export GAME_ASSETS_TAG="${GAME_ASSETS_TAG.valueAsString}"`,
              `export GAME_CODE_TAG="${GAME_AMD_CODE_TAG.valueAsString}"`,
              `export GITHUB_STK="${GITHUB_STK.valueAsString}"`,
              `export GITHUB_STK_BRANCH="${GITHUB_STK_BRANCH.valueAsString}"`,
              `cd stk-code-image-multiarch`,
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

  const stk_code_image_assembly = new codebuild.Project(this, `STKCodeImageMultiarchAssembly`, {
    environment: {privileged:true,buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_3},
    cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER, codebuild.LocalCacheMode.CUSTOM),
    role: buildRole,
    buildSpec: codebuild.BuildSpec.fromObject(
      {
        version: "0.2",
        env: {
          'exported-variables': [
            'AWS_ACCOUNT_ID','AWS_REGION','BASE_REPO','BASE_IMAGE_TAG','GAME_REPO','GAME_ASSETS_TAG','GAME_AMD_CODE_TAG','GAME_ARM_CODE_TAG','GAME_CODE_TAG'
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
              `export GAME_ASSETS_TAG="${GAME_ASSETS_TAG.valueAsString}"`,
              `export GAME_AMD_CODE_TAG="${GAME_AMD_CODE_TAG.valueAsString}"`,
              `export GAME_ARM_CODE_TAG="${GAME_ARM_CODE_TAG.valueAsString}"`,
              `export GAME_CODE_TAG="${GAME_CODE_TAG.valueAsString}"`,
              `export GITHUB_STK="${GITHUB_STK.valueAsString}"`,
              `export GITHUB_STK_BRANCH="${GITHUB_STK_BRANCH.valueAsString}"`,
              `cd stk-code-image-multiarch`,
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

  const stk_game_image_build = new codebuild.Project(this, `STKGameImageBuild`, {
    environment: {privileged:true,buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_ARM_2},
    cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER, codebuild.LocalCacheMode.CUSTOM),
    role: buildRole,
    buildSpec: codebuild.BuildSpec.fromObject(
      {
        version: "0.2",
        env: {
          'exported-variables': [
            'AWS_ACCOUNT_ID','AWS_REGION','GAME_REPO','GAME_SERVER_TAG','GAME_CODE_TAG','BUILDX_VER'
          ],
        },
        phases: {
          build: {
            commands: [
              `chmod +x ./enable-buildx.sh && ./enable-buildx.sh`,
              `export AWS_ACCOUNT_ID="${this.account}"`,
              `export AWS_REGION="${this.region}"`,
              `export BUILDX_VER="${BUILDX_VER.valueAsString}"`,
              `export GAME_REPO="${GAME_REPO.valueAsString}"`,
              `export GAME_CODE_TAG="${GAME_CODE_TAG.valueAsString}"`,
              `export GAME_SERVER_TAG="${GAME_SERVER_TAG.valueAsString}"`,
              `cd stk-game-server-image-multiarch`,
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
  //base_registry.grantPullPush(base_image_build.grantPrincipal);
  base_registry.grantPullPush(stk_assets_image_build.grantPrincipal);
  stk_registry.grantPullPush(stk_assets_image_build.grantPrincipal);
  stk_registry.grantPullPush(stk_code_image_arm_build.grantPrincipal);
  stk_registry.grantPullPush(stk_code_image_amd_build.grantPrincipal);
  stk_registry.grantPullPush(stk_code_image_assembly.grantPrincipal);
  stk_registry.grantPullPush(stk_game_image_build.grantPrincipal);

  const sourceOuput = new codepipeline.Artifact();
  
  const gameImagePipeline = new codepipeline.Pipeline(this,`STKDevOpsGamePipeline`);
  gameImagePipeline.addStage({
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
  gameImagePipeline.addStage({
      stageName: 'STKGameImageBuild',
      actions: [
      new codepipeline_actions.CodeBuildAction({
        actionName: 'Build_Code',
        input: sourceOuput,
        project: stk_game_image_build
      })
      ]
  });

  const pipeline = new codepipeline.Pipeline(this,`STKPipeline`);
  pipeline.addStage({
      stageName: 'Source',
      actions: [
      new codepipeline_actions.CodeCommitSourceAction({
        actionName: 'CodeCommit_Source',
        repository: gitrepo,
        runOrder: 1,
        output: sourceOuput,
        branch: 'main'
      }),
      ]
  });
  pipeline.addStage({
      stageName: 'STKAssetsImageBuild',
      actions: [
      new codepipeline_actions.CodeBuildAction({
        actionName: 'Build_Code',
        input: sourceOuput,
        runOrder: 2,
        project: stk_assets_image_build
      }),
      ]
  });
  pipeline.addStage({
      stageName: 'STKCodeARMImageBuild',
      actions: [
      new codepipeline_actions.CodeBuildAction({
        actionName: 'Build_Code',
        input: sourceOuput,
        runOrder: 3,
        project: stk_code_image_arm_build
      })
      ]
  });
  pipeline.addStage({
      stageName: 'STKCodeAMDImageBuild',
      actions: [
      new codepipeline_actions.CodeBuildAction({
        actionName: 'Build_Code',
        input: sourceOuput,
        runOrder: 3,
        project: stk_code_image_amd_build
      })
      ]
  });
  pipeline.addStage({
      stageName: 'STKCodeImageMultiarchAssembly',
      actions: [
      new codepipeline_actions.CodeBuildAction({
        actionName: 'Build_Code',
        input: sourceOuput,
        runOrder: 4,
        project: stk_code_image_assembly
      })
      ]
  });
  pipeline.addStage({
      stageName: 'STKGameImageBuild',
      actions: [
      new codepipeline_actions.CodeBuildAction({
        actionName: 'Build_Code',
        input: sourceOuput,
        runOrder: 5,
        project: stk_game_image_build
      })
      ]
  });
  }
}
