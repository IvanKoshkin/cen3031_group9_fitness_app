from django.conf import settings
from django.db import models

from .points import CATEGORY_RATE, INTENSITY_MULTIPLIER, points_for

CATEGORY_CHOICES = [(name, name.title()) for name in sorted(CATEGORY_RATE)]
INTENSITY_CHOICES = [(name, name.title()) for name in INTENSITY_MULTIPLIER]


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
    points_awarded = models.PositiveIntegerField(default=0)
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
    
