#!/bin/bash
touch /tmp/healthy
max_sessions_per_game_server=$MAX_SESSIONS_IN_GS
cooldown_after_scale_up=$SCALE_UP_COOLDOWN
is_cooled_down=0
while true
do
  current_num_of_game_servers=$(kubectl get deploy $DEPLOY_NAME | grep -v NAME| awk '{print $3}')
  num_of_active_sessions=$(netstat -anp | grep $(/sbin/ip addr| grep inet | grep -v inet6| grep -v 127.0.0.1| awk '{print $2}'| awk -F\/ '{print $1}') | grep 4080 | grep ESTABLISHED| wc -l)
  echo num_of_active_sessions=$num_of_active_sessions
  echo current_num_of_game_servers=$current_num_of_game_servers
  if (( $num_of_active_sessions >= $max_sessions_per_game_server ))
  then
    if (( $is_cooled_down == 0 ))
    then
      echo "game server is at capacity; max_sessions_per_game_server=$max_sessions_per_game_server going to add more servers"
      new_num_of_game_servers=$(echo $(( $current_num_of_game_servers + 1 )))
      kubectl scale deploy $DEPLOY_NAME --replicas=$new_num_of_game_servers
      echo cooling down for $cooldown_after_scale_up sec
      sleep $cooldown_after_scale_up
      is_cooled_down=1
    else
      echo "game server already scaled so removing it from the loadbalancer target group"
      rm -f /tmp/healthy
    fi
    echo aws cloudwatch put-metric-data --metric-name num_of_game_servers --namespace craft --value $new_num_of_game_servers
    aws cloudwatch put-metric-data --metric-name num_of_game_servers --namespace craft --value $new_num_of_game_servers
  else
    echo "game server has more free session slots, max_sessions_per_game_server=$max_sessions_per_game_server, num_of_active_sessions=$num_of_active_sessions"
    echo aws cloudwatch put-metric-data --metric-name num_of_game_servers --namespace craft --value $current_num_of_game_servers
    aws cloudwatch put-metric-data --metric-name num_of_game_servers --namespace craft --value $current_num_of_game_servers
    is_cooled_down=0
  fi
  
  sleep 5
done
