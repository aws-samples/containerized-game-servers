# A sandbox UDP multiplayer video game 

We use the [Supertuxkart](https://supertuxkart.net/) game. SuperTuxKart is a free kart racing game. It focuses on fun and not on realistic kart physics. 

## Deploy steps
Below is the sequence of execution steps for building a game docker image that runs on ARM64 and AMD64 CPU arch.

1/ Populate the following enviroment variables. 

```bash
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export AWS_REGION=us-west-2
export BASE_REPO=baseimage
export BASE_IMAGE_TAG=multiarch-py3
export GAME_REPO=stk
export GAME_CODE_TAG=stk-code-multiarch
export GAME_ASSETS_TAG=stk-assets-multiarch
export GAME_SERVER_TAG=stk-server-multiarch

export GITHUB_STK="https://github.com/yahavb/stk-code"
export GITHUB_STK_BRANCH=master
export SVN_STK="https://svn.code.sf.net/p/supertuxkart/code/stk-assets"

export INSTANCE_FAMILY=t4g
export CLUSTER_NAME=ddosudpsimu-us-west-2
```

2/ Build the base image

This is the image that includes the generic tools and libraries needed for the game. We used CPU architecture agnostic packages to allow dynamic compile and linkage to local architecture. The persona that most interested in this build is the IT/Devops that optimizes for stability and security

```bash
cd ./base-image-multiarch-python3
./build.sh
```

3/ Link the game assets 

This is the game images, video, and audio files. The persona that owns this step is the game artist. The media files (audio, images, and videos) can be stored on storage solutions such as SVN and S3. The original location for STK is https://github.com/supertuxkart/stk-assets-mobile/releases/download/git/stk-assets-full.zip but we copied it to S3 and broke it into 256MB pieces to allow optimized Docker layer cache.

```bash
cd ./stk-assets-image-multiarch
./build.sh
```

4/ Build the game binaries

Build the game executables. The persona that owns this is the game developer.

```bash
cd ./stk-code-image-multiarch
./build.sh
```

5/ Build the deployable game image

This is the game governance piece. It includes the scripts the controls the game lifecycle and the game ecosystem like matchmaking, leaderboard, and messaging applications. The persona that owns this step is the game live/devops team that operates the game.

```bash
cd ./stk-game-server-image-multiarch
./build.sh
```
