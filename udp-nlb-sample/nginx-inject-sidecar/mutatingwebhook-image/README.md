# Build and deploy a MutatingAdmissionWebhook that injects a nginx sidecar container into pod prior to persistence of the object.
### Prerequisites
* git
* go
* docker
* k8s cluster with admissionregistration.k8s.io/v1beta1 API enabled

### Build
This smaple uses Linux/arm64 platform. AKA AWS Graviton instances. To build on x86/amd64 platform rename [build/Dockerfile.linuxamd64](./build) to Dockerfile
```bash
cd  ./build
make build
make build-image
```
