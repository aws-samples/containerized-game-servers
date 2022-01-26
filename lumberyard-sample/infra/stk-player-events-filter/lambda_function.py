import json
import base64
import re

def lambda_handler(event, context):
    output=[]
    for record in event['records']:
       payload=base64.b64decode(record['data'])
       payload_utf=payload.decode('utf-8')
       regex='GameProtocol: Controller action: (\d+) (\d+) (\d+) (\d+) (\d+) (\D*\d+)'
       regex_controller_action=re.search(regex,payload_utf)
       controller_action=regex_controller_action.group(0).split(': ')[2]
       print("controller_action "+controller_action)
       output_record={
            'recordId': record['recordId'],
            'result': 'Ok',
            'data': base64.b64encode(controller_action.encode('utf-8')+b'\n').decode('utf-8')
       }
       output.append(output_record)
    
    return {'records': output}
