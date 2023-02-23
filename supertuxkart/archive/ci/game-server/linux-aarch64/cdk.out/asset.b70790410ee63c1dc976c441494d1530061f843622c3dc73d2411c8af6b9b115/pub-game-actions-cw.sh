#!/bin/bash -x

#based src/input/input.hpp - enum PlayerAction
#/root/.config/supertuxkart/config-0.10/stdout.log
game_stdout=$CLIENT_STDOUT
TEMPOUT_1=$(mktemp)
TEMPOUT_2=$(mktemp)

while true
do
  tail -$SIZE_OF_GAME_SAMPLE $game_stdout| grep "GameProtocol: Controller action"| awk -F\: '{print $3}' > $TEMPOUT_1
  if [ -s $TEMPOUT_1 ]; then
    #getting the playeractions, the third field in GameProtocol: Controller action.
    #cat $TEMPOUT_1 | awk -v pod=$POD_NAME '{print pod$2,$3}' | sort | uniq -c > $TEMPOUT_2
    cat $TEMPOUT_1 | awk -v pod=$POD_NAME '{print pod,$3}' | sort | uniq -c > $TEMPOUT_2
    TEMPOUT_3=$(mktemp)
    cat $TEMPOUT_2 | awk '{if ($NF==0) print $2,$1}' > $TEMPOUT_3
    while read -r i; 
    do 
      pa_steer_left=`echo $i| awk '{print $2}'`
      client_id=`echo $i| awk '{print $1}'`
      aws cloudwatch put-metric-data --metric-name PA_STEER_LEFT --namespace ${CW_NS} --value $pa_steer_left --dimensions client_id=$client_id,game_ver=$GAME_VERSION
      aws cloudwatch put-metric-data --metric-name PA_STEER_LEFT --namespace ${CW_NS} --value $pa_steer_left --dimensions PLAYER_ACTIONS="PA_STEER_LEFT"
    done < $TEMPOUT_3

    TEMPOUT_4=$(mktemp)
    cat $TEMPOUT_2 | awk '{if ($NF==1) print $2,$1}' > $TEMPOUT_4
    while read -r i; 
    do 
      pa_steer_right=`echo $i| awk '{print $2}'`
      client_id=`echo $i| awk '{print $1}'`
      aws cloudwatch put-metric-data --metric-name PA_STEER_RIGHT --namespace ${CW_NS} --value $pa_steer_right --dimensions client_id=$client_id,game_ver=$GAME_VERSION
      aws cloudwatch put-metric-data --metric-name PA_STEER_RIGHT --namespace ${CW_NS} --value $pa_steer_right --dimensions PLAYER_ACTIONS="PA_STEER_RIGHT"
    done < $TEMPOUT_4

    TEMPOUT_5=$(mktemp)
    cat $TEMPOUT_2 | awk '{if ($NF==2) print $2,$1}' > $TEMPOUT_5
    while read -r i; 
    do 
      pa_accel=`echo $i| awk '{print $2}'`
      client_id=`echo $i| awk '{print $1}'`
      aws cloudwatch put-metric-data --metric-name PA_ACCEL --namespace ${CW_NS} --value $pa_accel --dimensions client_id=$client_id,game_ver=$GAME_VERSION
      aws cloudwatch put-metric-data --metric-name PA_ACCEL --namespace ${CW_NS} --value $pa_accel --dimensions PLAYER_ACTIONS="PA_ACCEL"
    done < $TEMPOUT_5

    TEMPOUT_6=$(mktemp)
    cat $TEMPOUT_2 | awk '{if ($NF==3) print $2,$1}' > $TEMPOUT_6
    while read -r i; 
    do 
      pa_brake=`echo $i| awk '{print $2}'`
      client_id=`echo $i| awk '{print $1}'`
      aws cloudwatch put-metric-data --metric-name PA_BRAKE --namespace ${CW_NS} --value $pa_brake --dimensions client_id=$client_id,game_ver=$GAME_VERSION
      aws cloudwatch put-metric-data --metric-name PA_BRAKE --namespace ${CW_NS} --value $pa_brake --dimensions PLAYER_ACTIONS="PA_BRAKE"
    done < $TEMPOUT_6

    TEMPOUT_7=$(mktemp)
    cat $TEMPOUT_2 | awk '{if ($NF==4) print $2,$1}' > $TEMPOUT_7
    while read -r i; 
    do 
      pa_fire=`echo $i| awk '{print $2}'`
      client_id=`echo $i| awk '{print $1}'`
      aws cloudwatch put-metric-data --metric-name PA_FIRE --namespace ${CW_NS} --value $pa_fire --dimensions client_id=$client_id,game_ver=$GAME_VERSION
      aws cloudwatch put-metric-data --metric-name PA_FIRE --namespace ${CW_NS} --value $pa_fire --dimensions PLAYER_ACTIONS="PA_FIRE"
    done < $TEMPOUT_7

    TEMPOUT_8=$(mktemp)
    cat $TEMPOUT_2 | awk '{if ($NF==5) print $2,$1}' > $TEMPOUT_8
    while read -r i; 
    do 
      pa_look_back=`echo $i| awk '{print $2}'`
      client_id=`echo $i| awk '{print $1}'`
      aws cloudwatch put-metric-data --metric-name PA_LOOK_BACK --namespace ${CW_NS} --value $pa_look_back --dimensions client_id=$client_id,game_ver=$GAME_VERSION
      aws cloudwatch put-metric-data --metric-name PA_LOOK_BACK --namespace ${CW_NS} --value $pa_look_back --dimensions PLAYER_ACTIONS="PA_LOOK_BACK"
    done < $TEMPOUT_8

    psql -A -e -t -w -c "update sessions set updated_at=NOW() where client_id='$POD_NAME';"
    echo "psql exit code="$?
    if (( $?>0 ))
    then
      echo "ERR-DB update sessions set updated_at=NOW()"
      exit 0
    fi
  else
    echo "no game actions yet"
  fi
  sleep $SLEEP_B4_PUT_CW
done
