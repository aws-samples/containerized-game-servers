# Spot signal handler

A lightweight node-termination handler for EC2 Spot capacity on EKS. It runs as
a DaemonSet on Spot nodes, uses IMDSv2 to watch for EC2 rebalance
recommendations / Spot interruption notices, and gracefully drains the node so
game-server pods can be rescheduled before the instance is reclaimed.

## How it works

`start.sh` (the container entrypoint):

1. Fetches an IMDSv2 token and reads the node hostname from instance metadata.
2. Publishes the node instance type as a CloudWatch metric (namespace `spot-sig`).
3. Polls the metadata notice endpoint (`NOTICE_URL`, default is the rebalance
   recommendation endpoint) every `POLL_INTERVAL` seconds.
4. When a notice is received, publishes a `rebalance` CloudWatch metric and runs
   `kubectl drain <node> --force --ignore-daemonsets --delete-emptydir-data`.

## Components

| File | Purpose |
|------|---------|
| `Dockerfile` | Builds the arm64 image (Alpine + `kubectl` + AWS CLI). |
| `start.sh` | Entrypoint: metadata polling, metrics, and node drain. |
| `build.sh` | Builds and pushes the image to ECR (repo `spotsig`, tag `aarch64`). |
| `ecr-repos.sh` / `ecr-repos.json` | Creates the ECR repository via CloudFormation. |
| `spot-sig-handler-ds.yaml` | ServiceAccount, ClusterRole/Binding, and DaemonSet. |

## Deploy

```bash
export AWS_REGION=us-west-2
# 1. Create the ECR repository
./ecr-repos.sh
# 2. Build and push the image
./build.sh
# 3. Update the image reference in spot-sig-handler-ds.yaml to your ECR repo, then:
kubectl apply -f spot-sig-handler-ds.yaml
```

## Configuration

Set via the DaemonSet container env:

| Variable | Default | Description |
|----------|---------|-------------|
| `AWS_DEFAULT_REGION` | `us-west-2` | Region for CloudWatch metrics. |
| `NOTICE_URL` | rebalance recommendation endpoint | Metadata endpoint to poll. Use `.../spot/termination-time` to react only to interruption notices. |
| `POLL_INTERVAL` | `5` | Seconds between metadata polls. |

The DaemonSet targets Spot nodes with `nodeSelector: karpenter.sh/capacity-type: spot`.

## Notes / hardening

- The bundled `ClusterRole` grants `"*"` on core and RBAC resources. Scope this
  down to the minimum needed (`nodes`, `pods`, `pods/eviction`, and the ability
  to cordon/drain) before using outside of a demo.
- For production, consider the maintained
  [AWS Node Termination Handler](https://github.com/aws/aws-node-termination-handler)
  or [Karpenter's native interruption handling](https://karpenter.sh/docs/concepts/disruption/#interruption),
  which cover Spot interruptions, rebalance recommendations, and scheduled events.
