# Containerized game servers
 This repo provides examples for running containerized game-servers on EKS.

> [!NOTE]
> These examples build their CI/CD pipelines with AWS CodeCommit and/or GitHub as the pipeline source. AWS CodeCommit was closed to new customers in July 2024 but [returned to general availability in November 2025](https://docs.aws.amazon.com/codecommit/latest/userguide/history.html) and is open to new customers again, so the CodeCommit-based examples remain usable. The samples are kept current (pinned container base images, current Kubernetes/Karpenter APIs); see each sample's README for build and deploy steps.

 #### [supertuxkart](./supertuxkart) demonstrates dedicated UDP game server that implements the agones SDK
 #### [udp-nlb-sample](./udp-nlb-sample) demonstrate k8s deployment of UDP game servers backed by NLB  
 #### [craft](./craft) demonstrate game that stores game state in Aurora PostgreSQL of game servers backed by NLB
 #### [spot-sig-handler](./spot-sig-handler) demonstrate node termination handler for spot instance using IMDSv2
 #### [mitigate-udp-flood-with-agones-iptables](./mitigate-udp-flood-with-agones-iptables) iptables-based ddos mitigation for udp game servers
 #### [lyra](./lyra) Unreal Engine 5.1 Lyra Starter Game - demonstrate NodePort per pod service with EIP
