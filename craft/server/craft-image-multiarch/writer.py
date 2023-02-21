from math import floor
import requests
import socket
import sqlite3
import sys
import os
import psycopg2
import time

DEFAULT_HOST = 'craft.yahav.sa.aws.dev'
DEFAULT_PORT = 4080

EMPTY = 0
GRASS = 1
SAND = 2
STONE = 3
BRICK = 4
WOOD = 5
CEMENT = 6
DIRT = 7
PLANK = 8
SNOW = 9
GLASS = 10
COBBLE = 11
LIGHT_STONE = 12
DARK_STONE = 13
CHEST = 14
LEAVES = 15
CLOUD = 16
TALL_GRASS = 17
YELLOW_FLOWER = 18
RED_FLOWER = 19
PURPLE_FLOWER = 20
SUN_FLOWER = 21
WHITE_FLOWER = 22
BLUE_FLOWER = 23

CHUNK_SIZE = 32

def chunked(x):
    return int(floor(round(x) / CHUNK_SIZE))

def get_identity():
    query = (
        'select username, token from identity_token where selected = 1;'
    )
    conn = sqlite3.connect('auth.db')
    rows = conn.execute(query)
    for row in rows:
        return row
    raise Exception('No identities found.')

class Client(object):
    def __init__(self, host, port):
        self.conn = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.conn.connect((host, port))
        #self.authenticate()
    def authenticate(self):
        #username, identity_token = get_identity()
        url = 'https://craft.michaelfogleman.com/api/1/identity'
        payload = {
            'username': username,
            'identity_token': identity_token,
        }
        response = requests.post(url, data=payload)
        if response.status_code == 200 and response.text.isalnum():
            access_token = response.text
            self.conn.sendall('A,%s,%s\n' % (username, access_token))
        else:
            raise Exception('Failed to authenticate.')
    def set_block(self, x, y, z, w):
        time.sleep(0.5)
        resp=self.conn.sendall('B,%d,%d,%d,%d\n' % (x,y,z,w))
        print("self.conn.sendall- %d,%d,%d,%d response=%s\n" % (x,y,z,w,resp)) 
        sys.stdout.flush()
    def write_in_blocks(self,blocks):
        for x,y,z in blocks:
          self.set_block(x,y,z,BRICK)
    def delete_in_blocks(self,blocks):
        for y in blocks:
          self.set_block(y[0],y[1],y[2],EMPTY)
    def set_blocks(self, blocks, w):
        key = lambda block: (block[1], block[0], block[2])
        for x, y, z in sorted(blocks, key=key):
          self.set_block(x, y, z, w)

def get_client():
    default_args = [DEFAULT_HOST, DEFAULT_PORT]
    args = sys.argv[1:] + [None] * len(default_args)
    host, port = [a or b for a, b in zip(args, default_args)]
    client = Client(host, int(port))
    return client

def main():
    client = get_client()
    set_block = client.set_block
    set_blocks = client.set_blocks
    write_in_blocks = client.write_in_blocks
    delete_in_blocks = client.delete_in_blocks
    x=[[922,12,192],[922,12,193],[922,12,194],[921,12,191],[922,12,195],[921,12,195],[920,12,195],[919,12,195],[918,12,195],[917,12,195],[916,12,195],[915,12,195],[916,12,194],[916,12,193],[919,12,194],[919,12,193],[919,12,192],[916,12,192],[917,12,191],[918,12,191],[921,12,200],[922,12,200],[920,12,201],[919,12,201],[918,12,202],[917,12,202],[916,12,203],[916,12,204],[916,12,205],[917,12,204],[918,12,204],[917,12,206],[918,12,206],[919,12,207],[920,12,207],[921,12,208],[922,12,208],[919,12,204],[920,12,204],[922,12,214],[922,12,213],[922,12,212],[921,12,211],[920,12,211],[919,12,212],[919,12,213],[919,12,214],[918,12,214],[917,12,214],[916,12,213],[916,12,212],[916,12,211],[911,12,190],[910,12,190],[909,12,190],[908,12,190],[907,12,190],[906,12,190],[910,12,191],[910,12,192],[910,12,193],[909,12,194],[908,12,196],[908,12,197],[907,12,196],[906,12,196],[905,12,197],[905,12,198],[908,12,198],[909,12,196],[910,12,196],[910,12,197],[910,12,198],[909,12,199],[905,12,201],[906,12,201],[907,12,201],[909,12,201],[905,12,204],[906,12,204],[907,12,204],[908,12,204],[909,12,204],[910,12,204],[909,12,205],[909,12,206],[909,12,207],[908,12,208],[907,12,208],[906,12,208],[905,12,208],[909,12,211],[908,12,211],[907,12,212],[906,12,212],[905,12,213],[906,12,214],[907,12,214],[908,12,215],[909,12,215],[909,12,218],[908,12,218],[907,12,218],[906,12,218],[905,12,219],[905,12,220],[906,12,199],[910,12,218],[910,12,219],[910,12,220],[909,12,221],[908,12,220],[908,12,219],[906,12,221],[905,12,225],[906,12,225],[907,12,225],[908,12,225],[909,12,225],[910,12,225],[909,12,226],[909,12,227],[909,12,228],[908,12,229],[907,12,229],[906,12,229],[905,12,229],[908,12,231],[908,12,232],[908,12,233],[907,12,232],[906,12,232],[905,12,232],[909,12,232],[910,12,232],[930,12,191],[931,12,192],[931,12,193],[931,12,194],[930,12,195],[929,12,194],[928,12,193],[927,12,192],[926,12,191],[926,12,192],[926,12,193],[926,12,194],[926,12,195],[931,12,198],[931,12,199],[931,12,200],[930,12,197],[929,12,197],[928,12,197],[927,12,197],[926,12,198],[926,12,199],[926,12,200],[930,12,201],[929,12,201],[928,12,201],[927,12,201],[930,12,203],[931,12,204],[931,12,205],[931,12,206],[930,12,207],[929,12,206],[928,12,205],[927,12,204],[926,12,203],[926,12,204],[926,12,205],[926,12,206],[926,12,207],[930,12,210],[931,12,211],[931,12,212],[931,12,213],[930,12,214],[929,12,213],[928,12,212],[927,12,211],[926,12,210],[926,12,211],[926,12,212],[926,12,213],[926,12,214]]
    #while(True):
    write_in_blocks(x)
    #delete_in_blocks(x)


if __name__ == '__main__':
    main()
