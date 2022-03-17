# Continuously Integrate art and code changes with CodeBuild

This sample pulls the latest code changes from the game code repository (github) and the latest art work stored in the game svn (subversion), compiles the code, builds a multi-layer docker image, pushes to an image registry and scans it before deployment.

# How to start?

Install and configure AWS CLI to resolve the current region and account numbers

Install NPM and CDK

Configure the notification email you wish to get notifications about build status

Execute ./init.sh

# What does it do?

CDK will provision a new ECR image registry and CodeCommit repository, copy the configuration stored in (./dockerfiles)[./dockerfiles] to the CodeCommit repository and kick the build process upon git merges/pushes to the CodeCommit repo. 

The build process provision `codebuild.LinuxBuildImage.AMAZON_LINUX_2_ARM_2` image and kick the docker build steps listed in (lib/pipeline-stack.ts)[./lib/pipeline-stack.ts]

```ts
  const buildproject = new codebuild.Project(this, `dockerBuild`, {
       environment: {
            privileged: true,
            buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_ARM_2
         },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: "0.2",
        phases: {
          build: {
            commands: [`docker build -t ${this.account}.dkr.ecr.${this.region}.amazonaws.com/${registry.repositoryName}:${baseImageVersion.valueAsString} .`,
            `aws ecr get-login-password --region ${this.region} | docker login --username AWS --password-stdin ${this.account}.dkr.ecr.${this.region}.amazonaws.com/${registry.repositoryName}`,
            `docker push ${this.account}.dkr.ecr.${this.region}.amazonaws.com/${registry.repositoryName}:${baseImageVersion.valueAsString}`],
```

The docker build will first build the base image needed to compile and link the code.

```
FROM public.ecr.aws/debian/debian:stable-slim as debian_base
RUN apt-get install -y
RUN apt-get update -y
RUN apt-get install build-essential cmake libbluetooth-dev libsdl2-dev \
libcurl4-openssl-dev libenet-dev libfreetype6-dev libharfbuzz-dev \
libjpeg-dev libogg-dev libopenal-dev libpng-dev \
libssl-dev libvorbis-dev libmbedtls-dev pkg-config zlib1g-dev git sqlite3 subversion -y
```

We use Docker multi-stage builds to package our SuperTuxKart binaries and assets.
The first stage denoted by debian_base in the Dockerfile includes the required packages for compiling the code. The second stage, build_arts uses the base image and download the arts objects. The last stage, build_code uses the build_art stage to compile it code. The three stages allow the developer to recompile the image without re-installing the build packages, reducing build time and compute costs.

Then it uses the base image `debian_base` in building `build_art` that containes the game art content. 

```
FROM debian_base AS build_art
RUN svn co https://svn.code.sf.net/p/supertuxkart/code/stk-assets stk-assets
```

Finally, we use the `debian_base` to build the main image with the compiled code `build_code`. Note that we copy the art content by referencing the `build_art` as `COPY --from=1 /stk-assets /stk-assets`

```
FROM debian_base AS build_code
COPY --from=1 /stk-assets /stk-assets
RUN apt-get install git -y
RUN git clone https://github.com/supertuxkart/stk-code stk-code
RUN cd stk-code
RUN mkdir cmake_build
RUN cmake ../stk-code -B ./cmake_build -DSERVER_ONLY=ON
RUN cd cmake_build && make -j$(nproc) -f ./Makefile install
```

The reason we chose to use `build_art` as a docker stage is to keep the art work separate from the game code enabling the artists and developers work seperatly. 
