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
  const BASE_IMAGE_AMD_TAG = new CfnParameter(this,"BASEIMAGEAMDTAG",{type:"String"});
  const BASE_IMAGE_ARM_TAG = new CfnParameter(this,"BASEIMAGEARMTAG",{type:"String"});

  
  //codecommit repository that will contain the containerized app to build
  const gitrepo = new codecommit.Repository(this, `gitrepo`, {
    repositoryName:BASE_REPO.valueAsString,
    description: "STK repository for the pipeline, includes all the build phases",
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
    
  const base_image_buildx = new codebuild.Project(this, `BaseImageBuild`, {
    environment: {privileged:true,buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_ARM_2},
    cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER, codebuild.LocalCacheMode.CUSTOM),
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


  const base_image_arm_build = new codebuild.Project(this, `BaseImageArmBuild`, {
    environment: {privileged:true,buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_ARM_2},
    cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER, codebuild.LocalCacheMode.CUSTOM),
    role: buildRole,
    buildSpec: codebuild.BuildSpec.fromObject(
      {
        version: "0.2",
        env: {
          'exported-variables': [
            'AWS_ACCOUNT_ID','AWS_REGION','BASE_REPO','BASE_IMAGE_ARM_TAG'
          ],
        },
        phases: {
          build: {
            commands: [
              `export AWS_ACCOUNT_ID="${this.account}"`,
              `export AWS_REGION="${this.region}"`,
              `export BASE_REPO="${BASE_REPO.valueAsString}"`,
              `export BASE_IMAGE_TAG="${BASE_IMAGE_ARM_TAG.valueAsString}"`,
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

  const base_image_amd_build = new codebuild.Project(this, `BaseImageAmdBuild`, {
    environment: {privileged:true,buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_3},
    cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER, codebuild.LocalCacheMode.CUSTOM),
    role: buildRole,
    buildSpec: codebuild.BuildSpec.fromObject(
      {
        version: "0.2",
        env: {
          'exported-variables': [
            'AWS_ACCOUNT_ID','AWS_REGION','BASE_REPO','BASE_IMAGE_AMD_TAG'
          ],
        },
        phases: {
          build: {
            commands: [
              `export AWS_ACCOUNT_ID="${this.account}"`,
              `export AWS_REGION="${this.region}"`,
              `export BASE_REPO="${BASE_REPO.valueAsString}"`,
              `export BASE_IMAGE_TAG="${BASE_IMAGE_AMD_TAG.valueAsString}"`,
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

  const base_image_assembly = new codebuild.Project(this, `BaseImageAmdBuildAssembly`, {
    environment: {privileged:true,buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_ARM_2},
    cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER, codebuild.LocalCacheMode.CUSTOM),
    role: buildRole,
    buildSpec: codebuild.BuildSpec.fromObject(
      {
        version: "0.2",
        env: {
          'exported-variables': [
            'AWS_ACCOUNT_ID','AWS_REGION','BASE_REPO','BASE_IMAGE_AMD_TAG','BASE_IMAGE_ARM_TAG','BASE_IMAGE_TAG'
          ],
        },
        phases: {
          build: {
            commands: [
              `export AWS_ACCOUNT_ID="${this.account}"`,
              `export AWS_REGION="${this.region}"`,
              `export BASE_REPO="${BASE_REPO.valueAsString}"`,
              `export BASE_IMAGE_AMD_TAG="${BASE_IMAGE_AMD_TAG.valueAsString}"`,
              `export BASE_IMAGE_ARM_TAG="${BASE_IMAGE_ARM_TAG.valueAsString}"`,
              `export BASE_IMAGE_TAG="${BASE_IMAGE_TAG.valueAsString}"`,
              `cd base-image-multiarch-python3`,
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
    
  //we allow the buildProject principal to push images to ecr
  base_registry.grantPullPush(base_image_buildx.grantPrincipal);
  base_registry.grantPullPush(base_image_arm_build.grantPrincipal);
  base_registry.grantPullPush(base_image_amd_build.grantPrincipal);
  base_registry.grantPullPush(base_image_assembly.grantPrincipal);

  // here we define our pipeline and put together the assembly line
  const sourceOuput = new codepipeline.Artifact();

  const basebuildpipeline = new codepipeline.Pipeline(this,`BuildBasePipeline`);
  basebuildpipeline.addStage({
    stageName: 'Source',
    actions: [
      new codepipeline_actions.CodeCommitSourceAction({
        actionName: 'CodeCommit_Source',
        repository: gitrepo,
        output: sourceOuput,
        branch: 'main'
      })
      ]
  });

  basebuildpipeline.addStage({
    stageName: 'BaseImageBuild',
    actions: [
      new codepipeline_actions.CodeBuildAction({
        actionName: 'BaseImageArmBuildX',
        input: sourceOuput,
        runOrder: 1,
        project: base_image_arm_build
      }),
      new codepipeline_actions.CodeBuildAction({
        actionName: 'BaseImageAmdBuildX',
        input: sourceOuput,
        runOrder: 1,
        project: base_image_amd_build
      }),
      new codepipeline_actions.CodeBuildAction({
          actionName: 'AssembleBaseBuilds',
          input: sourceOuput,
          runOrder: 2,
          project: base_image_assembly
        })
    ]
  });
  /*const basebuildxpipeline = new codepipeline.Pipeline(this,`BuildXBasePipeline`);
  basebuildxpipeline.addStage({
    stageName: 'Source',
    actions: [
      new codepipeline_actions.CodeCommitSourceAction({
        actionName: 'CodeCommit_Source',
        repository: gitrepo,
        output: sourceOuput,
        branch: 'main'
      })
      ]
  });
  basebuildxpipeline.addStage({
    stageName: 'BaseImageBuildX',
    actions: [
       new codepipeline_actions.CodeBuildAction({
         actionName: 'Build_Code',
         input: sourceOuput,
         project: base_image_buildx
       }),
       ]
  });*/
  }
}
