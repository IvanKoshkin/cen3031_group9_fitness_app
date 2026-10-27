from django.contrib import admin

from .models import Exercise, WorkoutLog
# Register your models here.

@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    """Lets admins search exercises by name and filter them by category."""

    list_display = ("exercise_name", "category")
    list_filter = ("category",)
    search_fields = ("exercise_name",)
    ordering = ("exercise_name",)


@admin.register(WorkoutLog)
class WorkoutLogAdmin(admin.ModelAdmin):
    """Where admins review flagged workouts and clear or remove them."""

    list_display = ("user", "exercise", "minutes", "intensity", "performed_on", "points_awarded", "flagged")
    list_filter = ("flagged", "intensity", "performed_on")
    search_fields = ("user__username", "exercise__exercise_name")
    readonly_fields = ("points_awarded", "created_at")