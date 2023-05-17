#!/bin/bash -x
kubectl label pod $POD_NAME gamepod=$POD_NAME
service_name=$POD_NAME-svc-$(echo $UDP_SOCKET_IP|sed "s/\./-/g")
export SVC_NAME=$service_name
cat /stk_node_port_svc_template.yaml | envsubst | kubectl apply -f - 
