#!/bin/sh

#This script enable the access of CodeBuild to perform actions on the EKS for the CD system. It modifies the `aws-auth` ConfigMap granting the CodeBuild Service Role permissions to update kubernetes resources by mapping the CodeBuild Service Role to a username and granting that username permissions using a Role/ClusterRole and RoleBinding/ClusterRoleBinding.
#https://docs.aws.amazon.com/eks/latest/userguide/add-user-role.html
#first remove existing codebuild role by executing:
#curl -o aws-auth-cm.yaml https://amazon-eks.s3-us-west-2.amazonaws.com/cloudformation/2019-09-27/aws-auth-cm.yaml
#remove the codebuild role and apply back the config to the cluster

export ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export AWS_REGION=$(curl -s 169.254.169.254/latest/dynamic/instance-identity/document | jq -r '.region')
#export AWS_REGION="eu-central-1"

ROLE_NAME="codebuild-cd-"${AWS_REGION}

TRUST="{ \"Version\": \"2012-10-17\", \"Statement\": [ { \"Effect\": \"Allow\", \"Principal\": { \"AWS\": \"arn:aws:iam::${ACCOUNT_ID}:root\" }, \"Action\": \"sts:AssumeRole\" } ] }"

echo "ACCOUNT_ID:"$ACCOUNT_ID
echo "AWS_REGION:"$AWS_REGION
echo "ROLE_NAME:"$ROLE_NAME
echo "TRUST:"$TRUST

echo "deleting old roles"
policy_list=`aws iam list-role-policies --role-name $ROLE_NAME | jq -r '.PolicyNames[]'`
for policy in $policy_list
do
  aws iam delete-role-policy --role-name $ROLE_NAME --policy-name $policy
done

aws iam delete-role --role-name $ROLE_NAME

aws iam create-role --role-name ${ROLE_NAME} --assume-role-policy-document "$TRUST" --output text --query 'Role.Arn'

echo '{ "Version": "2012-10-17", "Statement": [ { "Effect": "Allow", "Action": "eks:Describe*", "Resource": "*" } ] }' > /tmp/iam-role-policy
echo "going to put the policy:"
cat /tmp/iam-role-policy
echo "in role "${ROLE_NAME}
aws iam put-role-policy --role-name ${ROLE_NAME} --policy-name eks-describe --policy-document file:///tmp/iam-role-policy

ROLE="    - rolearn: arn:aws:iam::$ACCOUNT_ID:role/${ROLE_NAME}\n      username: build\n      groups:\n        - system:masters"

kubectl get -n kube-system configmap/aws-auth -o yaml | awk "/mapRoles: \|/{print;print \"$ROLE\";next}1" > /tmp/aws-auth-patch.yml
cat /tmp/aws-auth-patch.yml
echo "applying updated aws-auth configmap"
kubectl patch configmap/aws-auth -n kube-system --patch "$(cat /tmp/aws-auth-patch.yml)"

echo "the new aws-auth config map is"
kubectl describe configmap -n kube-system aws-auth
