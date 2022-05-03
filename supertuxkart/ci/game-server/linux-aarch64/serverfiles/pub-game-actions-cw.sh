#!/bin/bash -x
#based src/input/input.hpp - enum PlayerAction
#/root/.config/supertuxkart/config-0.10/stdout.log
game_stdout=$CLIENT_STDOUT
TEMPOUT_1=$(mktemp)
TEMPOUT_2=$(mktemp)

while true
do
  cat $game_stdout| grep "GameProtocol: Controller action"| awk -F\: '{print $3}' > $TEMPOUT_1
  if [ -s $TEMPOUT_1 ]; then
    cat $TEMPOUT_1 | awk '{print $3}'| sort | uniq -c > $TEMPOUT_2

    pa_steer_left=`cat $TEMPOUT_2 | awk '{if ($2==0) print $1}'`
    aws cloudwatch put-metric-data --metric-name PA_STEER_LEFT --namespace ${CW_NS} --value $pa_steer_left

    pa_steer_right=`cat $TEMPOUT_2 | awk '{if ($2==1) print $1}'`
    aws cloudwatch put-metric-data --metric-name PA_STEER_RIGHT --namespace ${CW_NS} --value $pa_steer_right

    pa_accel=`cat $TEMPOUT_2 | awk '{if ($2==2) print $1}'`
    aws cloudwatch put-metric-data --metric-name PA_ACCEL --namespace ${CW_NS} --value $pa_accel

    pa_brake=`cat $TEMPOUT_2 | awk '{if ($2==3) print $1}'`
    aws cloudwatch put-metric-data --metric-name PA_BRAKE --namespace ${CW_NS} --value $pa_brake

    pa_fire=`cat $TEMPOUT_2 | awk '{if ($2==6) print $1}'`
    aws cloudwatch put-metric-data --metric-name PA_FIRE --namespace ${CW_NS} --value $pa_fire

    pa_look_back=`cat $TEMPOUT_2 | awk '{if ($2==7) print $1}'`
    aws cloudwatch put-metric-data --metric-name PA_LOOK_BACK --namespace ${CW_NS} --value $pa_look_back
  else
    echo "no game actions yet"
  fi
  sleep $SLEEP_B4_PUT_CW
done
