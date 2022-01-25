import json
import pytest

from aws_cdk import core
from ec2-build.ec2_build_stack import Ec2BuildStack


def get_template():
    app = core.App()
    Ec2BuildStack(app, "ec2-build")
    return json.dumps(app.synth().get_stack("ec2-build").template)


def test_sqs_queue_created():
    assert("AWS::SQS::Queue" in get_template())


def test_sns_topic_created():
    assert("AWS::SNS::Topic" in get_template())
