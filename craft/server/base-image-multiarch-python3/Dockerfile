FROM python:3.9
RUN apt-get update -y --fix-missing
RUN apt-get install -y sqlite3 
RUN apt-get install -y vim net-tools telnet iproute2 jq
RUN /usr/local/bin/python -m pip install --upgrade pip
RUN pip install requests boto3 psycopg2 urllib3 

#Install aws cli
RUN pip install awscli
RUN mkdir /root/.aws
COPY config /root/.aws

#Install kubectl
RUN apt-get install -y apt-transport-https ca-certificates
RUN curl -fsSLo /usr/share/keyrings/kubernetes-archive-keyring.gpg https://packages.cloud.google.com/apt/doc/apt-key.gpg
RUN echo "deb [signed-by=/usr/share/keyrings/kubernetes-archive-keyring.gpg] https://apt.kubernetes.io/ kubernetes-xenial main" | tee /etc/apt/sources.list.d/kubernetes.list
RUN apt-get update
RUN apt-get install -y kubectl
RUN kubectl version --client

#Install psql
RUN DEBIAN_FRONTEND=noninteractive apt-get install --fix-missing -y postgresql
