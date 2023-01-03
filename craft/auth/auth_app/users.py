from django.shortcuts import render
from django.shortcuts import render
from auth_app.models import User, UserToken
from django.db.models import Max
from django.utils import timezone

import uuid
from random import randrange
import random
import string

def adduser(request):
  user_uuid=uuid.uuid1()
  user_created_at=timezone.now()
  user_updated_at=timezone.now()
  user_username=request.GET.get('username','')
  #user_username=username
  user_obj=User(uuid=user_uuid,created_at=user_created_at,updated_at=user_updated_at,username=user_username)
  user_obj.save()
  context={
    "user":user_obj,
  }
  return render(request,'user_detail.html',context)
