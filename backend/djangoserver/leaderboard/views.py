from django.shortcuts import render, get_object_or_404

from django.http import HttpResponse, JsonResponse

from .models import Exercise


def index(request):
    return HttpResponse("Hello, world. You're at the leaderboards index.")


# all exercises sorted by name
def exercise_list(request):
    exercises = Exercise.objects.order_by("exercise_name").values("id", "exercise_name", "points")
    return JsonResponse({"exercises": list(exercises)})


# one exercise by id 404 if it doesn't exist
def exercise_detail(request, exercise_id):
    exercise = get_object_or_404(Exercise, pk=exercise_id)
    return JsonResponse({
        "id": exercise.id,
        "exercise_name": exercise.exercise_name,
        "points": exercise.points
    })
