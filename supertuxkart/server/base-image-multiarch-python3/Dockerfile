FROM python:3.9
RUN apt-get update -y --fix-missing
RUN apt-get install -y vim net-tools telnet iproute2 jq unzip curl net-tools subversion sqlite3 iptables
RUN /usr/local/bin/python -m pip install --upgrade pip
RUN pip install requests boto3 psycopg2 urllib3 psycopg2-binary pyenet ec2-metadata

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
RUN curl -fsSLo /usr/share/keyrings/kubernetes-archive-keyring.gpg https://packages.cloud.google.com/apt/doc/apt-key.gpg
RUN echo "deb [signed-by=/usr/share/keyrings/kubernetes-archive-keyring.gpg] https://apt.kubernetes.io/ kubernetes-xenial main" | tee /etc/apt/sources.list.d/kubernetes.list
RUN apt-get update
RUN apt-get install -y kubectl
