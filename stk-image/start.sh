#!/bin/bash 


if [ "${FREQ_CHECK_SESSION}" == "" ]; then
  echo '[ERROR] Env variable FREQ_CHECK_SESSION has no value set' 1>&2
  exit 1
fi
if [ "${NUM_IDLE_SESSION}" == "" ]; then
  echo '[ERROR] Env variable NUM_IDLE_SESSION has no value set' 1>&2
  exit 1
fi
<<<<<<< HEAD
/populate_game_server_attr.sh > /populate_game_server_attr.log &
tcpdump -l -n udp port 8080 > /capture_file &
/monitor_session.sh > /monitor_session.log &
=======

/populate_game_server_attr.sh 1>&2 
tcpdump -l -n udp port 8080 > /capture_file &
tail -F ~/.config/supertuxkart/config-0.10/server_config.log | egrep 'GameProtocol.*Controller action|STKHost.*has just connected. There are now' > /var/log/stk.log &
/monitor_session.sh 1>&2 &
>>>>>>> c208024f0a27ddd544e859a268de9283a02fb55d
/home/supertuxkart/stk-code/start-server.sh 1>&2
