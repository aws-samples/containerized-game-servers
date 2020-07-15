import kopf
import boto3
from kubernetes import client, config
from kubernetes.client.rest import ApiException
import logging
import uuid

config.load_incluster_config()
api_instance = client.CoreV1Api()
fleetiq = boto3.client('gamelift', region_name='us-west-2')

@kopf.on.create('', 'v1', 'pods', when=lambda meta, **_: meta['ownerReferences'][0]['kind']=='StatefulSet')
def create_fn(meta, spec, namespace, status, logger, **kwargs):
    if 'statefulset.kubernetes.io/pod-name' in meta['labels']:
        label_selector = {'statefulset.kubernetes.io/pod-name': meta['labels']['statefulset.kubernetes.io/pod-name']}
        service_ports = []
        for container in spec['containers']:
            for port in container['ports']:
                service_ports.append(client.models.V1ServicePort(port=port['containerPort']))
        api_response = create_node_port_service(namespace, label_selector, service_ports)
        node_port_spec = api_response.spec
        node_port_ports = node_port_spec.ports
        #logging.debug(node_port_ports)
        node_port = node_port_ports[0].node_port
        #TODO Get nodePort from api_response
        instance_id, public_ip = get_instance_id(spec['nodeName'])
        add_game_server(instance_id, public_ip, node_port)

def add_game_server(instance_id, public_ip, node_port):
    response = fleetiq.register_game_server(
        GameServerGroupName='arn:aws:gamelift:us-west-2:820537372947:gameservergroup/MyGameServerGroup', #required GameServerGroup name or ARN
        GameServerId=str(uuid.uuid1()), #required self-defined uniqueId
        InstanceId=instance_id, #required InstanceId
        ConnectionInfo=public_ip + ':' + str(node_port) # is the public IP of the instance and the node port of the pod
    )
    logging.debug(response)

def get_instance_id(node_name):
    node = api_instance.read_node(node_name)
    node_metadata = node.metadata
    node_labels = node_metadata.labels
    instance_id = node_labels['alpha.eksctl.io/instance-id']
    ec2 = boto3.resource('ec2', region_name='us-west-2')
    instance = ec2.Instance(instance_id)
    public_ip = instance.public_ip_address
    #TODO use the nodeName to get the labels from the node.
    #The label alpha.eksctl.io/instance-id is the instance ID of the instance
    #Return instance ID and public IP address of instance
    logging.debug(instance_id, public_ip)
    return instance_id, public_ip

def my_handler(meta, **_):
    pass

def create_node_port_service(namespace, label_selector, service_ports):
    service_spec = client.V1ServiceSpec(selector=label_selector, ports=service_ports, type='NodePort')
    service_meta = client.V1ObjectMeta(name=label_selector['statefulset.kubernetes.io/pod-name'])
    body = client.V1Service(metadata=service_meta, spec=service_spec)
    api_response = api_instance.create_namespaced_service(namespace, body)
    return api_response

logging.basicConfig(format='%(asctime)s [%(levelname)s] - %(message)s', datefmt='%d-%b-%y %H:%M:%S', level=logging.INFO)