#!/bin/sh
rm function.zip
zip function.zip lambda_function.py
aws lambda update-function-code --function-name stk-player-events-filter --zip-file fileb://function.zip

#aws lambda create-function --function-name stk-player-events-filter \
#--zip-file fileb://function.zip --handler lambda_function.lambda_handler  --runtime python3.8 \
#--role arn:aws:iam::163538056407:role/service-role/stk-player-events-filter-role-wafthll2
