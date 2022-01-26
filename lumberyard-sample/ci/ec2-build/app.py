#!/usr/bin/env python3

from aws_cdk import core

from ec2_build.ec2_build_stack import Ec2BuildStack


app = core.App()
Ec2BuildStack(app, "ec2-build", env={'region': 'us-west-2'})

app.synth()
