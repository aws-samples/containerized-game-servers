FROM 907513986313.dkr.ecr.us-west-2.amazonaws.com/baseimage:multiarch-py3
ARG S3_LYRA_ASSETS
ARG GAME_SERVER_TAG
ENV S3_LYRA_ASSETS=lyra-starter-game
ENV GAME_SERVER_TAG=lyra-server-multiarch
RUN wget "https://"lyra-starter-game".s3.us-west-2.amazonaws.com/cli_udp_game_session_cap.txt" -O /cli_udp_game_session_cap.txt
COPY . .
#RUN tar -xvf enet-1.3.17.tar
#RUN /enet-1.3.17/configure && make && make install
RUN pip install pyenet
