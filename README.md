# Containerized game servers
Containerized-game-servers proposes a method for securely distributing your game-binaries at scale for only 5% of the network cost

In this project/blog, we utilize [Docker multi-stage](https://docs.docker.com/develop/develop-images/multistage-build/) builds for containerizing the game assets builds. We use CodeBuild toolset to manage the build and deploy the updates of game-engines like AWS Lumberyard as ready-to-play dedicated game servers. We provide a deployment example for AWS Lumberyard Multiplayer Sample that is deployed to an EKS cluster. We show that frequent changes in the game binaries require less than 1% of the data transfer required by full image replication to the nodes that run the game-server instances. This is a significant improvement in build and integration time. We also show that the image being deployed is always the latest image which allows centralized control into the code to be scheduled upon distribution. 

The example herein shows an update of only 50MB of game assets where a full game-server binary weight is 3.1GB, only 1.5% of the content getting updated speeding up build process in 90% of non-containerized game-binaries. Security wise, with EKS we apply `imagePullPolicy: Always` option as the [best practice Container Images](https://kubernetes.io/docs/concepts/configuration/overview/#container-images) deployment option. With this option, the image is pulled every time the pod is started thus deploying images from a single source of truth, Amazon Elastic Container Registry (ECR) in our case. 

## Setup

•	A [game sample of multiplayer](https://docs.aws.amazon.com/lumberyard/latest/userguide/sample-project-multiplayer-enhanced.html), the sample shows you how to build and structure multiplayer games that use the various features of the [GridMate networking library](https://docs.aws.amazon.com/lumberyard/latest/userguide/network-intro.html).

•	AWS CodeCommit or GitHub repository (multiplayersample-lmbr) that includes the game engine binaries, the game assets (pak, cfg and more), AWS CodeBuild specs and EKS deployment specs.

•	AWS CodeBuild project that points the CodeCommit repo. The build image uses `aws/codebuild/docker:18.09.0`, the built-in image maintained by the CodeBuild service configured with 3 GB memory, 2 vCPUs. The compute allocated for build capacity can be modified for cost and build time tradeoff. 

•	EKS cluster designated as staging or integration environment of the game title, multiplayersample in our case. 

## The build repository
The git repository comprises of five core components ordered by its predictable size. 

•	The game engine binaries, e.g., BinLinux64.Dedicated.tar.gz (hyperlink to the GitHub). This is the compressed version of the game engine artifacts that are not updated regularly hence deployed as a sizeable compressed file. The maintenance of this file is usually done by a different team than the developers that develop the game title.

•	The game binaries, e.g., MultiplayerSample_pc_Paks_Dedicated (hyperlink to the GitHub). This directory maintained by the game development team and managed as a standard multi-branch repository. The artifacts under this directory expected to be updated on a daily or weekly basis upon the game development plan.

•	The build-related specifications, e.g., buildspec.yml, build.sh, and Dockerfile (hyperlink to the GitHub). These files specify the build process. For simplicity, we included the docker build process only to convey the speed of continuous integration. The process can be easily extended to include the game compilation and linked process as well.  

•	The docker artifacts for containerizing the game engine and the game binaries, e.g., start.sh and start.py. These scripts usually are maintained by the game DevOps teams and updated outside of the regular game development plan. More details about those scripts can be found in a sample that describes [how to deploy a game-server in EKS](https://github.com/aws-samples/spotable-game-server).

•	The deployment specifications, e.g., eks-spec specifies the Kubernetes game-server deployment specs. This is for reference only as the CD process usually runs in a separate set of resources like staging EKS clusters that own and maintained by a different team other than the game development team.

Note: if AWS CodeCommit is being used no special considerations for large file are needed so the game engine binaries file (BinLinux64.Dedicated.tar.gz) can be simply pushed to the repo. However, GitHub does not allow more than 100MB large files so the game engine binaries required `lfs` support. The following steps are required when GitHub is used.

•	Install git-lfs by executing:
``` shell
 brew install git-lfs
```

•	Install Git LFS and its hooks and start tracking large files
```
git lfs install
git lfs track "*.tar.gz.x*"
git add .gitattributes
```

## The game build process
The build process starts with any git push event on the git repository. The build process includes three core phases denoted by `pre_build,` `build,` and `post_build` in `multiplayersample-lmbr/buildspec.yml.`

•	The `pre_build` unzip the game-engine binaries and login to the container registry (ECR) as preparation.

•	The `build` phase execute the `docker build` command that includes the multi-stage build.
The `Dockerfile` spec file describes the multi-stage image build process. It starts by adding the game-engine binaries to the Linux OS, `ubuntu:18.04` in our example. 
``` yaml
FROM ubuntu:18.04
ADD BinLinux64.Dedicated.tar /
```

It continued by adding the necessary packages to the game-server, e.g., ec2-metadata, boto3, libc and python and the necessary scripts for controlling the game server runtime in EKS. These packages are only required for the CI/CD process hence added only in the CI/CD process. This enables a clean decoupling between the necessary packages for development, integration, and deployment and simplifies the process for both teams.
```
RUN apt-get install -y python python-pip 
RUN apt-get install -y net-tools vim
RUN apt-get install -y libc++-dev
RUN pip install mcstatus ec2-metadata boto3
ADD start.sh /start.sh
ADD start.py /start.py
```

The second part is to copy the game engine from the previous stage `--from=0` to the next build stage. In our case, we copy the game engine binaries with the two `COPY` docker directives.
```
COPY --from=0 /BinLinux64.Dedicated/* /BinLinux64.Dedicated/
COPY --from=0 /BinLinux64.Dedicated/qtlibs /BinLinux64.Dedicated/qtlibs/
```

Finally, the game binaries are added as a separate layer on top of the game-engine layers above to conclude the build. Note that constant daily changes are expected to this layer hence packaged separately. In case your game includes other obstructions, one can break this step to several discrete docker image layers. 
```
ADD MultiplayerSample_pc_Paks_Dedicated /BinLinux64.Dedicated/
``` 

•	The `post_build` phase pushes the game docker image to the centralized container registry for further deployment to the various regional EKS clusters. 

In this phase, we tag and push the new image to the designated container registry in ECR.
```
docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG      
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG
```

## The game deployment process
At this point, the updated image was pushed to the designated container registry in ECR (`/$IMAGE_REPO_NAME:$IMAGE_TAG`). This image is scheduled to an EKS cluster as game-server Kubernetes deployment as described in the sample (link to eks-spec). 
In the example herein we use ` imagePullPolicy: Always.`

```
containers:
…
        image: `/$IMAGE_REPO_NAME:$IMAGE_TAG/multiplayersample-build
        imagePullPolicy: Always
        name: multiplayersample
…
```

When using imagePullPolicy: Always, one can't circumvent ECR security and make ECR as the single source of truth w.r.t. to binaries to be scheduled. However, pulling a whole image from the image source (ECR) requires pulling a few giga-bytes from ECR to the worker nodes via kubelet, the node agent. [Data transfer out might be expensive](https://aws.amazon.com/ecr/pricing/) when new images are pulled continuously. However, Docker layers will update only the layers that were modified preventing a whole image update and secure image distribution. Specifically for our example, only the layer `MultiplayerSample_pc_Paks_Dedicated` will be updated.

## CI process proposed
We propose an end-to-end architecture of a full-scale game-server deployment using EKS as the orchestration system, ECR as the container registry and CodeBuild as the build engine. Game developers merge changes to the Git repository that includes both the pre-configured game-engine binaries and the game artifacts. Upon merge events, CodeBuild builds a multi-stage game-server image that is pushed to a centralized container registry hosted by ECR. At this point DevOps teams in different regions continuously scheduling the image as a game server, pulling only the updated layer in the game server image. This keeps the entire game-server fleets to run the same game binaries set allowing the game DevOps team a secure deployment. 
