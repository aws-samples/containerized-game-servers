FROM public.ecr.aws/debian/debian:stable-slim 

RUN apt -y --fix-missing update
RUN apt install -y curl vim unzip jq

# Install and configure psql
RUN DEBIAN_FRONTEND=noninteractive apt-get install --fix-missing -y postgresql

#Install aws cli
#RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o "awscliv2.zip"
RUN unzip awscliv2.zip
RUN ./aws/install
RUN mkdir /root/.aws
COPY config /root/.aws

#Install kubectl for the simulator pod scaler
RUN apt-get install -y apt-transport-https ca-certificates 
RUN curl -fsSLo /usr/share/keyrings/kubernetes-archive-keyring.gpg https://packages.cloud.google.com/apt/doc/apt-key.gpg
RUN echo "deb [signed-by=/usr/share/keyrings/kubernetes-archive-keyring.gpg] https://apt.kubernetes.io/ kubernetes-xenial main" | tee /etc/apt/sources.list.d/kubernetes.list
RUN apt-get update
RUN apt-get install -y kubectl
RUN kubectl version --client

ADD appsimulator.sh /appsimulator.sh
RUN chmod +x /appsimulator.sh
