#TODO use ARG ENV to pass the public.ecr repo
FROM public.ecr.aws/b1w9c8y8/arm64v8-python-3
ARG GITHUB_CRAFT_VERSION
ENV GITHUB_CRAFT_VERSION=$GITHUB_CRAFT_VERSION
RUN apt-get update -y
RUN apt-get install -y sqlite3 
RUN apt-get install -y vim net-tools telnet jq
RUN /usr/local/bin/python -m pip install --upgrade pip
RUN git clone https://github.com/yahavb/Craft.git --branch agones_${GITHUB_CRAFT_VERSION} craft && \
    cd ./craft && \
    gcc -std=c99 -O3 -fPIC -shared -o world -I src -I deps/noise deps/noise/noise.c src/world.c
ADD start.sh /start.sh
ADD initdb.sh /initdb.sh
ADD monitor_active_game_sessions.sh /craft/monitor_active_game_sessions.sh
