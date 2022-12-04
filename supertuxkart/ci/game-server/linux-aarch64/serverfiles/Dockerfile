FROM 441218111557.dkr.ecr.us-west-2.amazonaws.com/stkbase:yahavb
RUN python3 -m pip install ec2-metadata
COPY server_config.xml /stk-code/server_config.xml
COPY start-server.sh /start-server.sh
COPY start-client.sh /start-client.sh
COPY udp-health-probe.py /udp-health-probe.py
COPY get-port.py /get-port.py
COPY get-track.py /get-track.py
COPY get-mode.py /get-mode.py
COPY get-location.py /get-location.py
COPY srv-sigstop.sh /srv-sigstop.sh
COPY cli-sigstop.sh /cli-sigstop.sh
COPY pub-game-actions-cw.sh /pub-game-actions-cw.sh
COPY get-public-ipv4.py /get-public-ipv4.py
COPY get-player-skill.py /get-player-skill.py
RUN chmod +x /start-server.sh
RUN chmod +x /start-client.sh
RUN chmod +x /udp-health-probe.py
RUN chmod +x /get-port.py
RUN chmod +x /get-track.py
RUN chmod +x /get-mode.py
RUN chmod +x /get-location.py
RUN chmod +x /srv-sigstop.sh
RUN chmod +x /cli-sigstop.sh
RUN chmod +x /pub-game-actions-cw.sh
RUN chmod +x /get-public-ipv4.py
RUN chmod +x /get-player-skill.py
