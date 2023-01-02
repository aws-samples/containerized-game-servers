#!/bin/bash

PGUSER=`cat $SECRET_FILE | jq -r '.username'`
PGDATABASE=`cat $SECRET_FILE | jq -r '.username'`
PGPASSWORD=`cat $SECRET_FILE | jq -r '.password'`
PGHOST=`cat $SECRET_FILE | jq -r '.host'`
PGPORT=`cat $SECRET_FILE | jq -r '.port'`

sed -i "s/PGUSER/$PGUSER/g" django_app/settings.py 
sed -i "s/PGDATABASE/$PGDATABASE/g" django_app/settings.py 
sed -i "s/PGPASSWORD/$PGPASSWORD/g" django_app/settings.py 
sed -i "s/PGHOST/$PGHOST/g" django_app/settings.py 
sed -i "s/PGPORT/$PGPORT/g" django_app/settings.py 

export PGUSER=$PGUSER
export PGDATABASE=$PGDATABASE
export PGPASSWORD=$PGPASSWORD
export PGHOST=$PGHOST
export PGPORT=$PGPORT
#CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
#CMD ["python", "manage.py", "runsslserver", "0.0.0.0:8000"]
python ./manage.py runserver 0.0.0.0:8000

