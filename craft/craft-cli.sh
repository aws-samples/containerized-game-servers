#!/bin/bash
cd ~/Downloads/Craft
rm -f cache.*
while true
do
  #ps aux | grep craft | grep -v cli | grep -v kubectl | grep -v grep| awk '{print $2}' | xargs kill -9
  ./craft craft.yahav.sa.aws.dev  
  #ps aux | grep craft | grep -v cli | grep -v kubectl | grep -v grep| awk '{print $2}' | xargs kill -9
done
