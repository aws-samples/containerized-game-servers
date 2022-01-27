# Deploy nginx-static-sidecar

Create ECR registry for the sidecar container

```bash
./ecr-repos.sh
```

Build and push the sidecar nginx image

```bash
./build
```

Deploy the game server with the static side-car

```bash
kubectl apply -f stknlb-static-tcphealth-sidecar.yaml
```
