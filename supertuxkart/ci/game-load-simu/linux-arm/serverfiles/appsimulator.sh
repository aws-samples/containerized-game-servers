#!/bin/bash 
#restore simulator state from SQS in the case of previous run
DEPLOY_PREFIX="stk"
sqs_file="/tmp/"$RANDOM".json"
aws sqs receive-message --queue-url ${QUEUE_URL} > $sqs_file
echo "sqs exit code="$?
if (( $?>0 ))
then
  echo "ERR-SQS"
  j=0.1
else
  receipt_handle=`cat $sqs_file | jq '.Messages[].ReceiptHandle'|sed 's/"//g'`
  j=`cat $sqs_file | jq '.Messages[].Body'|sed 's/"//g'`
  if [ -z "$j" ]
  then
    echo "EMPTY-SQS"
    j=0
  fi
fi
rm -f $sqs_file

prev_clients=0
prev_servers=0

#simulator sine wave range. From $j to 3.14 in 0.1 increments
_seq=`seq $j 0.021 3.14`
echo "first seq is "$_seq
while true; do
for i in $_seq; do
  sqs_file="/tmp/"$RANDOM".json"
  aws sqs receive-message --queue-url ${QUEUE_URL} > $sqs_file
  if (( $?<=0 )); then
    receipt_handle=`cat $sqs_file | jq '.Messages[].ReceiptHandle'|sed 's/"//g'`
    if [ -n "$receipt_handle" ]; then
      echo "delete msg receipt_handle="$receipt_handle
      aws sqs delete-message --queue-url ${QUEUE_URL} --receipt-handle $receipt_handle
    fi
  fi
  rm -f $sqs_file
  x=`echo $i|awk '{print $1}'`
  sinx=`echo $i|awk '{print int(sin($1)*100)}'`
  echo "sinx=" $sinx
  echo "i=" $i
  aws sqs send-message --queue-url ${QUEUE_URL} --message-body "$i"

  clients=`echo $(( sinx * 4 ))`
  servers=`echo $(( sinx * 1/2 ))`
  deploys=`kubectl get deploy | grep $DEPLOY_PREFIX | awk '{print $1}'`
  for deploy in $deploys
  do
   if [[ "$deploy" == "stknlb"* ]]; then
        kubectl scale deploy/$deploy --replicas=$servers
        aws cloudwatch put-metric-data --metric-name current_gameservers --namespace ${DEPLOY_NAME} --value ${servers}
        echo "gameservers="$servers" sinx="$sinx
   fi
   if [[ "$deploy" == "stkcli"* ]]; then
        kubectl scale deploy/$deploy --replicas=$clients
        aws cloudwatch put-metric-data --metric-name current_gameclient --namespace ${DEPLOY_NAME} --value ${clients}
        echo "gameclients="$clients" sinx="$sinx
   fi
  done

  prev_clients=$clients
  prev_servers=$servers
  sleeptime=`awk -v min=$MIN_SLEEP_BETWEEN_CYCLE -v max=$MAX_SLEEP_BETWEEN_CYCLE 'BEGIN{srand(); print int(min+rand()*(max-min+1))}'`
  echo "cleanning not ready nodes and faulty pods"
  kubectl delete po `kubectl get po | egrep 'Evicted|CrashLoopBackOff|CreateContainerError|ExitCode|OOMKilled|RunContainerError'|awk '{print $1}'`
  sleep $sleeptime"m"
done
_seq=`seq 0.01 0.021 3.14`
echo "new cycle "$_seq
done
