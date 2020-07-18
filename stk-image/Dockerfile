FROM 356566070122.dkr.ecr.us-west-2.amazonaws.com/supertuxkart:0.2

RUN apt-get install -y vim sqlite3 lsof tcpdump

COPY server_config.xml /home/supertuxkart/stk-code/server_config.xml 
COPY stkservers.db /home/supertuxkart/stk-code/stkservers.db
COPY start.sh /home/supertuxkart/stk-code/start.sh
