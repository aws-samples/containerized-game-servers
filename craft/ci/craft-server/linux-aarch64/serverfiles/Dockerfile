FROM public.ecr.aws/m2l1d0b2/arm64v8-python-3
RUN apt-get update -y
RUN apt-get install -y sqlite3 
RUN apt-get install -y vim net-tools telnet
RUN /usr/local/bin/python -m pip install --upgrade pip
RUN git clone https://github.com/yahavb/Craft.git craft
RUN cd ./craft && gcc -std=c99 -O3 -fPIC -shared -o world -I src -I deps/noise deps/noise/noise.c src/world.c
ADD builder.py /craft/builder.py
ADD start.sh /start.sh
ADD monitor_active_game_sessions.sh /craft/monitor_active_game_sessions.sh
