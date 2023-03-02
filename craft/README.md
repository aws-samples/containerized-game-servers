# A sandbox stateful multiplayer video game 

We use the [Craft](https://www.michaelfogleman.com/projects/craft/) game. A simple Minecraft clone written in C using modern OpenGL (shaders)

## Deploy steps

```bash
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export AWS_REGION=us-west-2
export BUILDX_VER=v0.10.3
export BASE_REPO=baseimage-ci
export BASE_IMAGE_TAG=multiarch-py3
export GAME_REPO=craft-ci
export GAME_ARM_CODE_TAG=craft-arm64
export GAME_AMD_CODE_TAG=craft-amd64
export GAME_CODE_TAG=craft-multiarch
export GITHUB_CRAFT="https://github.com/yahavb/Craft.git"
export GITHUB_CRAFT_BRANCH=master
export INSTANCE_FAMILY=t4g
export CLUSTER_NAME=craft-usw1
```
### Enable multi-arch builds (linux/arm64 and linux/amd64)
```bash
docker buildx create --name craftbuilder
```

### Create and deploy the ECR docker registry and images for base image and game image
* create image registry for the base image
```bash
cd ./base-image-multiarch-python3/src
./create-ecr.sh
./build.sh
```

* create the registry for game image
```bash
cd ../../craft-image/src/
./create-ecr.sh
./build.sh
```

#### automated pipeline for base image and the craft image
Create a multi-arch base image pipeline. It will create a gitcommit repo that triggers the pipeline upone code changes. 

```bash
./deploy-base-pipeline.sh
```

Create a multi-arch image.

```bash
./deploy-craft-server-pipeline.sh
```

### Create EKS cluster
```bash
cat <<-EOF > eks-cluster-spec.yml
---
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: ${CLUSTER_NAME}
  region: ${AWS_REGION}
  version: "1.23"
  tags:
    karpenter.sh/discovery: ${CLUSTER_NAME}
managedNodeGroups:
  - instanceType: ${INSTANCE_FAMILY}.large
    amiFamily: AmazonLinux2
    name: ${CLUSTER_NAME}-ng
    desiredCapacity: 2
    minSize: 1
    maxSize: 10
iam:
  withOIDC: true
addons:
- name: vpc-cni
  attachPolicyARNs:
    - arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy
EOF

eksctl create cluster -f eks-cluster-spec.yml
```

### Deploy Agones - Optional 
```bash
helm repo add agones https://agones.dev/chart/stable
helm repo update
helm upgrade agones agones/agones --namespace agones-system --install --wait --create-namespace \
    --set agones.featureGates=PlayerTracking=true
```

### Deploy Karpenter
Follow [karpenter install steps](https://karpenter.sh/v0.20.0/getting-started/getting-started-with-eksctl/)

### Deploy container insights
Follow [container insights deploy steps](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Container-Insights-setup-EKS-quickstart.html)
```bash
ClusterName=${CLUSTER_NAME}
RegionName=${AWS_REGION}
FluentBitHttpPort='2020'
FluentBitReadFromHead='Off'
[[ ${FluentBitReadFromHead} = 'On' ]] && FluentBitReadFromTail='Off'|| FluentBitReadFromTail='On'
[[ -z ${FluentBitHttpPort} ]] && FluentBitHttpServer='Off' || FluentBitHttpServer='On'
curl https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/quickstart/cwagent-fluent-bit-quickstart.yaml | sed 's/{{cluster_name}}/'${ClusterName}'/;s/{{region_name}}/'${RegionName}'/;s/{{http_server_toggle}}/"'${FluentBitHttpServer}'"/;s/{{http_server_port}}/"'${FluentBitHttpPort}'"/;s/{{read_from_head}}/"'${FluentBitReadFromHead}'"/;s/{{read_from_tail}}/"'${FluentBitReadFromTail}'"/' | kubectl apply -f -
```

### Deploy AWS LoadBalancer Controller
Follow [aws-loadbalancer-controllers](https://docs.aws.amazon.com/eks/latest/userguide/aws-load-balancer-controller.html)
```bash
eksctl create iamserviceaccount \
  --cluster=${CLUSTER_NAME} \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --role-name "AmazonEKSLoadBalancerControllerRole" \
  --attach-policy-arn=arn:aws:iam::${AWS_ACCOUNT_ID}:policy/AWSLoadBalancerControllerIAMPolicy \
  --approve

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=${CLUSTER_NAME} \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller
```

### Create Aurora Serverless PostrgeSQL 
Use https://github.com/aws-samples/amazon-aurora-call-to-amazon-sagemaker-sample/tree/master/multiplayer-matchmaker/aurora-pg-cdk
* Obtain the Aurora cluster endpoint

### Create IAM permissions for Craft

* create iam service account
```bash
aws iam create-policy \
    --policy-name craftIAMPolicy \
    --policy-document file://craft_iam_policy.json

eksctl create iamserviceaccount \
  --cluster=${CLUSTER_NAME} \
  --namespace=default \
  --name=adaptivecraft \
  --role-name "CraftRole" \
  --attach-policy-arn=arn:aws:iam::${AWS_ACCOUNT_ID}:policy/craftIAMPolicy \
  --approve
  --override-existing-serviceaccounts
```

* create k8s service accounts (k8s rbac)
```bash
kubectl apply -f craft-role-sa.yaml 
```

### Create a k8s database secret 
Deploy the databse secrets. The CDK script that deployed the db also creates secrets in AWS Secrets Manager. We will deploy these secrets from Secrets Manager into the application pods.

Install the secrets store CSI driver and AWS Secrets and Configuration Provider (ASCP):

```bash
helm repo add secrets-store-csi-driver \
  https://kubernetes-sigs.github.io/secrets-store-csi-driver/charts

helm install -n kube-system csi-secrets-store \
  --set syncSecret.enabled=true \
  --set enableSecretRotation=true \
  secrets-store-csi-driver/secrets-store-csi-driver

kubectl apply -f https://raw.githubusercontent.com/aws/secrets-store-csi-driver-provider-aws/main/deployment/aws-provider-installer.yaml
```

Create SecretProviderClass custom resource with `provider:aws`

```bash
export SECRET=`aws secretsmanager list-secrets --query SecretList[].Name --output text` 
export SECRET_FILE="/mnt/secrets/$SECRET"
cat db-secret-provider-class.yaml | envsubst | kubectl -f -
```

### Create the database schema
Deploy the k8s job [craft-initdb.yaml](https://github.com/yahavb/k8s-octo-pancake-config/blob/main/clusters/craft-usw2/default/craft-initdb.yaml)
Note - need to modify account names and secrets

### Deploy Craft 
* The service and deployment spec is [craft-deploy.yaml](https://github.com/yahavb/k8s-octo-pancake-config/blob/main/clusters/craft-usw2/default/craft-deploy-svc.yaml)
* copy and modify the account details and execute:
```bash
kubectl apply -f craft-deploy-svc.yaml
```

Wait for few minutes for the game server to start and registered as healthy in the NLB target groups. 

### Deploy Craft auth service 
Follow [auth](../auth)


### Play the game
Download the client binaries or compile it from https://github.com/yahavb/Craft

Create a player user 
```bash
curl http://craft.auth.yahav.sa.aws.dev/auth/adduser/?username=yahavb
```

Generate token for the user
```bash
curl http://craft.auth.yahav.sa.aws.dev/auth/getoken/?username=yahavb
```

Use the token in the Craft game client 

```
/identity yahavb mytoken
```

Enjoy


### Scale the game server with HPA

[Install the Kubernetes Metrics Server](https://docs.aws.amazon.com/eks/latest/userguide/metrics-server.html)

