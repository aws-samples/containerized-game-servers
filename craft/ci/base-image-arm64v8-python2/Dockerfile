FROM 095974399802.dkr.ecr.us-west-2.amazonaws.com/craft-base-image:latest
RUN apt-get update -y
RUN apt-get install -y sqlite3 
RUN apt-get install -y vim net-tools telnet
RUN /usr/local/bin/python -m pip install --upgrade pip
RUN pip install requests boto3 psycopg2
RUN pip install awscli
