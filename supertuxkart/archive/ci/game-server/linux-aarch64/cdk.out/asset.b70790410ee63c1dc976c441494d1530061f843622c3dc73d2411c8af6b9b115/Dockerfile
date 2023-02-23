#we use the debian stable slim base image
FROM public.ecr.aws/debian/debian:stable-slim as debian_base
#we update the packages list in preparation for upgrades
RUN apt-get update -y
#we install dependencies
RUN apt-get install build-essential cmake libbluetooth-dev libsdl2-dev \
libcurl4-openssl-dev libenet-dev libfreetype6-dev libharfbuzz-dev \
libjpeg-dev libogg-dev libopenal-dev libpng-dev \
libssl-dev libvorbis-dev libmbedtls-dev pkg-config zlib1g-dev git sqlite3 subversion -y
RUN apt install -y python3-pip
RUN pip install pyenet
RUN apt install -y curl vim unzip jq

#we install the aws cli
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o "awscliv2.zip"
RUN unzip awscliv2.zip
RUN ./aws/install
RUN mkdir /root/.aws
COPY config /root/.aws

# we install and configure postgresql
RUN DEBIAN_FRONTEND=noninteractive apt-get install --fix-missing -y postgresql

#we install kubectl to run commands against EKS
RUN apt-get install -y apt-transport-https ca-certificates
RUN curl -fsSLo /usr/share/keyrings/kubernetes-archive-keyring.gpg https://packages.cloud.google.com/apt/doc/apt-key.gpg
RUN echo "deb [signed-by=/usr/share/keyrings/kubernetes-archive-keyring.gpg] https://apt.kubernetes.io/ kubernetes-xenial main" | tee /etc/apt/sources.list.d/kubernetes.list
RUN apt-get update
RUN apt-get install -y kubectl
RUN kubectl version --client

#we use the debian base image to create a build_art stage where game assets are retrieved from svn
FROM debian_base AS build_art
RUN svn co https://svn.code.sf.net/p/supertuxkart/code/stk-assets stk-assets

#we reuse the debian base to create a build_code stage where custom game engine code is compiled
FROM debian_base AS build_code
COPY --from=1 /stk-assets /stk-assets
RUN apt-get install git -y
# This is where you can modify the game to clone a different version of the code
# You can fork the code in github and make changes to stk-code to build different flavours of supertuxkart
RUN git clone https://github.com/supertuxkart/stk-code stk-code
RUN cd stk-code
RUN mkdir cmake_build
RUN cmake ../stk-code -B ./cmake_build -DSERVER_ONLY=ON
RUN cd cmake_build && make -j$(nproc) -f ./Makefile install
COPY . /stk-code/
COPY udp-health-probe.py /udp-health-probe.py
COPY get-mode.py /get-mode.py
COPY get-track.py /get-track.py
COPY get-location.py /get-location.py
RUN chmod +x /stk-code/start-server.sh
RUN chmod +x /get-mode.py
RUN chmod +x /get-track.py
RUN chmod +x /get-location.py
RUN chmod +x /udp-health-probe.py
RUN chmod +x /get-mode.py
RUN chmod +x /get-track.py
RUN chmod +x /get-location.py
