# A sandbox UDP multiplayer video game 

We use the [Supertuxkart](https://supertuxkart.net/) game. SuperTuxKart is a free kart racing game. It focuses on fun and not on realistic kart physics. 

## Deploy steps

```bash
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
export AWS_REGION=us-west-2
export BASE_IMAGE=baseimage
export BASE_IMAGE_TAG=multiarch-py3
export GAME_IMAGE=stk
export GAME_IMAGE_TAG=multiarch-py3
export GITHUB_STK="https://github.com/yahavb/stk-code"
export GITHUB_STK_BRANCH=master
export SVN_STK="https://svn.code.sf.net/p/supertuxkart/code/stk-assets"
export INSTANCE_FAMILY=t4g
export CLUSTER_NAME=ddosudpsimu-us-west-2
```

