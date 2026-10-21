from datetime import timedelta

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Sum
from django.utils import timezone

from .points import (
    CATEGORY_RATE,
    INTENSITY_MULTIPLIER,
    award_points,
    is_suspicious,
    normalize_category,
    points_for,
)

CATEGORY_CHOICES = [(name, name.title()) for name in sorted(CATEGORY_RATE)]
INTENSITY_CHOICES = [(name, name.title()) for name in INTENSITY_MULTIPLIER]


def start_of_current_week(today=None):
    """Weeks start on Monday, matching the weekly leaderboard reset."""
    today = today or timezone.localdate()
    return today - timedelta(days=today.weekday())


class Exercise(models.Model):
    exercise_name = models.CharField(max_length = 50) #arbitrary max length
    points = models.IntegerField(default = 0)
    # Category drives scoring: points come from category + duration + intensity,
    # not from a flat value stored on the exercise.
    category = models.CharField(
        max_length=32, choices=CATEGORY_CHOICES, default="strength"
    )

    def __str__(self):
        return self.exercise_name

    def save(self, *args, **kwargs):
        # Store the canonical spelling so 'Olympic_Weightlifting' from a seed
        # script matches the choices and the scoring table.
        self.category = normalize_category(self.category) or "strength"
        super().save(*args, **kwargs)


class WorkoutLog(models.Model):
    """One workout a member logged. Points are set by the server, never by the client."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="workout_logs"
    )
    exercise = models.ForeignKey(Exercise, on_delete=models.PROTECT)
    minutes = models.PositiveIntegerField()
    intensity = models.CharField(
        max_length=16, choices=INTENSITY_CHOICES, default="moderate"
    )
    performed_on = models.DateField()
    points_awarded = models.PositiveIntegerField(default=0, editable=False)
    flagged = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-performed_on", "-created_at"]
        indexes = [models.Index(fields=["user", "performed_on"])]

    def __str__(self):
        return f"{self.user} - {self.exercise} ({self.points_awarded} pts)"

    def base_points(self):
        """Points this workout is worth before the daily cap is applied."""
        return points_for(self.exercise.category, self.minutes, self.intensity)

    def clean(self):
        """Students can only log workouts for days in the current week. That stops
        someone logging a workout from three weeks ago to pad their score."""
        super().clean()
        # Skip this check when an admin edits a workout that already exists, so
        # last week's flagged workouts can still be reviewed.
        if not self._state.adding or self.performed_on is None:
            return
        today = timezone.localdate()
        if self.performed_on > today:
            raise ValidationError({"performed_on": "A workout can't be logged for a future date."})
        if self.performed_on < start_of_current_week(today):
            raise ValidationError(
                {"performed_on": "Workouts can only be logged for days in the current week."}
            )

    def points_already_logged_that_day(self):
        others = WorkoutLog.objects.filter(user=self.user, performed_on=self.performed_on)
        if self.pk:
            others = others.exclude(pk=self.pk)
        return others.aggregate(total=Sum("points_awarded"))["total"] or 0

    def save(self, *args, **kwargs):
        # Validate the date and score the workout here, so no caller (a view, a
        # serializer, a script) can store a client-supplied point total.
        self.clean()
        already = self.points_already_logged_that_day()
        earned = self.base_points()
        self.points_awarded = award_points(already, earned)
        # Only auto-flag new logs, so an admin clearing the flag sticks.
        if self._state.adding:
            self.flagged = self.flagged or is_suspicious(already, earned, self.minutes)
        super().save(*args, **kwargs)
