# MutatingAdmissionWebhook for nginx sidecar for TCP health-check

### Deploy a MutatingAdmissionWebhook that injects a nginx sidecar container for TCP health-check into game server pod upon creation.

This sample uses https://github.com/yahavb/kube-mutating-webhook-tutorial. This fork extends it to arm64 CPU arch. 

Follow [README](https://github.com/yahavb/kube-mutating-webhook-tutorial/blob/master/README.md) for build the go binaries. 
Modify [Makefile](https://github.com/yahavb/kube-mutating-webhook-tutorial/blob/master/Makefile) with your `IMAGE_REPO`
Modify [Dockerfile](https://github.com/yahavb/kube-mutating-webhook-tutorial/blob/master/build/Dockerfile) with the base alpine image. In our case we used `arm64v8/alpine:latest`

Execute the following from the root of the [repo](https://github.com/yahavb/kube-mutating-webhook-tutorial)

```
# make build
# make build-image
```

Create ECR repo

```
#./ecr-repos.sh
```

Push the image to ECR by executing the follwing from this folder. You need to install aws CLI 

```
# ./build.sh
```

Update the ECR image URL in the injector webhook [deployment](./deployment.yaml)

```
# kubectl create -f deploy/nginxconfigmap.yaml
# kubectl create -f deploy/configmap.yaml
# kubectl create -f deploy/deployment.yaml
# kubectl create -f deploy/service.yaml
# kubectl create -f deploy/mutatingwebhook-ca-bundle.yaml
```

Deploy the [game-server with the side-car annotation](./stknlb-injected-tcphealth-sidecar.yaml)

Note the annotation in the Pod spec section

```yaml
      annotations:
        sidecar-injector-webhook.morven.me/inject: "yes"
```

