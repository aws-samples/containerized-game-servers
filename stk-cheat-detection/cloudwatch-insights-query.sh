#!/bin/sh

name="stk-game-events"
log_group_names="/aws/containerinsights/gs-us-west-2/application"
query_string="fields @timestamp | sort @timestamp desc | filter @message like /(GameProtocol: Controller action:)/ | parse /GameProtocol: Controller action: (?<m_ticks>\d+) (?<m_kart_id>\d+) (?<m_action>\d+) (?<m_value>\d+) (?<m_value_l>\d+) (?<m_value_r>\D*\d+)\\n/"
start_time=1599280774
end_time=`date +%s`

#aws logs put-query-definition --name $name --log-group-names $log_group_names --query-string "$query_string"
#queryDefinitionId="ba2a13c9-b02a-49af-80f4-3aa3953be2c4"

#aws logs start-query --log-group-names $log_group_names --start-time $start_time --end-time $end_time --query-string "$query_string"
queryId="2110205a-b817-4f8d-adaf-d367186bc4d0"
aws logs get-query-results --query-id $queryId


