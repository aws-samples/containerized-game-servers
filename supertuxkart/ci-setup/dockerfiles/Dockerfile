FROM public.ecr.aws/debian/debian:stable-slim as debian_base
RUN apt-get install -y
RUN apt-get update -y
RUN apt-get install build-essential cmake libbluetooth-dev libsdl2-dev \
libcurl4-openssl-dev libenet-dev libfreetype6-dev libharfbuzz-dev \
libjpeg-dev libogg-dev libopenal-dev libpng-dev \
libssl-dev libvorbis-dev libmbedtls-dev pkg-config zlib1g-dev git sqlite3 subversion -y

FROM debian_base
RUN apt-get install git -y
RUN git clone https://github.com/supertuxkart/stk-code stk-code
RUN svn co https://svn.code.sf.net/p/supertuxkart/code/stk-assets stk-assets
RUN cd stk-code
RUN mkdir cmake_build
RUN cmake ../stk-code -B ./cmake_build -DSERVER_ONLY=ON
RUN cd cmake_build && make -j$(nproc) -f ./Makefile install
