from django.urls import path

from . import views
from . import users 
from . import auth_users
from . import health


urlpatterns = [
    path("adduser/", users.adduser, name="adduser"),
    path("health/", health.show, name="health"),
    path("allusers/", views.allusers_detail, name="allusers"),
    path("getoken/", auth_users.getoken, name="getoken"),
    path("identity/", auth_users.validate_identity, name="identity")
]
