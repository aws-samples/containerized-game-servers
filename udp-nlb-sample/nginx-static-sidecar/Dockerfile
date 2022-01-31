FROM arm64v8/nginx

RUN apt-get update -y
RUN apt install -y telnet

CMD [nginx, '-g', 'daemon off;']
