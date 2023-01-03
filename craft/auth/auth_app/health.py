from django.shortcuts import render
from django.shortcuts import render

sdk_title='healthy'

def show(request):
  
  context = {
      "name": sdk_title,
  }
  return render(request, "health.html", context)
