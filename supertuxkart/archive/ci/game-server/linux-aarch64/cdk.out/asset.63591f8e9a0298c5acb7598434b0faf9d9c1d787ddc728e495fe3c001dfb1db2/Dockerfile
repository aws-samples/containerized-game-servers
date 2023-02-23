FROM public.ecr.aws/debian/debian:stable-slim as debian_base
RUN apt-get update -y
RUN apt-get install build-essential cmake libbluetooth-dev libsdl2-dev \
libcurl4-openssl-dev libenet-dev libfreetype6-dev libharfbuzz-dev \
libjpeg-dev libogg-dev libopenal-dev libpng-dev \
libssl-dev libvorbis-dev libmbedtls-dev pkg-config zlib1g-dev git sqlite3 subversion -y
RUN apt install -y python3-pip
RUN pip install pyenet
RUN apt install -y curl vim unzip jq

#Install aws cli
#RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o "awscliv2.zip"
RUN unzip awscliv2.zip
RUN ./aws/install
RUN mkdir /root/.aws
COPY config /root/.aws

# Install and configure psql
RUN DEBIAN_FRONTEND=noninteractive apt-get install --fix-missing -y postgresql

#Install kubectl for the simulator pod scaler
RUN apt-get install -y apt-transport-https ca-certificates
RUN curl -fsSLo /usr/share/keyrings/kubernetes-archive-keyring.gpg https://packages.cloud.google.com/apt/doc/apt-key.gpg
RUN echo "deb [signed-by=/usr/share/keyrings/kubernetes-archive-keyring.gpg] https://apt.kubernetes.io/ kubernetes-xenial main" | tee /etc/apt/sources.list.d/kubernetes.list
RUN apt-get update
RUN apt-get install -y kubectl
RUN kubectl version --client

FROM debian_base AS build_art
RUN svn co https://svn.code.sf.net/p/supertuxkart/code/stk-assets stk-assets

FROM debian_base AS build_code
COPY --from=1 /stk-assets /stk-assets
RUN apt-get install git -y
RUN git clone https://github.com/yahavb/stk-code stk-code
#RUN git clone https://github.com/supertuxkart/stk-code stk-code
RUN cd stk-code
RUN mkdir cmake_build
RUN cmake ../stk-code -B ./cmake_build -DSERVER_ONLY=ON
RUN cd cmake_build && make -j$(nproc) -f ./Makefile install
COPY server_config.xml /stk-code/server_config.xml
COPY start-server.sh /start-server.sh
COPY start-client.sh /start-client.sh
COPY udp-health-probe.py /udp-health-probe.py
COPY get-port.py /get-port.py
COPY get-track.py /get-track.py
COPY get-mode.py /get-mode.py
COPY get-location.py /get-location.py
COPY srv-sigstop.sh /srv-sigstop.sh
COPY cli-sigstop.sh /cli-sigstop.sh
COPY pub-game-actions-cw.sh /pub-game-actions-cw.sh
RUN chmod +x /start-server.sh
RUN chmod +x /start-client.sh
RUN chmod +x /udp-health-probe.py
RUN chmod +x /get-port.py
RUN chmod +x /get-track.py
RUN chmod +x /get-mode.py
RUN chmod +x /get-location.py
RUN chmod +x /srv-sigstop.sh
RUN chmod +x /cli-sigstop.sh
RUN chmod +x /pub-game-actions-cw.sh
