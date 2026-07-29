import { Construct } from 'constructs'
import { Stack, StackProps, CfnParameter, SecretValue } from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';

export class SpotSigPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

  const SPOTSIG_REPO = new CfnParameter(this,"SPOTSIGREPO",{type:"String",default:"spotsig"});
  const SPOTSIG_TAG = new CfnParameter(this,"SPOTSIGTAG",{type:"String",default:"aarch64"});
  const GITHUB_USER = new CfnParameter(this,"GITHUBUSER",{type:"String"});
  const GITHUB_REPO = new CfnParameter(this,"GITHUBREPO",{type:"String"});
  const GITHUB_BRANCH = new CfnParameter(this,"GITHUBBRANCH",{type:"String"});

  // ECR repository in the DEPLOYING account. The image URI is derived from
  // this.account/this.region so the handler image is always pulled from the
  // end user's own registry rather than a hardcoded sample-owner account.
  const spotsig_registry = new ecr.Repository(this,`spotsig_repo`,{
    repositoryName: SPOTSIG_REPO.valueAsString,
    imageScanOnPush: true,
  });

  // The spot signal handler is a single-arch (arm64) image, so no buildx
  // multiarch assembly is needed. CodeBuild runs build.sh with the account,
  // region, repo and tag exported, and build.sh assembles the ECR URI + pushes.
  const spotsig_image_build = new codebuild.Project(this, `SpotSigImageArmBuild`, {
    environment: {privileged:true,buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_ARM_2},
    buildSpec: codebuild.BuildSpec.fromObject(
      {
        version: "0.2",
        env: {
          'exported-variables': [
            'AWS_ACCOUNT_ID','AWS_REGION','SPOTSIG_REPO','SPOTSIG_TAG'
          ],
        },
        phases: {
          build: {
            commands: [
              `export AWS_ACCOUNT_ID="${this.account}"`,
              `export AWS_REGION="${this.region}"`,
              `export SPOTSIG_REPO="${SPOTSIG_REPO.valueAsString}"`,
              `export SPOTSIG_TAG="${SPOTSIG_TAG.valueAsString}"`,
              `cd spot-sig-handler`,
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

  spotsig_registry.grantPullPush(spotsig_image_build.grantPrincipal);

  const sourceOutput = new codepipeline.Artifact();

  const spotsigpipeline = new codepipeline.Pipeline(this,`SpotSigPipeline`);
  spotsigpipeline.addStage({
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
  spotsigpipeline.addStage({
      stageName: 'SpotSigBuildImage',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'BuildImage',
          input: sourceOutput,
          project: spotsig_image_build
        })
      ]
  });
  }
}
