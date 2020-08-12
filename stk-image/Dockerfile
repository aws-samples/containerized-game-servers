FROM 356566070122.dkr.ecr.us-west-2.amazonaws.com/supertuxkart:0.2

RUN apt-get install -y vim sqlite3 lsof tcpdump curl jq uuid
RUN curl -f -s -o /usr/local/bin/kubectl https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl && \
    chmod +x /usr/local/bin/kubectl && \
    kubectl version --client
RUN apt-get install -y python3 python3-pip
RUN pip3 install awscli
COPY server_config.xml /home/supertuxkart/stk-code/server_config.xml 
COPY stkservers.db /home/supertuxkart/stk-code/stkservers.db
COPY start.sh /start.sh
COPY monitor_session.sh  /monitor_session.sh
COPY populate_game_server_attr.sh /populate_game_server_attr.sh
RUN chmod +x /populate_game_server_attr.sh
RUN chmod +x /start.sh
RUN chmod +x /monitor_session.sh
COPY start-server.sh /home/supertuxkart/stk-code/start-server.sh
RUN mkdir /root/.aws
COPY config /root/.aws
RUN mkdir /sharedata
COPY pre-stop.sh /pre-stop.sh
RUN touch /capture_file
