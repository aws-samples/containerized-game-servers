# A sandbox stateful multiplayer video game 

We use the [Craft](https://www.michaelfogleman.com/projects/craft/) game. It is a CPP game with python3-based game server.

## Deploy steps

```bash
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export AWS_REGION=us-west-2
export BASE_IMAGE=baseimage
export BASE_IMAGE_TAG=arm64v8-python3
export GAME_IMAGE=craft
export GAME_IMAGE_TAG=arm64py3
export GITHUB_CRAFT="https://github.com/yahavb/Craft.git"
export GITHUB_CRAFT_BRANCH=master
```

### Create and deploy the ECR docker registry and images for base image and game image
* create image registry for the base image
```bash
cd ./base-image-arm64v8-python3/src
./create-ecr.sh
./build.sh
```

* create the registry for game image
```bash
cd ../../
cd ./craft-image/src/
./create-ecr.sh
./build.sh
```

### Create EKS cluster
```bash
eksctl create cluster -f eks-cluster-spec.yml
```

### Deploy Karpenter
Follow [karpenter install steps](https://karpenter.sh/v0.20.0/getting-started/getting-started-with-eksctl/)

TODO: move from k8s-octo-pancake
### Deploy container insights
Follow [container insights deploy steps](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Container-Insights-setup-EKS-quickstart.html)
```bash
./cd/deploy-container-insights.sh
```

TODO: move from k8s-octo-pancake
### Deploy AWS LoadBalancer Controller
Follow [aws-loadbalancer-controllers](https://docs.aws.amazon.com/eks/latest/userguide/aws-load-balancer-controller.html)
```bash
./cd/create-iamsa-aws-loadbalancer.sh
./cd/helm-install-aws-loadbalancer.sh
```

### Create Aurora Serverless PostrgeSQL 
Use https://github.com/aws-samples/amazon-aurora-call-to-amazon-sagemaker-sample/tree/master/multiplayer-matchmaker/aurora-pg-cdk
* Obtain the Aurora cluster endpoint

### Create IAM permissions for Craft

* create iam service account
```bash
./craft-iamserviceaccount.sh  --override-existing-serviceaccounts
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
Deploy the k8s job [craft-initdb.yaml](./cd/craft-initdb.yaml)

### Deploy Craft 
* The service and deployment spec is [craft-deploy.yaml](https://github.com/yahavb/k8s-octo-pancake-config/blob/main/clusters/craft-usw2/default/craft-deploy-svc.yaml)
* execute:
```bash
kubectl apply -f craft/cd/craft-deploy-svc.yaml
```

Wait for few minutes for the game server to start and registered as healthy in the NLB target groups. 

### Deploy Craft auth service 
Follow https://github.com/yahavb/craft-auth-disco


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
