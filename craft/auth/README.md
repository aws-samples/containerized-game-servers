# craft-auth-disco
auth protocol of yahavb/Craft

## Deployment steps

### Database deployment
follow https://github.com/aws-samples/amazon-aurora-call-to-amazon-sagemaker-sample/tree/master/multiplayer-matchmaker/aurora-pg-cdk

### Export environment variables
```bash
export AWS_ACCOUNT_ID=`aws sts get-caller-identity --query Account --output text`
export AWS_REGION=us-west-2
export INSTANCE_ARCH=arm
export CLUSTER_NAME=craft-auth
```

### Deploy EKS cluster and Karpenter
Follow https://karpenter.sh/docs/getting-started/getting-started-with-karpenter/
Use arm instances:
add to the cluster managed group definition
```yaml
managedNodeGroups:
  - instanceType: t4g.large
    amiFamily: AmazonLinux2023
```
add to the karpenter NodePool spec
```yaml
    - key: kubernetes.io/arch
      operator: In
      values: ["arm64"]
```
### Deploy ECR
```bash
./create-ecr.sh
```

### Build the craft-auth service image
```bash
./build.sh
```
### Deploy AWS Load Balancer Controller 

```bash
eksctl create iamserviceaccount \
  --cluster=$CLUSTER_NAME \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --role-name "AmazonEKSLoadBalancerControllerRole" \
  --attach-policy-arn=arn:aws:iam::${AWS_ACCOUNT_ID}:policy/AWSLoadBalancerControllerIAMPolicy \
  --approve

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=$CLUSTER_NAME \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller
```


