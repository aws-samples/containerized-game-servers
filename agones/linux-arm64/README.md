# Install agones on Linux arm64 instance aka AWS Graviton

Build the agones binaries using the [procedure](https://github.com/yahavb/agones/tree/main/build#linux)

Under the build directory, execute:

```bash
yum install -y docker
make test-go
make build
make build-images
```
Deploy the three images to your favorite docker registries: 
* agones-controller
* agones-ping
* agones-allocator


kubectl create namespace agones-system
kubectl apply -f https://raw.githubusercontent.com/googleforgames/agones/release-1.20.0/install/yaml/install.yaml

