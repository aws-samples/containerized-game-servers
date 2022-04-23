FROM public.ecr.aws/debian/debian:stable-slim as debian_base
RUN apt-get update -y
RUN apt-get install build-essential cmake libbluetooth-dev libsdl2-dev \
libcurl4-openssl-dev libenet-dev libfreetype6-dev libharfbuzz-dev \
libjpeg-dev libogg-dev libopenal-dev libpng-dev \
libssl-dev libvorbis-dev libmbedtls-dev pkg-config zlib1g-dev git sqlite3 subversion -y
RUN apt install -y python3-pip
RUN pip install pyenet

FROM debian_base AS build_art
RUN svn co https://svn.code.sf.net/p/supertuxkart/code/stk-assets stk-assets

FROM debian_base AS build_code
COPY --from=1 /stk-assets /stk-assets
RUN apt-get install git -y
RUN git clone https://github.com/yahavb/stk-code stk-code
#RUN git clone https://github.com/supertuxkart/stk-code stk-code
RUN cd stk-code
RUN mkdir cmake_build
RUN cmake ../stk-code -B ./cmake_build -DSERVER_ONLY=ON
RUN cd cmake_build && make -j$(nproc) -f ./Makefile install
ADD server_config.xml /stk-code/server_config.xml
ADD start-server.sh /stk-code/start-server.sh
ADD start-client.sh /stk-code/start-client.sh
COPY udp-health-probe.py /udp-health-probe.py
RUN chmod +x /stk-code/start-server.sh
RUN chmod +x /stk-code/start-client.sh
RUN chmod +x /udp-health-probe.py
