#!/usr/bin/python3

from ec2_metadata import ec2_metadata
print(ec2_metadata.public_ipv4)
