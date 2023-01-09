

```bash
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export AWS_REGION=us-west-2
export INSTANCE_FAMILY=t4g
export INSTANCE_ARCH=arm
export CLUSTER_NAME=mycluster
```



Execute ./init.sh to build the pipeline for creating the craft server docker image.

Make sure you created the base image before executing `./init.sh`
