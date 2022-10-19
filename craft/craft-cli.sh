#!/bin/bash
cd ~/Downloads/Craft
rm -f cache.*
while true
do
  #ps aux | grep craft | grep -v cli | grep -v kubectl | grep -v grep| awk '{print $2}' | xargs kill -9
  #./craft craft.yahav.sa.aws.dev  
  ./craft craft-df1e1ee43d8a8226.elb.us-west-2.amazonaws.com
  sleep 1 
  #ps aux | grep craft | grep -v cli | grep -v kubectl | grep -v grep| awk '{print $2}' | xargs kill -9
done
