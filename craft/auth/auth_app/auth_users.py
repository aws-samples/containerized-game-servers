from django.shortcuts import render
from django.shortcuts import render
from auth_app.models import User, UserToken
from django.db.models import Max
from django.utils import timezone
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt


import uuid
import json
from random import randrange
import random
import string

def getoken(request):
  token_uuid=uuid.uuid1()
  token_created_at=timezone.now()
  token_updated_at=timezone.now()
  arg_username=request.GET.get('username','')
  user_id=User.objects.get(username=arg_username).id
  user_username=User.objects.get(id=user_id).username
  usertoken_obj=UserToken(uuid=token_uuid,created_at=token_created_at,updated_at=token_updated_at,user_id=user_id,username=user_username)
  usertoken_obj.save()
  context={
    "usertoken":usertoken_obj,
  }
  return render(request,'usertoken_detail.html',context)

@csrf_exempt
def validate_identity(request):
  body_unicode=request.body.decode('utf-8')
  print('Body decoded utf-8:%s' % body_unicode)
  #body=body_unicode.split('&')
  #username=body[0].split('=')
  #fulltoken=body[1].split('=')[1]
  #print(fulltoken)
  #tokenchunk=fulltoken.split('-')[0]
  #print(tokenchunk)
  
  return HttpResponse(body_unicode)
