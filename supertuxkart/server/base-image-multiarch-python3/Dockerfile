FROM public.ecr.aws/docker/library/python:slim
RUN apt-get update -y --fix-missing
RUN apt-get install -y vim net-tools telnet iproute2 jq unzip curl net-tools subversion sqlite3 iptables kmod ulogd2
RUN apt-get -y install gcc
RUN apt-get -y install wget
RUN /usr/local/bin/python -m pip install --upgrade pip
RUN pip install requests
RUN pip install boto3
RUN apt-get install libpq-dev -y
RUN pip install psycopg2-binary
#RUN pip install psycopg2
RUN pip install urllib3
RUN pip install wheel
RUN pip install Cmake
RUN pip install pyenet
RUN pip install ec2-metadata

#Install game build tools
RUN apt-get install build-essential cmake libbluetooth-dev libsdl2-dev \
libcurl4-openssl-dev libenet-dev libfreetype6-dev libharfbuzz-dev \
libjpeg-dev libogg-dev libopenal-dev libpng-dev \
libssl-dev libvorbis-dev libmbedtls-dev pkg-config zlib1g-dev git sqlite3 subversion -y

#Install aws cli
RUN pip install awscli
RUN mkdir /root/.aws
COPY config /root/.aws

# Install and configure psql
RUN DEBIAN_FRONTEND=noninteractive apt-get install --fix-missing -y postgresql

#Install kubectl for the simulator pod scaler
RUN apt-get install -y apt-transport-https ca-certificates
RUN curl -fsSLo /usr/share/keyrings/kubernetes-archive-keyring.gpg https://dl.k8s.io/apt/doc/apt-key.gpg
RUN echo "deb [signed-by=/usr/share/keyrings/kubernetes-archive-keyring.gpg] https://apt.kubernetes.io/ kubernetes-xenial main" | tee /etc/apt/sources.list.d/kubernetes.list
RUN apt-get update
RUN apt-get install -y kubectl
