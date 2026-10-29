from django.shortcuts import render, get_object_or_404

from django.http import HttpResponse, JsonResponse
from django.utils import timezone

from .models import Exercise, start_of_current_week
from .standings import weekly_standings


def index(request):
    return HttpResponse("Hello, world. You're at the leaderboards index.")


# all exercises sorted by name
def exercise_list(request):
    exercises = Exercise.objects.order_by("exercise_name").values("id", "exercise_name", "category")
    return JsonResponse({"exercises": list(exercises)})


# one exercise by id 404 if it doesn't exist
def exercise_detail(request, exercise_id):
    exercise = get_object_or_404(Exercise, pk=exercise_id)
    return JsonResponse({
        "id": exercise.id,
        "exercise_name": exercise.exercise_name,
        "points": exercise.points
    })


# this week's leaderboard, in the format the frontend's Leaderboard type expects
def weekly_leaderboard(request):
    today = timezone.localdate()
    entries = [
        {
            "userId": row["user_id"],
            "displayName": row["username"],
            "points": row["points"],
            "workouts": row["workouts"],
            "rank": row["rank"],
        }
        for row in weekly_standings(today)
    ]
    # the frontend shows your rank card even at 0 points, so include you if you haven't logged yet
    user = request.user
    if user.is_authenticated and all(entry["userId"] != user.id for entry in entries):
        entries.append({"userId": user.id, "displayName": user.username, "points": 0, "workouts": 0, "rank": None})
    return JsonResponse({
        "weekStart": start_of_current_week(today).isoformat(),
        "currentUserId": request.user.id if request.user.is_authenticated else None,
        "entries": entries,
    })
