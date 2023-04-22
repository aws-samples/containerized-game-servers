# A Unreal Engine 5 (UE5)-based game 

Dedicated game server deployment method for Unreal engine-based games on EKS. It demonstrates (1) Dynamic port allocation with kubernetes-native networking (v1/Service); and (2) public IPv4 IP with Elastic IP or EC2 public IPv4. Dedicated servers that run in a pod like game servers, require public IPv4 access via EIP for predictable IPv4 address allocation. This is to mask public IPv4 addresses with customer DNS rather than .compute.amazonaws.com or mitigate network volumetric attacks (layer 3) with AWS Shield. 

### How to use this sample?
* Build the game image ([manually](https://docs.unrealengine.com/5.0/en-US/setting-up-dedicated-servers-in-unreal-engine/) 
* Create an [EKS cluster with Karpenter](https://karpenter.sh/)
* Deploy [Container Insights](https://github.com/aws-samples/containerized-game-servers/tree/master/craft#deploy-container-insights)
* Download the [windows game client](https://lyra-starter-game.s3.us-west-2.amazonaws.com/WindowsClient.zip). Discover the game endpoint (`kubectl get gs`) and connect or spectate the bot playing. 

### Manual image build steps
Use https://docs.unrealengine.com/5.0/en-US/setting-up-dedicated-servers-in-unreal-engine/ to build two sets of server binaries and content. We already built the server binaries and content. Follow the following for manual steps on your local development host. 

1/ Populate the following enviroment variables. 

```bash
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export AWS_REGION=us-west-2
export BUILDX_VER=v0.10.3
export BASE_REPO=baseimage
export BASE_IMAGE_TAG=multiarch-py3
export BASE_IMAGE_ARM_TAG=arm-py3
export BASE_IMAGE_AMD_TAG=amd-py3
export GAME_REPO=lyra
export GAME_SERVER_TAG=lyra-server-multiarch
export GAME_ASSETS_TAG=lyra_starter_game
export GAME_ARM_ASSETS_TAG=lyra_starter_game_arm64
export GAME_AMD_ASSETS_TAG=lyra_starter_game_amd64
export GAME_ARM_SERVER_TAG=lyra_starter_game_arm64
export GAME_AMD_SERVER_TAG=lyra_starter_game_amd64
export GAME_ATTACKER_TAG=lyra_attacker
export GAME_ATTACKER_ARM_IMAGE=lyra_attacker_arm64
export GAME_ATTACKER_AMD_IMAGE=lyra_attacker_amd64
export S3_LYRA_ASSETS=lyra-starter-game

export CLUSTER_NAME=lyra-usw-2
```

2/ Build the base image

This is the image that includes the generic tools and libraries needed for the game. We used CPU architecture agnostic packages to allow dynamic compile and linkage to local architecture. The persona that most interested in this build is the IT/Devops that optimizes for stability and security

```bash
cd ./server/base-image-multiarch-python3
./buildx.sh
```

3/ Link the game assets 

This is the game images, video, and audio files. The persona that owns this step is the game artist. The media files (audio, images, and videos) can be stored on storage solutions such as S3. 

```bash
cd ./server/lyra-assets-image-multiarch
./buildx.sh
```

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
./deploy-lyra-pipeline.sh
```

#### Base-image Pipeline

The Source stage includes the [code and config](./server/base-image-multiarch-python3/). Note the [Dockerfile](./server/base-image-multiarch-python3/Dockerfile) includes no processor architecture specific so the libraries and packages linked dynamically via the packaged tools e.g., `apt` or `yum`

The resulted images of the base-image pipeline are two images: a 601.11 MB (AMD64) and 582.56 MB (ARM64) docker images. 

#### Game Artist Pipeline

The source stage includes the [code and config](./server/lyra-assets-image-multiarch/). 

The resulted image of the developer pipeline are two images, `lyra-assets-amd` for AMD64 and `lyra-assets-arm` for ARM64 and Image Index. 

#### Game Devops Pipeline

The source stage includes the [code and config](./server/lyra-game-server-image-multiarch/). 

Note that this step pulls only the compiled code produced by the game developer pipeline and the assets from the game artist pipeline.

```bash
FROM stk_base AS lyra_game
COPY --from=1 /lyra-assets /lyra-assets
COPY --from=2 /lyra-code /lyra-code
```
### Deploy the game as k8s deployment

```bash
cat lyra-deploy.yaml | envsubst | kubectl apply -f -
```

### Dynamic port allocation with NodePort service per game server pod

We create a service that exposes the Service on each Node's IP at a static port (the NodePort).
We use a service definition template that is mutated by a postStart pod lifecycle hook. 
```yaml
apiVersion: v1
kind: Service
metadata:
  name: $SVC_NAME
spec:
  selector:
    gamepod: $POD_NAME
  ports:
    - protocol: UDP
      port: 7777
      targetPort:  7777
  type: NodePort
```

To make the node port available, Kubernetes sets up a cluster IP address, the same as if you had requested a Service of type: ClusterIP. 

Next, we create a pod-specific label that we use for the Service selector to assure 1:1 traffic routing between the service and the pod. 

```bash
kubectl label pod $POD_NAME gamepod=$POD_NAME
```
Finally, we pull the public IPv4 IP the game is exposed by:

```bash
service_name=$POD_NAME-svc-$(kubectl get no -o wide `kubectl  get po  $POD_NAME -o wide | awk '{print $7}'|grep -v NODE`| awk '{print $7}' | grep -v EXTERNAL-IP|sed "s/\./-/g")
export SVC_NAME=$service_name
```

and create the service in the pod `lifecycle.postStart` phase.

We delete the sevrvice upon the pod termination using the pod lifecycle preStop hook. 

```yaml
lifecycle:
  postStart:
   exec:
    command: ["/usr/local/lyra_starter_game/create_node_port_svc.sh"]
  preStop:
   exec:
    command: ["/bin/sh","-c","kubectl delete svc `kubectl get svc|grep $POD_NAME | awk '{print $1}'`"]
```

### Assigning public IPv4 address to the game server endpoint

TBD
