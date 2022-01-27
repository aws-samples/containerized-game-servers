# Build and deploy the supertuxkart game

Create ECR registry for the gameserver container

```bash
./ecr-repos.sh
```

Build and push the gameserver image

```bash
./build
```

Choose which sidecar image you wish to use:

* [nginx-inject-sidecar](../nginx-inject-sidecar)
* [nginx-static-sidecar](../nginx-static-sidecar)
