import kopf
from boto3 import client
from kubernetes import client, config
from kubernetes.client.rest import ApiException
import logging
config.load_incluster_config()
api_instance = client.CoreV1Api()

@kopf.on.create('', 'v1', 'pods', when=lambda meta, **_: meta['ownerReferences'][0]['kind']=='StatefulSet')
def create_fn(meta, spec, namespace, logger, **kwargs):
    if 'statefulset.kubernetes.io/pod-name' in meta['labels']:
        label_selector = {'statefulset.kubernetes.io/pod-name': meta['labels']['statefulset.kubernetes.io/pod-name']}
        service_ports = []
        for container in spec['containers']:
            for port in container['ports']:
                service_ports.append(client.models.V1ServicePort(port=port['containerPort'],protocol='UDP'))
        create_node_port_service(namespace, label_selector, service_ports)

def my_handler(meta, **_):
    pass

def create_node_port_service(namespace, label_selector, service_ports):
    service_spec = client.V1ServiceSpec(selector=label_selector,ports=service_ports,type='NodePort')
    service_meta = client.V1ObjectMeta(name=label_selector['statefulset.kubernetes.io/pod-name'])
    body = client.V1Service(metadata=service_meta, spec=service_spec)
    api_response = api_instance.create_namespaced_service(namespace, body)
    logging.info(api_response)

logging.basicConfig(format='%(asctime)s [%(levelname)s] - %(message)s', datefmt='%d-%b-%y %H:%M:%S', level=logging.INFO)
