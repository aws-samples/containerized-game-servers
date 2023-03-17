# Mitigating UDP flood attacks with Agones and iptables

We show how to minimize UDP flood attacks on dedicated game servers by limiting the game server lifespan and rate-limit players network ingress to the game server.

### How to use this sample?
* Build the game server image from source, create a k8s cluster on EKS, deploy Karpenter for hosting game-servers, legitimate and attacker bots application. [supettuxkart build and deploy](../supertuxkart#mitigate-udp-flood-with-agones-iptables)
