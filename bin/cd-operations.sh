#!/bin/sh

path=`pwd` 

configmaplist=`find $path/workshop/eks/specs/ -name "*-config.yaml"`
for configmap in $configmaplist
do
  kubectl apply -f $configmap
done

speclist=`find $path/workshop/eks/specs/ -name "*-deploy.yaml"`
for spec in $speclist
do 
  kubectl apply -f $spec
done
