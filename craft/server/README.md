# Craft game server

Build and deployment assets for the Craft dedicated game server. The server
stores world state in Aurora PostgreSQL and runs behind a Network Load Balancer.

## Layout

| Path | Purpose |
|------|---------|
| `base-image-multiarch-python3/` | Multi-arch (arm64 + amd64) Python base image used by the game image. |
| `craft-image-multiarch/` | Game-server image: build scripts, `Dockerfile.template`, world/db helpers (`world.py`, `writer.py`, `initdb.sh`), and session helpers (`monitor_active_game_sessions.sh`, `release_gs.sh`). |
| `craft_iam_policy.json` | IAM policy for the game server's IRSA role (CloudWatch, SQS, Secrets Manager). |
| `craft-role-sa.yaml` | Kubernetes RBAC service account for the game server. |
| `db-secret-provider-class.yaml` | `SecretProviderClass` mapping the Aurora secret from Secrets Manager into pods via the Secrets Store CSI driver. |
| `enable-buildx.sh` | Sets up a Docker Buildx builder for multi-arch builds. |

## Build

Set the environment variables from the [craft README](../README.md) first
(`AWS_ACCOUNT_ID`, `AWS_REGION`, `BASE_REPO`, `BASE_IMAGE_TAG`, `GAME_REPO`,
`GAME_CODE_TAG`, etc.), then enable multi-arch builds:

```bash
./enable-buildx.sh

# Base image (ensure the $BASE_REPO ECR repository exists first)
cd base-image-multiarch-python3
./build.sh

# Game image
cd ../craft-image-multiarch
./create-ecr.sh
./build.sh
```

## Deploy

```bash
# IAM policy + IRSA role (see craft README for the eksctl iamserviceaccount step)
aws iam create-policy --policy-name craftIAMPolicy \
  --policy-document file://craft_iam_policy.json

# Kubernetes RBAC and secret provider
kubectl apply -f craft-role-sa.yaml
cat db-secret-provider-class.yaml | envsubst | kubectl apply -f -
```

## Notes / hardening

- `craft_iam_policy.json` uses `"Resource": "*"` for the CloudWatch, SQS, and
  Secrets Manager statements. Scope these to the specific queue and secret ARNs
  the server actually uses before deploying beyond a demo.
