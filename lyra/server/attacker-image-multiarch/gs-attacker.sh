#!/bin/bash -x
n=$NUM_OF_LOAD_THREADS
for ((i=1 ; i<=$n ; i++))
do
  /simulate_session.py &
  sleep $SLEEP_BETWEEN_CYCLE
done
/simulate_session.py
