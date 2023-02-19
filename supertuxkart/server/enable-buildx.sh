#!/bin/bash -x
wget https://github.com/docker/buildx/releases/download/v0.10.3/buildx-v0.10.3.linux-arm64
mkdir -p ~/.docker/cli-plugins
mv ./buildx-v0.10.3.linux-arm64 ~/.docker/cli-plugins/docker-buildx
chmod a+x ~/.docker/cli-plugins/docker-buildx
docker buildx install
docker buildx ls
docker buildx create --name craftbuilder
