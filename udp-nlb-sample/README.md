#Deploy highly availible UDP containerized game servers on EKS using NLB
This project uses [supertuxkart](../supertuxkart) as a UDP game server and deploy it to EKS in highly-availible mode. It uses NLB UDP IPv4 support. NLB supports UDP but requires the [target group](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/load-balancer-target-groups.html) health check to use TCP which requires the game publisher to add TCP endpoint in the game server container and reconcile the UDP socket server health with the TCP endpoint. This example simplifies this part by:

* [udp-health-probe](https://github.com/aws-samples/containerized-game-servers/blob/master/udp-nlb-sample/stk/udp-health-probe.py) that test the UDP socket server health. 
* Deploy TCP endpoint as a sidecar prior to the game-server pod object by using [MutatingAdminssionWebhook](https://kubernetes.io/docs/admin/admission-controllers/#mutatingadmissionwebhook-beta-in-19)
  
