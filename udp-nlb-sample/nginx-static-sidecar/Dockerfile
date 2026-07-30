#FROM arm64v8/nginx:1.27
FROM nginx:1.27

RUN apt-get update -y
RUN apt install -y telnet

CMD ["nginx", "-g", "daemon off;"]
