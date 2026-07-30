FROM python:3.12
RUN apt-get update -y --fix-missing
RUN apt-get install -y sqlite3 
RUN apt-get install -y vim net-tools telnet iproute2 jq
RUN /usr/local/bin/python -m pip install --upgrade pip
RUN pip install requests boto3 psycopg2 urllib3 

#Install aws cli
RUN pip install awscli
RUN mkdir /root/.aws
COPY config /root/.aws

#Install kubectl from the community-owned pkgs.k8s.io repository.
#The legacy apt.kubernetes.io / kubernetes-xenial repo was retired in 2023.
RUN apt-get install -y apt-transport-https ca-certificates curl gnupg
RUN curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.33/deb/Release.key | gpg --dearmor -o /usr/share/keyrings/kubernetes-apt-keyring.gpg
RUN echo "deb [signed-by=/usr/share/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.33/deb/ /" | tee /etc/apt/sources.list.d/kubernetes.list
RUN apt-get update
RUN apt-get install -y kubectl
RUN kubectl version --client

#Install psql
RUN DEBIAN_FRONTEND=noninteractive apt-get install --fix-missing -y postgresql
