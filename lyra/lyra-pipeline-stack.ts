import { Construct } from 'constructs'
import { Stack, StackProps, CfnParameter,SecretValue  } from 'aws-cdk-lib';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as iam from "aws-cdk-lib/aws-iam";
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export class LyraPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
  const BUILDX_VER = new CfnParameter(this,"BUILDX_VER",{type:"String"});
  const BASE_REPO = new CfnParameter(this,"BASEREPO",{type:"String"});
  const BASE_IMAGE_TAG = new CfnParameter(this,"BASEIMAGETAG",{type:"String"});
  const GAME_REPO = new CfnParameter(this,"GAMEREPO",{type:"String"});
  const GAME_ASSETS_TAG = new CfnParameter(this,"GAMEASSETSTAG",{type:"String"});
  const GAME_ARM_ASSETS_TAG = new CfnParameter(this,"GAMEARMASSETSTAG",{type:"String"});
  const GAME_AMD_ASSETS_TAG = new CfnParameter(this,"GAMEAMDASSETSTAG",{type:"String"});
  const GAME_SERVER_TAG = new CfnParameter(this,"GAMESERVERTAG",{type:"String"});
  const GAME_ARM_SERVER_TAG = new CfnParameter(this,"GAMEARMSERVERTAG",{type:"String"});
  const GAME_AMD_SERVER_TAG = new CfnParameter(this,"GAMEAMDSERVERTAG",{type:"String"});
  const S3_LYRA_ASSETS = new CfnParameter(this,"S3LYRAASSETS",{type:"String"});
  const GITHUB_USER = new CfnParameter(this,"GITHUBUSER",{type:"String"});
  const GITHUB_REPO = new CfnParameter(this,"GITHUBREPO",{type:"String"});
  const GITHUB_BRANCH = new CfnParameter(this,"GITHUBBRANCH",{type:"String"});
  const GITHUB_OAUTH_TOKEN = new CfnParameter(this,"GITHUBOAUTHTOKEN",{type:"String"});


  const base_registry = ecr.Repository.fromRepositoryName(this,`base_repo`,BASE_REPO.valueAsString)
  const stk_assets_bucket = s3.Bucket.fromBucketName(this,`game_assets_bucket`,S3_LYRA_ASSETS.valueAsString)

  /*const lyra_registry = new ecr.Repository(this,`game_repo`,{
    repositoryName:GAME_REPO.valueAsString,
    imageScanOnPush: true
  });*/
  const lyra_registry = ecr.Repository.fromRepositoryName(this,`game_repo`,GAME_REPO.valueAsString)
  

  //create a roleARN for codebuild 
  const buildRole = new iam.Role(this, 'LyraBuildDeployRole',{
    roleName: "LyraBuildDeployRole",
    assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
  });
  
  buildRole.addToPolicy(new iam.PolicyStatement({
    resources: ['*'],
    actions: ['ssm:*'],
  }));
  
  const lyra_image_amd_build = new codebuild.Project(this, `LyraAssetsImageAmdBuild`, {
    environment: {privileged:true,buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_3},
    //cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER, codebuild.LocalCacheMode.CUSTOM),
    role: buildRole,
    buildSpec: codebuild.BuildSpec.fromObject(
      {
        version: "0.2",
        env: {
          'exported-variables': [
            'AWS_ACCOUNT_ID','AWS_REGION','BASE_REPO','BASE_IMAGE_TAG','GAME_REPO','GAME_AMD_ASSETS_TAG','S3_LYRA_ASSETS'
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
              `export GAME_ASSETS_TAG="${GAME_AMD_ASSETS_TAG.valueAsString}"`,
              `export S3_LYRA_ASSETS="${S3_LYRA_ASSETS.valueAsString}"`,
              `cd lyra/server/assets-image-multiarch`,
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
  const lyra_image_arm_build = new codebuild.Project(this, `LyraAssetsImageArmBuild`, {
    environment: {privileged:true,buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_ARM_2},
    //cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER, codebuild.LocalCacheMode.CUSTOM),
    role: buildRole,
    buildSpec: codebuild.BuildSpec.fromObject(
      {
        version: "0.2",
        env: {
          'exported-variables': [
            'AWS_ACCOUNT_ID','AWS_REGION','BASE_REPO','BASE_IMAGE_TAG','GAME_REPO','GAME_ARM_ASSETS_TAG','S3_LYRA_ASSETS'
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
              `export GAME_ASSETS_TAG="${GAME_ARM_ASSETS_TAG.valueAsString}"`,
              `export S3_LYRA_ASSETS="${S3_LYRA_ASSETS.valueAsString}"`,
              `cd lyra/server/assets-image-multiarch`,
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
  const lyra_image_assembly = new codebuild.Project(this, `LyraAssetsImageMultiarchAssembly`, {
    environment: {privileged:true,buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_ARM_2},
    //cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER, codebuild.LocalCacheMode.CUSTOM),
    role: buildRole,
    buildSpec: codebuild.BuildSpec.fromObject(
      {
        version: "0.2",
        env: {
          'exported-variables': [
            'AWS_ACCOUNT_ID','AWS_REGION','GAME_REPO','GAME_ASSETS_TAG','GAME_AMD_ASSETS_TAG','GAME_ARM_ASSETS_TAG'
          ],
        },
        phases: {
          build: {
            commands: [
              `export AWS_ACCOUNT_ID="${this.account}"`,
              `export AWS_REGION="${this.region}"`,
              `export GAME_REPO="${GAME_REPO.valueAsString}"`,
              `export GAME_ASSETS_TAG="${GAME_ASSETS_TAG.valueAsString}"`,
              `export GAME_AMD_ASSETS_TAG="${GAME_AMD_ASSETS_TAG.valueAsString}"`,
              `export GAME_ARM_ASSETS_TAG="${GAME_ARM_ASSETS_TAG.valueAsString}"`,
              `cd lyra/server/assets-image-multiarch`,
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

  base_registry.grantPullPush(lyra_image_amd_build.grantPrincipal);
  base_registry.grantPullPush(lyra_image_arm_build.grantPrincipal);
  lyra_registry.grantPullPush(lyra_image_amd_build.grantPrincipal);
  lyra_registry.grantPullPush(lyra_image_arm_build.grantPrincipal);
  lyra_registry.grantPullPush(lyra_image_assembly.grantPrincipal);

  const sourceOutput = new codepipeline.Artifact();

  const lyrapipeline = new codepipeline.Pipeline(this,`LyraPipeline`);
  lyrapipeline.addStage({
    stageName: 'Source',
    actions: [
      new codepipeline_actions.GitHubSourceAction({
        actionName: 'GitHub_Source',
        owner: GITHUB_USER.valueAsString,
        repo: GITHUB_REPO.valueAsString,
        branch: GITHUB_BRANCH.valueAsString,
        output: sourceOutput,
        oauthToken: SecretValue.secretsManager("githubtoken",{jsonField: "token"}),
        trigger: codepipeline_actions.GitHubTrigger.WEBHOOK,
      })
      ]
  });
  lyrapipeline.addStage({
      stageName: 'LyraBuildImage',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'BuildARMAssets',
          input: sourceOutput,
          runOrder: 1,
          project: lyra_image_arm_build
        }),
        new codepipeline_actions.CodeBuildAction({
          actionName: 'BuildAMDAssets',
          input: sourceOutput,
          runOrder: 1,
          project: lyra_image_amd_build
        }),
        new codepipeline_actions.CodeBuildAction({
          actionName: 'AssembleAssetsBuilds',
          input: sourceOutput,
          runOrder: 2,
          project: lyra_image_assembly
        })
      ]
  });
  }
}
