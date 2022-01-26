# Containerized game servers
This repo provides examples for running containerized game-servers on EKS.

[lumberyard-sample](./lumberyard-sample) demonstrates multi-layered docker image 
[NodePortController](./NodePortController) demonstrates a controler that dynamically allocates ports for stateful game servers
[supertuxkart](./supertuxkart) demonstrates dedicated UDP game server that implements the agones SDK
[udp-nlb-sample](./udp-nlb-sample) demonstrate k8s deployment of UDP game servers backed by NLB  
