FROM 356566070122.dkr.ecr.us-west-2.amazonaws.com/supertuxkart:0.2

RUN apt-get install -y vim sqlite3 lsof tcpdump curl jq uuid
RUN curl -f -s -o /usr/local/bin/kubectl https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl && \
    chmod +x /usr/local/bin/kubectl && \
    kubectl version --client
RUN apt-get install -y python3 python3-pip
RUN pip3 install awscli
COPY server_config.xml /home/supertuxkart/stk-code/server_config.xml 
COPY stkservers.db /home/supertuxkart/stk-code/stkservers.db
COPY start.sh /home/supertuxkart/stk-code/start.sh
RUN mkdir /root/.aws
COPY config /root/.aws
RUN mkdir /sharedata
COPY pre-stop.sh /pre-stop.sh
