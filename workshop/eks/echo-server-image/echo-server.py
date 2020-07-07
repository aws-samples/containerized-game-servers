#!/usr/bin/python

import socket
import sys
import os

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
port = int(os.environ['PORT'])
server_address = ('0.0.0.0', port)
print >>sys.stderr, 'starting up on %s port %s' % server_address
sock.bind(server_address)
sock.listen(1)

while True:
    print >>sys.stderr, 'waiting for a connection'
    conn, client_address = sock.accept()
    try:
        print >>sys.stderr, 'connection from', client_address
        while True:
            data = conn.recv(16)
            print >>sys.stderr, 'received "%s"' % data
            if data:
                print >>sys.stderr, 'sending data back to the client'
                conn.sendall(data)
            else:
                print >>sys.stderr, 'no more data from', client_address
                break
    finally:
        conn.close()
