# Deploy highly availible UDP containerized game servers on EKS using NLB

In this project we will demonstrate how to deploy a connectionless (UDP) multiplayer online game server, leveraging Amazon Elastic Kubernetes Service (EKS) (https://docs.aws.amazon.com/eks/latest/userguide/what-is-eks.html), AWS Load Balancer Controller (https://kubernetes-sigs.github.io/aws-load-balancer-controller/v2.3/), and AWS Network Load Balancer (NLB) (https://docs.aws.amazon.com/elasticloadbalancing/latest/network/introduction.html). Additionally, you will learn how to enable and configure TCP health checks when running a connectionless UDP gaming server behind a load balancer. You can use this approach to deploy any connectionless IoT, streaming, media transfer, or native UDP applications behind a Network Load Balancer benefiting from its low latency, scale, and reliability.

The architecture used to deploy a sample connectionless UDP based game server is comprised of the following components:

* Amazon EKS cluster (https://docs.aws.amazon.com/eks/latest/userguide/create-cluster.html)and a node group (https://docs.aws.amazon.com/eks/latest/userguide/create-managed-node-group.html) of Amazon EC2 C6g instances powered by Arm-based Amazon Web services Graviton2 processors.
* AWS Load Balancer Controller (https://docs.aws.amazon.com/eks/latest/userguide/aws-load-balancer-controller.html) that manages AWS Elastic Load Balancers for a Kubernetes cluster.
* A UDP game server (https://github.com/aws-samples/containerized-game-servers/tree/master/udp-nlb-sample) deployed to EKS, a service of type LoadBalancer. The game server also includes udp-health-probe (https://github.com/aws-samples/containerized-game-servers/blob/master/udp-nlb-sample/stk/udp-health-probe.py) used as liveness probe.
* An nginx container deployed as a sidecar along side game server and exposes port 80 which is used for target health check.
* A Network Load Balancer provisioned via in cluster AWS Load Balancer Controller with a UDP listener that is associated with single target group. This target group is configured to register its targets using IP mode and perform health checks on its targets using TCP protocol.
* A udp-health-probe (https://github.com/aws-samples/containerized-game-servers/blob/master/udp-nlb-sample/stk/udp-health-probe.py) allows checking for the state of the UDP game server. When detected any issues with game server, shuts down the nginx service and hence allowing health check (port 80) on a target group to failover to a healthy UDP game server. 

![alt text](./udp-nlb-sample.jpg)

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

* The project offers two deployment methods of the side-car TCP server. The first uses [static sidecar container](./nginx-static-sidecar), the second, [nginx-inject-sidecar](./nginx-inject-sidecar), deploys TCP endpoint as a sidecar prior to the game-server pod object by using [MutatingAdminssionWebhook](https://kubernetes.io/docs/admin/admission-controllers/#mutatingadmissionwebhook-beta-in-19)

* The NLB is deployed using the aws-loadbalancer webhook mutation per the k8s game server [annotations](https://kubernetes-sigs.github.io/aws-load-balancer-controller/v2.2/guide/ingress/annotations/). 

The annotation `service.beta.kubernetes.io/aws-load-balancer-type: "external"` indicates the load-balancer is NLB, 
The annotation `service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: "ip"` indicates the nlb target type to use is the pod ip, hence the Amazon VPC CNI. 
The annotations `service.beta.kubernetes.io/aws-load-balancer-healthcheck-port` and `service.beta.kubernetes.io/aws-load-balancer-healthcheck-protocol` specifies the TCP health check, the nginx sidecar discussed below. 
The annotation `service.beta.kubernetes.io/aws-load-balancer-scheme: internet-facing` indicates the NLB endpoint to be public for players to play

```yaml
apiVersion: v1
kind: Service
metadata:
  name: stk-arm-svc1
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "external"
    service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: "ip"
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-port: "80"
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-protocol: TCP
    service.beta.kubernetes.io/aws-load-balancer-scheme: internet-facing
spec:
  selector:
    app: stkarm
  ports:
    - protocol: UDP
      port: 8081
      targetPort: 8081
  type: LoadBalancer
```
