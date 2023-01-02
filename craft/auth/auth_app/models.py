from django.db import models
from psqlextra.types import PostgresPartitioningMethod
from psqlextra.models import PostgresPartitionedModel

class User(models.Model):
  uuid=models.UUIDField(null=False)
  first_name=models.CharField(max_length=50,null=True)
  last_name=models.CharField(max_length=50,null=True)
  username=models.CharField(max_length=50,null=False)
  email=models.CharField(max_length=150,null=True)
  mobile=models.CharField(max_length=150,null=True)
  created_at=models.DateTimeField(null=False)
  updated_at=models.DateTimeField(null=True)

class UserToken(models.Model):
  class PartitioningMeta:
    method = PostgresPartitioningMethod.RANGE
    key = ["created_at"]

  uuid=models.UUIDField(null=False)
  created_at=models.DateTimeField(null=False)
  updated_at=models.DateTimeField(null=True)
  user_id=models.BigIntegerField(null=True)
  username=models.CharField(max_length=50,null=False)
