from django.shortcuts import render, get_object_or_404

from django.core.exceptions import ValidationError
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

import json
from datetime import date

from .models import Exercise, WorkoutLog, start_of_current_week
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

@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def logs(request):
    """Create a workout log and return the score calculated by the server."""
    if request.method == "OPTIONS":
        return JsonResponse({})

    if not request.user.is_authenticated:
        return JsonResponse({"detail": "You must be logged in to log a workout."}, status=401)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Send the workout as JSON."}, status=400)

    if not isinstance(data, dict):
        return JsonResponse({"detail": "Send the workout as a JSON object."}, status=400)

    exercise_id = data.get("exerciseId", data.get("exercise_id"))
    if exercise_id is None:
        return JsonResponse({"detail": "exerciseId is required."}, status=400)
    try:
        exercise = Exercise.objects.get(pk=exercise_id)
    except (Exercise.DoesNotExist, ValueError, TypeError):
        return JsonResponse({"detail": "That exercise does not exist."}, status=400)

    performed_on = data.get("performedOn", data.get("performed_on"))
    if performed_on is None:
        performed_on = timezone.localdate()
    else:
        try:
            performed_on = date.fromisoformat(performed_on)
        except (TypeError, ValueError):
            return JsonResponse({"detail": "performedOn must be an ISO date (YYYY-MM-DD)."}, status=400)

    minutes = data.get("minutes")
    intensity = data.get("intensity", "moderate")
    try:
        workout = WorkoutLog.objects.create(
            user=request.user,
            exercise=exercise,
            minutes=minutes,
            intensity=intensity,
            performed_on=performed_on,
        )
    except ValueError as error:
        return JsonResponse({"detail": str(error)}, status=400)
    # the model rejects dates outside the current week
    except ValidationError as error:
        return JsonResponse({"detail": " ".join(error.messages)}, status=400)

    return JsonResponse(
        {
            "id": workout.id,
            "exerciseId": workout.exercise_id,
            "minutes": workout.minutes,
            "intensity": workout.intensity,
            "performedOn": workout.performed_on.isoformat(),
            "pointsAwarded": workout.points_awarded,
            "flagged": workout.flagged,
        },
        status=201,
    )
