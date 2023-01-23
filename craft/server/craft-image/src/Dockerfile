FROM 953892292675.dkr.ecr.us-west-2.amazonaws.com/baseimage:multiarch-python3

ARG GITHUB_CRAFT_BRANCH
ENV GITHUB_CRAFT_BRANCH=master

ARG GITHUB_CRAFT
ENV GITHUB_CRAFT=https://github.com/yahavb/Craft.git

RUN git clone https://github.com/yahavb/Craft.git --branch master craft && \
    cd ./craft && \
    gcc -std=c99 -O3 -fPIC -shared -o world -I src -I deps/noise deps/noise/noise.c src/world.c
ADD start.sh /start.sh
ADD initdb.sh /initdb.sh
ADD monitor_active_game_sessions.sh /craft/monitor_active_game_sessions.sh
ADD release_gs.sh /craft/release_gs.sh
