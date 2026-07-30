# Containerized Game Servers on Amazon EKS

![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)
![Kubernetes](https://img.shields.io/badge/Kubernetes-1.33-326CE5)
![Karpenter](https://img.shields.io/badge/Karpenter-v1-FF9900)
![AWS CDK](https://img.shields.io/badge/AWS_CDK-v2-FF9900)
![Samples](https://img.shields.io/badge/samples-6-informational)

A collection of reference examples for building, deploying, and operating
containerized, session-based game servers on Amazon EKS. Each sample is
self-contained and focuses on a specific pattern — dedicated UDP servers,
autoscaling with Karpenter, EC2 Spot handling, DDoS mitigation, public IPv4
exposure, and multi-architecture (arm64/amd64) image pipelines.

> [!NOTE]
> These examples build their CI/CD pipelines with AWS CodeCommit and/or GitHub as the pipeline source. AWS CodeCommit was closed to new customers in July 2024 but [returned to general availability in November 2025](https://docs.aws.amazon.com/codecommit/latest/userguide/history.html) and is open to new customers again, so the CodeCommit-based examples remain usable. The samples are kept current (pinned container base images, current Kubernetes/Karpenter APIs); see each sample's README for build and deploy steps.

## Architecture

Each sample follows the same two-part shape: a CI/CD pipeline that builds images
into **your own** Amazon ECR, and a runtime deployment on Amazon EKS.

**Image pipeline (per sample)**

```mermaid
flowchart LR
  src["Source<br/>(GitHub or CodeCommit)"] --> cp["AWS CodePipeline"]
  cp --> cb["AWS CodeBuild<br/>docker buildx (arm64/amd64)"]
  cb --> ecr[("Amazon ECR<br/>your account")]
```

**Runtime on Amazon EKS**

```mermaid
flowchart TB
  players(["Players"]) -->|UDP| entry["NLB / NodePort + Elastic IP"]
  subgraph eks["Amazon EKS + Karpenter"]
    entry --> gs["Game server pods<br/>(Agones-managed)"]
    gs --> db[("Aurora PostgreSQL<br/>game state / auth")]
  end
  ecr[("Amazon ECR")] -. image pull .-> gs
```

## Quick start

```bash
# 1. Clone
git clone https://github.com/aws-samples/containerized-game-servers.git
cd containerized-game-servers

# 2. Make sure the prerequisites below are in place (EKS cluster with Karpenter,
#    AWS CLI, CDK v2, Docker buildx, kubectl, envsubst).

# 3. For GitHub-sourced pipelines, create the token secret once:
aws secretsmanager create-secret --name githubtoken \
  --secret-string '{"token":"<GitHub token with repo + admin:repo_hook>"}'

# 4. Pick a sample and build its images into your ECR (example: supertuxkart).
#    Set the environment variables documented in the sample's README, then:
cd supertuxkart
./deploy-base-pipeline.sh    # builds the base image
./deploy-stk-pipeline.sh     # builds the game server image

# 5. Deploy to your cluster (manifests are rendered with envsubst):
cat <manifest>.yaml | envsubst | kubectl apply -f -
```

Exact environment variables and manifest names are documented in each sample's
own README.

## Samples

| Sample | Demonstrates | Badges |
|--------|--------------|--------|
| [supertuxkart](./supertuxkart) | Dedicated UDP game server using the Agones SDK for session lifecycle and player tracking | ![pipeline](https://img.shields.io/badge/pipeline-GitHub-black) ![arch](https://img.shields.io/badge/arch-arm64_%7C_amd64-orange) ![Agones](https://img.shields.io/badge/Agones-SDK-blue) |
| [lyra](./lyra) | Unreal Engine 5 Lyra Starter Game server with a NodePort-per-pod service and Elastic IP | ![pipeline](https://img.shields.io/badge/pipeline-GitHub-black) ![arch](https://img.shields.io/badge/arch-arm64_%7C_amd64-orange) ![UE5](https://img.shields.io/badge/Unreal-5-lightgrey) |
| [craft](./craft) | Voxel game that persists state in Aurora PostgreSQL, fronted by a Django auth service | ![pipeline](https://img.shields.io/badge/pipeline-CodeCommit-2eb67d) ![arch](https://img.shields.io/badge/arch-arm64_%7C_amd64-orange) ![Aurora](https://img.shields.io/badge/Aurora-PostgreSQL-527FFF) |
| [udp-nlb-sample](./udp-nlb-sample) | UDP game servers behind a Network Load Balancer with a TCP health-check sidecar | ![arch](https://img.shields.io/badge/arch-arm64-orange) ![NLB](https://img.shields.io/badge/AWS-NLB-FF9900) |
| [mitigate-udp-flood-with-agones-iptables](./mitigate-udp-flood-with-agones-iptables) | Rate-limiting UDP ingress to mitigate flood attacks against game servers | ![arch](https://img.shields.io/badge/arch-arm64-orange) ![iptables](https://img.shields.io/badge/iptables-hashlimit-red) |
| [spot-sig-handler](./spot-sig-handler) | Graceful node draining on EC2 Spot interruption and rebalance notices | ![pipeline](https://img.shields.io/badge/pipeline-GitHub-black) ![arch](https://img.shields.io/badge/arch-arm64-orange) ![Spot](https://img.shields.io/badge/EC2-Spot-FF9900) |

## Common prerequisites

Most samples assume:

- An AWS account and the AWS CLI configured for it.
- An Amazon EKS cluster with [Karpenter](https://karpenter.sh/) for node
  provisioning. The provided cluster spec targets Kubernetes 1.33 on AL2023.
- [AWS CDK v2](https://docs.aws.amazon.com/cdk/v2/guide/home.html) for the image
  build pipelines (each sample's `deploy-*.sh` script runs `cdk deploy`).
- Docker with `buildx` for multi-architecture (arm64/amd64) image builds.
- `kubectl` and `envsubst` to render and apply the Kubernetes manifests.
- For GitHub-sourced pipelines, a Secrets Manager secret named `githubtoken`
  (JSON field `token`, using a token with `repo` and `admin:repo_hook` scopes).

Each sample's own README covers its specific build and deploy steps.

## How the samples are structured

- **Image pipelines** — CDK stacks (`*-pipeline-stack.ts`) define CodePipeline +
  CodeBuild jobs that build container images and push them to Amazon ECR in your
  own account. Repositories, tags, and base images are parameterized, so nothing
  depends on a sample-owner registry.
- **Kubernetes manifests** — applied with `envsubst | kubectl apply -f -`, so
  image URIs and cluster-specific values resolve from your environment.
- **Autoscaling** — Karpenter `NodePool` / `EC2NodeClass` (v1 APIs) provision
  right-sized nodes, including EC2 Spot capacity.

## Contributing and license

See [CONTRIBUTING.md](./CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).
This project is licensed under the terms in [LICENSE](./LICENSE) (Apache 2.0);
attributions are listed in [NOTICE](./NOTICE).
