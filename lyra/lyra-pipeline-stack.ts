import { Construct } from 'constructs'
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as iam from "aws-cdk-lib/aws-iam";

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
  
  //codecommit repository that will contain the containerized app to build
  const buildxrepo = new codecommit.Repository(this, `buildxrepo`, {
    repositoryName:"buildx-lyra",
    description: "Lyra repository for the pipeline, includes all build phases",
    code: codecommit.Code.fromDirectory('./server/','main'),
  });
  const assetsgitrepo = new codecommit.Repository(this, `assets`, {
    repositoryName:"lyra-game-assets",
    description: "Lyra repository for the pipeline, includes game assets build",
    code: codecommit.Code.fromDirectory('./server/assets-image-multiarch','main'),
  });
/*
  const devopsgitrepo = new codecommit.Repository(this, `devops`, {
    repositoryName:"lyra-game-devops",
    description: "Lyra repository for the pipeline, includes agones sdk phase",
    code: codecommit.Code.fromDirectory('./server/game-server-image-multiarch','main'),
  });
  //const gitrepo = codecommit.Repository.fromRepositoryName(this,`gitrepo`,CODE_COMMIT_REPO.valueAsString)
 */   
  const base_registry = ecr.Repository.fromRepositoryName(this,`base_repo`,BASE_REPO.valueAsString)
  const stk_assets_bucket = s3.Bucket.fromBucketName(this,`game_assets_bucket`,S3_LYRA_ASSETS.valueAsString)

  const lyra_registry = new ecr.Repository(this,`game_repo`,{
    repositoryName:GAME_REPO.valueAsString,
    imageScanOnPush: true
  });

  //create a roleARN for codebuild 
  const buildRole = new iam.Role(this, 'LyraBuildDeployRole',{
    roleName: "LyraBuildDeployRole",
    assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
  });
  
  buildRole.addToPolicy(new iam.PolicyStatement({
    resources: ['*'],
    actions: ['ssm:*'],
  }));
  
  const lyra_assets_image_amd_build = new codebuild.Project(this, `LyraAssetsImageAmdBuild`, {
    environment: {privileged:true,buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_3},
    cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER, codebuild.LocalCacheMode.CUSTOM),
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
  const lyra_assets_image_arm_build = new codebuild.Project(this, `LyraAssetsImageArmBuild`, {
    environment: {privileged:true,buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_ARM_2},
    cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER, codebuild.LocalCacheMode.CUSTOM),
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
  const lyra_assets_image_assembly = new codebuild.Project(this, `LyraAssetsImageMultiarchAssembly`, {
    environment: {privileged:true,buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_ARM_2},
    cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER, codebuild.LocalCacheMode.CUSTOM),
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
/*
  const lyra_game_image_amd_build = new codebuild.Project(this, `LyraGameImageAmdBuild`, {
    environment: {privileged:true,buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_3},
    role: buildRole,
    buildSpec: codebuild.BuildSpec.fromObject(
      {
        version: "0.2",
        env: {
          'exported-variables': [
            'AWS_ACCOUNT_ID','AWS_REGION','GAME_REPO','GAME_AMD_SERVER_TAG','GAME_ASSETS_TAG','GAME_SERVER_TAG','BASE_REPO','BASE_IMAGE_TAG'
          ],
        },
        phases: {
          build: {
            commands: [
              `export AWS_ACCOUNT_ID="${this.account}"`,
              `export AWS_REGION="${this.region}"`,
              `export GAME_REPO="${GAME_REPO.valueAsString}"`,
              `export GAME_SERVER_TAG="${GAME_AMD_SERVER_TAG.valueAsString}"`,
              `export GAME_ASSETS_TAG="${GAME_ASSETS_TAG.valueAsString}"`,
              `export GAME_CODE_TAG="${GAME_CODE_TAG.valueAsString}"`,
              `export BASE_REPO="${BASE_REPO.valueAsString}"`,
              `export BASE_IMAGE_TAG="${BASE_IMAGE_TAG.valueAsString}"`,
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
 */ 
/*
  const lyra_game_image_arm_build = new codebuild.Project(this, `LyraGameImageArmBuild`, {
    environment: {privileged:true,buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_ARM_2},
    role: buildRole,
    buildSpec: codebuild.BuildSpec.fromObject(
      {
        version: "0.2",
        env: {
          'exported-variables': [
            'AWS_ACCOUNT_ID','AWS_REGION','GAME_REPO','GAME_ARM_SERVER_TAG','GAME_ASSETS_TAG','GAME_CODE_TAG','BASE_REPO','BASE_IMAGE_TAG'
          ],
        },
        phases: {
          build: {
            commands: [
              `export AWS_ACCOUNT_ID="${this.account}"`,
              `export AWS_REGION="${this.region}"`,
              `export GAME_REPO="${GAME_REPO.valueAsString}"`,
              `export GAME_SERVER_TAG="${GAME_ARM_SERVER_TAG.valueAsString}"`,
              `export GAME_ASSETS_TAG="${GAME_ASSETS_TAG.valueAsString}"`,
              `export GAME_CODE_TAG="${GAME_CODE_TAG.valueAsString}"`,
              `export BASE_REPO="${BASE_REPO.valueAsString}"`,
              `export BASE_IMAGE_TAG="${BASE_IMAGE_TAG.valueAsString}"`,
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
 */ 
/*
  const lyra_game_image_assembly = new codebuild.Project(this, `LyraGameImageMultiarchAssembly`, {
    environment: {privileged:true,buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_ARM_2},
    cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER, codebuild.LocalCacheMode.CUSTOM),
    role: buildRole,
    buildSpec: codebuild.BuildSpec.fromObject(
      {
        version: "0.2",
        env: {
          'exported-variables': [
            'AWS_ACCOUNT_ID','AWS_REGION','GAME_REPO','GAME_AMD_SERVER_TAG','GAME_ARM_SERVER_TAG','GAME_SERVER_TAG'
          ],
        },
        phases: {
          build: {
            commands: [
              `export AWS_ACCOUNT_ID="${this.account}"`,
              `export AWS_REGION="${this.region}"`,
              `export GAME_REPO="${GAME_REPO.valueAsString}"`,
              `export GAME_AMD_SERVER_TAG="${GAME_AMD_SERVER_TAG.valueAsString}"`,
              `export GAME_ARM_SERVER_TAG="${GAME_ARM_SERVER_TAG.valueAsString}"`,
              `export GAME_SERVER_TAG="${GAME_SERVER_TAG.valueAsString}"`,
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
 */ 

  base_registry.grantPullPush(lyra_assets_image_amd_build.grantPrincipal);
  base_registry.grantPullPush(lyra_assets_image_arm_build.grantPrincipal);
  lyra_registry.grantPullPush(lyra_assets_image_amd_build.grantPrincipal);
  lyra_registry.grantPullPush(lyra_assets_image_arm_build.grantPrincipal);
  lyra_registry.grantPullPush(lyra_assets_image_assembly.grantPrincipal);
  /*lyra_registry.grantPullPush(lyra_game_image_arm_build.grantPrincipal);
  lyra_registry.grantPullPush(lyra_game_image_amd_build.grantPrincipal);
  lyra_registry.grantPullPush(lyra_game_image_assembly.grantPrincipal);*/

  const sourceOuput = new codepipeline.Artifact();

  const artistpipeline = new codepipeline.Pipeline(this,`LyraArtistPipeline`);
  artistpipeline.addStage({
      stageName: 'Source',
      actions: [
      new codepipeline_actions.CodeCommitSourceAction({
        actionName: 'CodeCommit_Source',
        repository: assetsgitrepo,
        //runOrder: 1,
        output: sourceOuput,
        branch: 'main'
      }),
      ]
  });
  artistpipeline.addStage({
      stageName: 'LyraAssetsBuildImage',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'BuildARMAssets',
          input: sourceOuput,
          runOrder: 1,
          project: lyra_assets_image_arm_build
        }),
        new codepipeline_actions.CodeBuildAction({
          actionName: 'BuildAMDAssets',
          input: sourceOuput,
          runOrder: 1,
          project: lyra_assets_image_amd_build
        }),
        new codepipeline_actions.CodeBuildAction({
          actionName: 'AssembleAssetsBuilds',
          input: sourceOuput,
          runOrder: 2,
          project: lyra_assets_image_assembly
        })
      ]
  });
/*
  const devopspipeline = new codepipeline.Pipeline(this,`LyraDevOpsPipeline`);
  devopspipeline.addStage({
      stageName: 'Source',
      actions: [
      new codepipeline_actions.CodeCommitSourceAction({
        actionName: 'CodeCommit_Source',
        repository: devopsgitrepo,
        //runOrder: 1,
        output: sourceOuput,
        branch: 'main'
      })
      ]
  });
  devopspipeline.addStage({
      stageName: 'LyraGameBuildImage',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'BuildAgonesARMGame',
          input: sourceOuput,
          runOrder: 1,
          project: lyra_game_image_arm_build
        }),
        new codepipeline_actions.CodeBuildAction({
          actionName: 'BuildAgonesAMDGame',
          input: sourceOuput,
          runOrder: 1,
          project: lyra_game_image_amd_build
        }),
        new codepipeline_actions.CodeBuildAction({
          actionName: 'AssembleAgonesGame',
          input: sourceOuput,
          runOrder: 2,
          project: lyra_game_image_assembly
        })
      ]
  });
*/
  }
}
