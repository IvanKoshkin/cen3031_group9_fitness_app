from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("exercises/", views.exercise_list, name="exercise_list"),
    path("exercises/<int:exercise_id>/", views.exercise_detail, name="exercise_detail"),
]
