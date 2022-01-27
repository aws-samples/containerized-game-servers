# Deploy highly availible UDP containerized game servers on EKS using NLB
This project uses [supertuxkart](../supertuxkart) as a UDP game server and deploy it to EKS in highly-availible mode. It uses NLB UDP IPv4 support. NLB supports UDP but requires the [target group](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/load-balancer-target-groups.html) health check to use TCP which requires the game publisher to add TCP endpoint in the game server container and reconcile the UDP socket server health with the TCP endpoint. This example simplifies this part by:

* Deploy EKS cluster using [eksctl](https://eksctl.io)
```bash
eksctl create cluster -f eks-arm64-cluster-spec.yaml
```

* Deploy the [aws-load-balancer-controller](https://docs.aws.amazon.com/eks/latest/userguide/aws-load-balancer-controller.html)

* Deploy the [Amazon VPC CNI](https://docs.aws.amazon.com/eks/latest/userguide/managing-vpc-cni.html)

* [udp-health-probe](https://github.com/aws-samples/containerized-game-servers/blob/master/udp-nlb-sample/stk/udp-health-probe.py) that test the UDP socket server health. 

The udp-health-probe logic, check the UDP connection
```python
addr=enet.Address(udp_socket_ip,udp_socket_port)
peer = host.connect(addr,1)
if peer:
    print("%s:" % peer)
    event = host.service(1000)
```
and if the conncetion fails (`enet.EVENT_TYPE_DISCONNECT`) then, the nginx service is stopped  

```python
if event.type == enet.EVENT_TYPE_CONNECT:
        print("%s: CONNECT" % event.peer.address)
    elif event.type == enet.EVENT_TYPE_DISCONNECT:
        print("%s: DISCONNECT" % event.peer.address)
        os.system("service nginx stop")
```
that will cause the `readinessProbe` and the target group check to failover to a healthy game-server.

* The project offers two deployment methods of the side-car TCP server. The first uses static [sidecar container](./nginx-static-sidecar), the second, [nginx-inject-sidecar](./nginx-inject-sidecar), deploys TCP endpoint as a sidecar prior to the game-server pod object by using [MutatingAdminssionWebhook](https://kubernetes.io/docs/admin/admission-controllers/#mutatingadmissionwebhook-beta-in-19)


