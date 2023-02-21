#!/bin/bash -x
BUILDX_VER="${BUILDX_VER:-v0.10.3}"
arch=$(uname -i)
if [ $arch == "aarch64" ]; then
  buildx_arch="arm64"
elif [ $arch == "x86_64" ]; then
  buildx_arch="amd64"
else
  buildx_arch="not_supported"
fi
echo "buildx proc arch="$buildx_arch

wget https://github.com/docker/buildx/releases/download/${BUILDX_VER}/buildx-${BUILDX_VER}.linux-$buildx_arch
mkdir -p ~/.docker/cli-plugins
mv ./buildx-${BUILDX_VER}.linux-$buildx_arch ~/.docker/cli-plugins/docker-buildx
chmod a+x ~/.docker/cli-plugins/docker-buildx

docker buildx install
docker buildx ls
docker buildx create --name craftbuilder
