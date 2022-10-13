FROM public.ecr.aws/y4b6s6y1/arm64v8-python-2
RUN apt-get update -y
RUN apt-get install -y sqlite3 
RUN apt-get install -y vim net-tools telnet
RUN /usr/local/bin/python -m pip install --upgrade pip
ADD deps /deps
ADD src /src
ADD server.py /server.py
ADD world.py /world.py
ADD builder.py /builder.py
RUN gcc -std=c99 -O3 -fPIC -shared -o world -I src -I deps/noise deps/noise/noise.c src/world.c
RUN pip install requests boto3 psycopg2

#Install aws cli
RUN pip install awscli
RUN mkdir /root/.aws
COPY config /root/.aws

#Install kubectl
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/arm64/kubectl"
RUN chmod +x ./kubectl && \
    mv kubectl /usr/sbin
RUN chmod 777 -R /usr/local/

ADD start.sh /start.sh
ADD monitor_active_game_sessions.sh /monitor_active_game_sessions.sh
