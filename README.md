# Containerized game servers
 This repo provides examples for running containerized game-servers on EKS.

> [!CAUTION]
> This project is in maintenance mode due to the decomission of AWS CodeCommit. The patterns described in these examples will migrate to individual repositories that include a refactored version of the code based on GitHub. 

 #### [supertuxkart](./supertuxkart) demonstrates dedicated UDP game server that implements the agones SDK
 #### [udp-nlb-sample](./udp-nlb-sample) demonstrate k8s deployment of UDP game servers backed by NLB  
 #### [craft](./craft) demonstrate game that stores game state in Aurora PostgreSQL of game servers backed by NLB
 #### [spot-sig-handler](./spot-sig-handler) demonstrate node termination handler for spot instance using IMDSv2
 #### [mitigate-udp-flood-with-agones-iptables](./mitigate-udp-flood-with-agones-iptables) iptables-based ddos mitigation for udp game servers
 #### [lyra](./lyra) Unreal Engine 5.1 Lyra Starter Game - demonstrate NodePort per pod service with EIP
