import { Stack, StackProps, CfnParameter,SecretValue  } from 'aws-cdk-lib';
import { Construct } from 'constructs'
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
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
  const GAME_ARM_ASSETS_TAG = new CfnParameter(this,"GAMEARMASSETSTAG",{type:"String"});
  const GAME_AMD_ASSETS_TAG = new CfnParameter(this,"GAMEAMDASSETSTAG",{type:"String"});
  const GAME_CODE_TAG = new CfnParameter(this,"GAMECODETAG",{type:"String"});
  const GAME_ARM_CODE_TAG = new CfnParameter(this,"GAMEARMCODETAG",{type:"String"});
  const GAME_AMD_CODE_TAG = new CfnParameter(this,"GAMEAMDCODETAG",{type:"String"});
  const GAME_SERVER_TAG = new CfnParameter(this,"GAMESERVERTAG",{type:"String"});
  const GAME_ARM_SERVER_TAG = new CfnParameter(this,"GAMEARMSERVERTAG",{type:"String"});
  const GAME_AMD_SERVER_TAG = new CfnParameter(this,"GAMEAMDSERVERTAG",{type:"String"});
  const SVN_STK = new CfnParameter(this,"SVNSTK",{type:"String"});
  const GITHUB_STK = new CfnParameter(this,"GITHUBSTK",{type:"String"});
  const GITHUB_STK_BRANCH = new CfnParameter(this,"GITHUBSTKBRANCH",{type:"String"});
  const S3_STK_ASSETS = new CfnParameter(this,"S3STKASSETS",{type:"String"});
  const GITHUB_OAUTH_TOKEN = new CfnParameter(this,"GITHUBOAUTHTOKEN",{type:"String"});
  const GITHUB_USER = new CfnParameter(this,"GITHUBUSER",{type:"String"});
  const GITHUB_REPO = new CfnParameter(this,"GITHUBREPO",{type:"String"});
  const GITHUB_BRANCH = new CfnParameter(this,"GITHUBBRANCH",{type:"String"});
  
  const base_registry = ecr.Repository.fromRepositoryName(this,`base_repo`,BASE_REPO.valueAsString)
  const stk_assets_bucket = s3.Bucket.fromBucketName(this,`game_assets_bucket`,S3_STK_ASSETS.valueAsString)
  /* uncomment when you test the stack and dont want to manually delete the ecr registry 
  const stk_registry = new ecr.Repository(this,`game_repo`,{
    repositoryName:GAME_REPO.valueAsString,
    imageScanOnPush: true
  });
  */
  const stk_registry = ecr.Repository.fromRepositoryName(this,`game_repo`,GAME_REPO.valueAsString)

  //create a roleARN for codebuild 
  const buildRole = new iam.Role(this, 'StkBuildDeployRole',{
    roleName: "StkBuildDeployRole",
    assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
  });
  
  buildRole.addToPolicy(new iam.PolicyStatement({
    resources: ['*'],
    actions: ['ssm:*'],
  }));
  
  const stk_assets_image_buildx = new codebuild.Project(this, `STKAssetsImageBuildX`, {
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
              `cd supertuxkart/server/stk-assets-image-multiarch`,
              `chmod +x ./enable-buildx.sh && ./enable-buildx.sh`,
              `export AWS_ACCOUNT_ID="${this.account}"`,
              `export AWS_REGION="${this.region}"`,
              `export BASE_REPO="${BASE_REPO.valueAsString}"`,
              `export BASE_IMAGE_TAG="${BASE_IMAGE_TAG.valueAsString}"`,
              `export GAME_REPO="${GAME_REPO.valueAsString}"`,
              `export GAME_ASSETS_TAG="${GAME_ASSETS_TAG.valueAsString}"`,
              `export SVN_STK="${SVN_STK.valueAsString}"`,
              `export S3_STK_ASSETS="${S3_STK_ASSETS.valueAsString}"`,
              `chmod +x ./buildx.sh && ./buildx.sh`
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
    role: buildRole,
    buildSpec: codebuild.BuildSpec.fromObject(
      {
        version: "0.2",
        env: {
          'exported-variables': [
            'AWS_ACCOUNT_ID','AWS_REGION','BASE_REPO','BASE_IMAGE_TAG','GAME_REPO','GAME_ASSETS_TAG','GITHUB_STK','GITHUB_STK_BRANCH','GAME_ARM_CODE_TAG'
          ],
        },
        phases: {
          build: {
            commands: [
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
              `cd supertuxkart/server/stk-code-image-multiarch`,
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

  const stk_code_image_arm_buildx = new codebuild.Project(this, `STKCodeImageArmBuildX`, {
    environment: {privileged:true,buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_ARM_2},
    role: buildRole,
    buildSpec: codebuild.BuildSpec.fromObject(
      {
        version: "0.2",
        env: {
          'exported-variables': [
            'AWS_ACCOUNT_ID','AWS_REGION','BASE_REPO','BASE_IMAGE_TAG','GAME_REPO','GAME_ASSETS_TAG','GITHUB_STK','GITHUB_STK_BRANCH','GAME_ARM_CODE_TAG'
          ],
        },
        phases: {
          build: {
            commands: [
              `cd supertuxkart/server/stk-code-image-multiarch`,
              `chmod +x ./enable-buildx.sh && ./enable-buildx.sh`,
              `export AWS_ACCOUNT_ID="${this.account}"`,
              `export AWS_REGION="${this.region}"`,
              `export BUILDX_VER="${BUILDX_VER.valueAsString}"`,
              `export BASE_REPO="${BASE_REPO.valueAsString}"`,
              `export BASE_IMAGE_TAG="${BASE_IMAGE_TAG.valueAsString}"`,
              `export GAME_REPO="${GAME_REPO.valueAsString}"`,
              `export GAME_ASSETS_TAG="${GAME_ASSETS_TAG.valueAsString}"`,
              `export GAME_CODE_TAG="${GAME_CODE_TAG.valueAsString}"`,
              `export GITHUB_STK="${GITHUB_STK.valueAsString}"`,
              `export GITHUB_STK_BRANCH="${GITHUB_STK_BRANCH.valueAsString}"`,
              `chmod +x ./buildx.sh && ./buildx.sh`
            ],
          }
        },
        artifacts: {
          files: ['imageDetail.json']
        },
      }
    ),
  });


  const stk_code_image_amd_buildx = new codebuild.Project(this, `STKCodeImageAmdBuildX`, {
    environment: {privileged:true,buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_3},
    role: buildRole,
    buildSpec: codebuild.BuildSpec.fromObject(
      {
        version: "0.2",
        env: {
          'exported-variables': [
            'AWS_ACCOUNT_ID','AWS_REGION','BASE_REPO','BASE_IMAGE_TAG','GAME_REPO','GAME_ASSETS_TAG','GITHUB_STK','GITHUB_STK_BRANCH','GAME_ARM_CODE_TAG'
          ],
        },
        phases: {
          build: {
            commands: [
              `cd supertuxkart/server/stk-code-image-multiarch`,
              `chmod +x ./enable-buildx.sh && ./enable-buildx.sh`,
              `export AWS_ACCOUNT_ID="${this.account}"`,
              `export AWS_REGION="${this.region}"`,
              `export BUILDX_VER="${BUILDX_VER.valueAsString}"`,
              `export BASE_REPO="${BASE_REPO.valueAsString}"`,
              `export BASE_IMAGE_TAG="${BASE_IMAGE_TAG.valueAsString}"`,
              `export GAME_REPO="${GAME_REPO.valueAsString}"`,
              `export GAME_ASSETS_TAG="${GAME_ASSETS_TAG.valueAsString}"`,
              `export GAME_CODE_TAG="${GAME_CODE_TAG.valueAsString}"`,
              `export GITHUB_STK="${GITHUB_STK.valueAsString}"`,
              `export GITHUB_STK_BRANCH="${GITHUB_STK_BRANCH.valueAsString}"`,
              `chmod +x ./buildx.sh && ./buildx.sh`
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
 //   cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER, codebuild.LocalCacheMode.CUSTOM),
    role: buildRole,
    buildSpec: codebuild.BuildSpec.fromObject(
      {
        version: "0.2",
        env: {
          'exported-variables': [
            'AWS_ACCOUNT_ID','AWS_REGION','BASE_REPO','BASE_IMAGE_TAG','GAME_REPO','GAME_ASSETS_TAG','GITHUB_STK','GITHUB_STK_BRANCH','GAME_AMD_CODE_TAG'
          ],
        },
        phases: {
          build: {
            commands: [
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
              `cd supertuxkart/server/stk-code-image-multiarch`,
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
    environment: {privileged:true,buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_ARM_2},
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
              `cd supertuxkart/server/stk-code-image-multiarch`,
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

  const stk_game_image_buildx = new codebuild.Project(this, `STKGameImageBuildX`, {
    environment: {privileged:true,buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_ARM_2},
    role: buildRole,
    buildSpec: codebuild.BuildSpec.fromObject(
      {
        version: "0.2",
        env: {
          'exported-variables': [
            'AWS_ACCOUNT_ID','AWS_REGION','GAME_REPO','GAME_AMD_SERVER_TAG','GAME_ASSETS_TAG','GAME_CODE_TAG','BASE_REPO','BASE_IMAGE_TAG','BUILDX_VER'
          ],
        },
        phases: {
          build: {
            commands: [
              `cd supertuxkart/server/stk-game-server-image-multiarch`,
              `chmod +x ./enable-buildx.sh && ./enable-buildx.sh`,
              `export AWS_ACCOUNT_ID="${this.account}"`,
              `export AWS_REGION="${this.region}"`,
              `export GAME_REPO="${GAME_REPO.valueAsString}"`,
              `export GAME_SERVER_TAG="${GAME_AMD_SERVER_TAG.valueAsString}"`,
              `export GAME_ASSETS_TAG="${GAME_ASSETS_TAG.valueAsString}"`,
              `export GAME_CODE_TAG="${GAME_CODE_TAG.valueAsString}"`,
              `export BASE_REPO="${BASE_REPO.valueAsString}"`,
              `export BASE_IMAGE_TAG="${BASE_IMAGE_TAG.valueAsString}"`,
              `chmod +x ./buildx.sh && ./buildx.sh`
            ],
          }
        },
        artifacts: {
          files: ['imageDetail.json']
        },
      }
    ),
  });

  base_registry.grantPullPush(stk_assets_image_buildx.grantPrincipal);
  stk_registry.grantPullPush(stk_assets_image_buildx.grantPrincipal);


  stk_registry.grantPullPush(stk_code_image_arm_buildx.grantPrincipal);
  stk_registry.grantPullPush(stk_code_image_amd_buildx.grantPrincipal);
  
  stk_registry.grantPullPush(stk_code_image_arm_build.grantPrincipal);
  stk_registry.grantPullPush(stk_code_image_amd_build.grantPrincipal);
  stk_registry.grantPullPush(stk_code_image_assembly.grantPrincipal);

  stk_registry.grantPullPush(stk_game_image_buildx.grantPrincipal);

  const sourceOutput = new codepipeline.Artifact();


  const buildxcodeamdpipeline = new codepipeline.Pipeline(this,`STKCodeAmdBuildXPipeline`);
  buildxcodeamdpipeline.addStage({
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
        //oauthToken: SecretValue.unsafePlainText(GITHUB_OAUTH_TOKEN.valueAsString)
      })
      ]
  });
  
  buildxcodeamdpipeline.addStage({
      stageName: 'BuildAssets',
      actions: [
      new codepipeline_actions.CodeBuildAction({
        actionName: 'BuildAssets',
        input: sourceOutput,
        project: stk_code_image_arm_buildx
      })
      ]
  });

  const buildxcodearmpipeline = new codepipeline.Pipeline(this,`STKCodeArmBuildXPipeline`);
  buildxcodearmpipeline.addStage({
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
        //oauthToken: SecretValue.unsafePlainText(GITHUB_OAUTH_TOKEN.valueAsString)
      })
      ]
  });
  
  buildxcodearmpipeline.addStage({
      stageName: 'BuildAssets',
      actions: [
      new codepipeline_actions.CodeBuildAction({
        actionName: 'BuildAssets',
        input: sourceOutput,
        project: stk_code_image_arm_buildx
      })
      ]
  });

  const artistpipeline = new codepipeline.Pipeline(this,`STKArtistBuildXPipeline`);
  artistpipeline.addStage({
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
        //oauthToken: SecretValue.unsafePlainText(GITHUB_OAUTH_TOKEN.valueAsString)
      })
      ]
  });
  
  artistpipeline.addStage({
      stageName: 'BuildAssets',
      actions: [
      new codepipeline_actions.CodeBuildAction({
        actionName: 'BuildAssets',
        input: sourceOutput,
        project: stk_assets_image_buildx
      })
      ]
  });

  const developerpipeline = new codepipeline.Pipeline(this,`STKDeveloperPipeline`);
  developerpipeline.addStage({
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
        //oauthToken: SecretValue.unsafePlainText(GITHUB_OAUTH_TOKEN.valueAsString)
      })
      ]
  });
  
  developerpipeline.addStage({
      stageName: 'STKCodeBuildImage',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'BuildARMCode',
          input: sourceOutput,
          runOrder: 1,
          project: stk_code_image_arm_build
        }),
        new codepipeline_actions.CodeBuildAction({
          actionName: 'BuildAMDCode',
          input: sourceOutput,
          runOrder: 1,
          project: stk_code_image_amd_build
        }),
        new codepipeline_actions.CodeBuildAction({
          actionName: 'AssembleCodeBuilds',
          input: sourceOutput,
          runOrder: 2,
          project: stk_code_image_assembly
        })
      ]
  });

  const devopspipeline = new codepipeline.Pipeline(this,`STKDevOpsPipeline`);
  devopspipeline.addStage({
      stageName: 'Source',
      actions: [
      new codepipeline_actions.GitHubSourceAction({
        actionName: 'GitHub_Source',
        owner: GITHUB_USER.valueAsString,
        repo: GITHUB_REPO.valueAsString,
        branch: GITHUB_BRANCH.valueAsString,
        output: sourceOutput,
        oauthToken: SecretValue.secretsManager("githubtoken",{jsonField: "token"}),
        //trigger: codepipeline_actions.GitHubTrigger.WEBHOOK,
        //oauthToken: SecretValue.unsafePlainText(GITHUB_OAUTH_TOKEN.valueAsString)
      })
      ]
  });
  devopspipeline.addStage({
      stageName: 'STKGameBuildXImage',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'BuildxAgonesGame',
          input: sourceOutput,
          runOrder: 1,
          project: stk_game_image_buildx
        }),
      ]
  });
  }
}
