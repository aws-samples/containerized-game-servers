from aws_cdk import (
    aws_iam as iam,
    aws_autoscaling as autoscaling,
    aws_ec2 as ec2,
    core
)

class Ec2BuildStack(core.Stack):

  def __init__(self, scope: core.Construct, id: str, **kwargs) -> None:
    super().__init__(scope, id, **kwargs)
    vpc = ec2.Vpc(
      self, "stk-vpc",
      max_azs=3,
      nat_gateways=1,
      subnet_configuration=[
        ec2.SubnetConfiguration(name="stk-public",subnet_type=ec2.SubnetType.PUBLIC),
        ec2.SubnetConfiguration(name="stk-private",subnet_type=ec2.SubnetType.PRIVATE)
      ]
    )
    ssh_security_group = ec2.SecurityGroup(
      self, "allow-ssh-sg",
      vpc=vpc,
      description="Allow ssh access to ec2 instances",
      allow_all_outbound=True
    )
    ssh_security_group.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(22), "allow ssh access from the world")

    userdata = ec2.UserData.for_linux(shebang="#!/bin/bash -xe")
    userdata.add_commands(
         "echo '======================================================='",
         "yum -y update",
         "yum install -y git docker svn",
         "cd /home/ec2-user",
         "git clone https://github.com/yahavb/agones.git",
         "git clone https://github.com/yahavb/amazon-aurora-call-to-amazon-sagemaker-sample.git",
         "chown ec2-user -R /home/ec2-user/agones/",
         "service docker start"
    )
    
    role = iam.Role(self, "stkbuild", assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"))
    role.add_to_policy(iam.PolicyStatement(
      actions=["ecr:GetAuthorizationToken"],
      resources=["*"]
    ))

    asg = autoscaling.AutoScalingGroup(
      self, 'stk-asg',
      vpc=vpc,
      role=role,
      user_data=userdata,
      security_group=ssh_security_group,
      instance_type=ec2.InstanceType("c5.4xlarge"),
      machine_image=ec2.AmazonLinuxImage(),
      associate_public_ip_address=True,
      update_type=autoscaling.UpdateType.REPLACING_UPDATE,
      desired_capacity=1,
      key_name='id_rsa',
      vpc_subnets={'subnet_type': ec2.SubnetType.PUBLIC}
    )
    
    config = asg.node.find_child('LaunchConfig')
    config.add_property_override(
      property_path="BlockDeviceMappings",
      value=[{'DeviceName': '/dev/xvda', 'Ebs': {'VolumeSize': 100,'DeleteOnTermination': False, 'VolumeType': 'gp2'}}]
    )


    #TODO add ECR registry creation and enable actions 
