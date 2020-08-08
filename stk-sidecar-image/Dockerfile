FROM alpine:3.6
RUN apk add --no-cache curl ca-certificates
RUN curl -f -s -o /usr/local/bin/kubectl https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl && \
    chmod +x /usr/local/bin/kubectl && \
    kubectl version --client
RUN apk -Uuv add groff less python py-pip
RUN apk add jq tcpdump vim bash
RUN pip install awscli
COPY start.sh /
COPY monitor_session.sh  /
RUN chmod +x /start.sh
RUN chmod +x /monitor_session.sh 
RUN mkdir /root/.aws
COPY config /root/.aws
RUN mkdir /sharedata
