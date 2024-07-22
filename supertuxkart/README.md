# A sandbox UDP multiplayer video game 

### How to use this sample?
* Build the game image ([manually](./README.md#Manual-image-build-steps) or with [AWS Developer automation](./README.md#Automated-image-deploy-steps). [More about multi-arch image CI](./multi-arch-ci.md)
* Create an [EKS cluster with Karpenter](https://karpenter.sh/v0.27.0/getting-started/getting-started-with-eksctl/)
* Deploy [Agones](https://agones.dev/site/docs/installation/install-agones/helm/) in EKS
* Optional - Deploy [matchmaker](https://github.com/aws-samples/amazon-aurora-call-to-amazon-sagemaker-sample/tree/master/multiplayer-matchmaker)
* Deploy [Container Insights](https://github.com/aws-samples/containerized-game-servers/tree/master/craft#deploy-container-insights)
* Deploy the game server and game bot
* Download the [game client](https://supertuxkart.net/Download). Discover the game endpoint (`kubectl get gs`) and connect or spectate the bot playing. 

### Manual image build steps
Below is the sequence of manual execution steps for building a game docker image that runs on ARM64 and AMD64 CPU arch.We also offer automation with CodePipeline and CodeBuild in the next section

0/ Fork this repo to use it as source with `codepipeline_actions.GitHubSourceAction`

1/ Populate the following enviroment variables. 

```bash
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export AWS_REGION=us-west-2
export BUILDX_VER=v0.10.3
export BASE_REPO=baseimage
export BASE_IMAGE_TAG=multiarch-py3
export BASE_IMAGE_ARM_TAG=arm-py3
export BASE_IMAGE_AMD_TAG=amd-py3
export GAME_REPO=stk-ci
export GAME_ASSETS_TAG=stk-assets-multiarch
export GAME_ARM_ASSETS_TAG=stk-assets-arm
export GAME_AMD_ASSETS_TAG=stk-assets-amd
export GAME_ARM_CODE_TAG=stk-code-arm
export GAME_AMD_CODE_TAG=stk-code-amd
export GAME_CODE_TAG=stk-code-multiarch
export GAME_SERVER_TAG=stk-server-multiarch
export GAME_ARM_SERVER_TAG=stk-server-arm
export GAME_AMD_SERVER_TAG=stk-server-amd
export GITHUB_STK="https://github.com/yahavb/stk-code"
export GITHUB_STK_BRANCH=master
export SVN_STK="https://svn.code.sf.net/p/supertuxkart/code/stk-assets"
export S3_STK_ASSETS="supertuxkart-assets"
export GITHUB_USER=mygithubusername
export GITHUB_BRANCH=master, main etc
export GITHUB_REPO=containerized-game-servers

export CLUSTER_NAME=stk-usw-2
```

Create a secret in the AWS Secrets Manager. Store New Secret -> Other type of secret -> Key to token and value to be the GitHub classic token - Settings->Developer settings -> Tokens (classic). The name of the secret should be `githubtoken`

2/ Build the base image

This is the image that includes the generic tools and libraries needed for the game. We used CPU architecture agnostic packages to allow dynamic compile and linkage to local architecture. The persona that most interested in this build is the IT/Devops that optimizes for stability and security

```bash
cd ./server/base-image-multiarch-python3
./buildx.sh
```

3/ Link the game assets 

This is the game images, video, and audio files. The persona that owns this step is the game artist. The media files (audio, images, and videos) can be stored on storage solutions such as SVN and S3. The original location for STK is https://github.com/supertuxkart/stk-assets-mobile/releases/download/git/stk-assets-full.zip but we copied it to S3 and broke it into 256MB pieces to allow optimized Docker layer cache.

```bash
cd ./server/stk-assets-image-multiarch
./buildx.sh
```

4/ Build the game binaries

Build the game executables. The persona that owns this is the game developer.

```bash
cd ./server/stk-code-image-multiarch
./buildx.sh
```

5/ Build the deployable game image

This is the game governance piece. It includes the scripts the controls the game lifecycle and the game ecosystem like matchmaking, leaderboard, and messaging applications. The persona that owns this step is the game live/devops team that operates the game.

```bash
cd ./server/stk-game-server-image-multiarch
./buildx.sh
```


### Automated image deploy steps
The following will create a CodePipline that copy the build scripts in `server/` folder into a CodeCommit repository and run the steps above in a separate CodeBuild jobs.

1/ deploy the pipeline that creates the base image

```bash
./deploy-base-pipeline.sh
```

2/ deploy the pipeline that creates the stk image game

```bash
./deploy-stk-pipeline.sh
```

#### Base-image Pipeline

The Source stage includes the [code and config](./server/base-image-multiarch-python3/). Note the [Dockerfile](./server/base-image-multiarch-python3/Dockerfile) includes no processor architecture specific so the libraries and packages linked dynamically via the packaged tools e.g., `apt` or `yum`

![alt text](./readmeimages/baseimage-ci.png "Base-image pipeline")

The resulted images of the base-image pipeline are two images: a 601.11 MB (AMD64) and 582.56 MB (ARM64) docker images. 
![alt text](./readmeimages/baseimage-ecr.png "Base-image pipeline result in ECR")

#### Game Artist Pipeline

The source stage includes the [code and config](./server/stk-assets-image-multiarch/). Note the build process pulls six assets files from S3 (256MB each) and copy to `/stk-assets` sub-directory. The Dockerfile pre-processed with `envsubst` command for setting the enviroment variables. 

![alt text](./readmeimages/stk-assets-ci.png "Supertuxkart game assets pipeline")

The resulted image of the developer pipeline are two images, `stk-assets-amd` 4637.98 for AMD64 and `stk-assets-arm` 4637.43 for ARM64 and Image Index. 
![alt text](./readmeimages/stk-assets-ecr.png "Supertuxkart assets pipeline result in ECR")


#### Game Developer Pipeline

The source stage includes the [code and config](./server/stk-code-image-multiarch/). 

![alt text](./readmeimages/stk-code-ci.png "Supertuxkart game developer pipeline")

We first copy the assets folder from the previous step.

```bash
FROM stk_base AS stk_code
	COPY --from=1 /stk-assets /stk-assets
```

Then we pull the code from a separate Git repository that compatible with the assets (`GITHUB_STK` and `GITHUB_STK_BRANCH`)

```bash
RUN git clone $GITHUB_STK stk-code --branch $GITHUB_STK_BRANCH && \
	    cd stk-code && \
	    mkdir cmake_build && \
	    cmake ../stk-code -B ./cmake_build -DSERVER_ONLY=ON && \
	    cd cmake_build && \
	    make -j$(nproc) -f ./Makefile install
```

The pipeline includes two identical build actions that runs on [ARM64](https://github.com/aws-samples/containerized-game-servers/blob/master/supertuxkart/stk-pipeline-stack.ts#L283) and [AMD64](https://github.com/aws-samples/containerized-game-servers/blob/master/supertuxkart/stk-pipeline-stack.ts#L318) instances. The third build action assembles the two images into a docker image index (manifest) by the [assemble_multiarch_image.sh](./server/stk-code-multiarch/assemble_multiarch_image.sh)

The resulted image of the developer pipeline are two images, `stk-code-amd` 3074.09 for AMD64 and `stk-code-arm` 3054.94 for ARM64 and Image Index. 
![alt text](./readmeimages/stk-code-ecr.png "Supertuxkart developer pipeline result in ECR")


#### Game Devops Pipeline

The source stage includes the [code and config](./server/stk-game-server-image-multiarch/). 

![alt text](./readmeimages/stk-agones-ci.png "Supertuxkart game devops pipeline")

Note that this step pulls only the compiled code produced by the game developer pipeline and the assets from the game artist pipeline.

```bash
FROM stk_base AS stk_game
COPY --from=1 /stk-assets /stk-assets
COPY --from=2 /stk-code /stk-code
```

and add to oit the [STK Agones SDK implementation](./server/stk-game-server-image-multiarch/). Like in previous steps, it runs two separete `docker build` jobs (2360.44 MB for AMD64 and 2341.56 MB for ARM64) that are assembled into a docker index image, `stk-server-multiarch`. 

![alt text](./readmeimages/stk-agones-ecr.png "Supertuxkart devops pipeline result in ECR")

Note that each pipeline phase is optimized for storage to avoid long replication time to the cluster. 
