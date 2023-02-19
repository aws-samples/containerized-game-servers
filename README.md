# Containerized game servers
 This repo provides examples for running containerized game-servers on EKS.

 #### [supertuxkart](./supertuxkart) demonstrates dedicated UDP game server that implements the agones SDK
 #### [udp-nlb-sample](./udp-nlb-sample) demonstrate k8s deployment of UDP game servers backed by NLB  
 #### [craft](./craft) demonstrate game that stores game state in Aurora PostgreSQL of game servers backed by NLB
 #### [spot-sig-handler](./spot-sig-handler) demonstrate node termination handler for spot instance using IMDSv2
