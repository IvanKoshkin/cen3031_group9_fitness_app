from django.db.models import Count, Sum
from django.utils import timezone

from .models import WorkoutLog, start_of_current_week


def weekly_standings(today=None):
    """This week's leaderboard, highest points first. Users with the same points
    share a rank, so two people tied for 2nd are both 2nd and the next is 4th."""
    today = today or timezone.localdate()
    week_start = start_of_current_week(today)

    # Flagged workouts don't count until an admin approves them.
    totals = (
        WorkoutLog.objects.filter(
            performed_on__gte=week_start, performed_on__lte=today, flagged=False
        )
        .values("user_id", "user__username")
        .annotate(points=Sum("points_awarded"), workouts=Count("id"))
        .order_by("-points", "user__username")
    )

    standings = []
    rank = 0
    previous_points = None
    for position, row in enumerate(totals, start=1):
        if row["points"] != previous_points:
            rank = position
            previous_points = row["points"]
        standings.append({
            "rank": rank,
            "user_id": row["user_id"],
            "username": row["user__username"],
            "points": row["points"],
            "workouts": row["workouts"],
        })
    return standings
