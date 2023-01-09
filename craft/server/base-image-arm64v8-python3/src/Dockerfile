FROM arm64v8/python:3
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
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/arm64/kubectl"
RUN chmod +x ./kubectl && \
    mv kubectl /usr/sbin
RUN chmod 777 -R /usr/local/

#Install psql
RUN DEBIAN_FRONTEND=noninteractive apt-get install --fix-missing -y postgresql
