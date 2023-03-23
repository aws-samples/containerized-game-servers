#!/bin/bash

iptables -N limit-by-ip-chain && iptables -A limit-by-ip-chain -m hashlimit --hashlimit-upto $HASHLIMIT_UPTO/sec --hashlimit-burst $HASHLIMIT_BURST --hashlimit-mode srcip --hashlimit-name per_ip_conn_rate_limit -j ACCEPT
iptables -A limit-by-ip-chain --match limit --limit $LOG_LIMIT/sec -j NFLOG --nflog-prefix "SuperTuxKart-Protection-Rejected: " 
iptables -A limit-by-ip-chain -j DROP && iptables -I INPUT -p udp  -m conntrack --ctstate ESTABLISHED -j limit-by-ip-chain
