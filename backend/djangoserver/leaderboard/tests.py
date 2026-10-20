from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone

from .models import Exercise, WorkoutLog, start_of_current_week
from .points import (
    DAILY_POINT_CAP,
    award_points,
    is_suspicious,
    points_for,
)


class PointsForTests(TestCase):
    def test_cardio_scores_higher_than_stretching_for_same_time(self):
        self.assertGreater(points_for("cardio", 30), points_for("stretching", 30))

    def test_intensity_changes_the_score(self):
        light = points_for("strength", 60, "light")
        vigorous = points_for("strength", 60, "vigorous")
        self.assertEqual(light, 48)
        self.assertEqual(vigorous, 78)

    def test_unknown_category_uses_the_default_rate(self):
        self.assertEqual(points_for("yoga", 60), 60)

    def test_olympic_weightlifting_matches_the_dataset_spelling(self):
        # Free Exercise DB writes this category with a space, not an underscore.
        with_space = points_for("olympic weightlifting", 60)
        with_underscore = points_for("olympic_weightlifting", 60)
        self.assertEqual(with_space, 72)
        self.assertEqual(with_space, with_underscore)

    def test_category_matching_ignores_case_and_spacing(self):
        self.assertEqual(points_for("  Cardio ", 30), points_for("cardio", 30))

    def test_too_short_or_too_long_is_rejected(self):
        with self.assertRaises(ValueError):
            points_for("cardio", 2)
        with self.assertRaises(ValueError):
            points_for("cardio", 500)

    def test_unknown_intensity_is_rejected(self):
        with self.assertRaises(ValueError):
            points_for("cardio", 30, "maximum")

    def test_minutes_sent_as_text_are_accepted(self):
        self.assertEqual(points_for("strength", "45"), 45)

    def test_non_numeric_minutes_raise_value_error_not_type_error(self):
        for bad in (None, "abc", 45.5, True):
            with self.assertRaises(ValueError):
                points_for("strength", bad)


class DailyCapTests(TestCase):
    def test_points_under_the_cap_are_awarded_in_full(self):
        self.assertEqual(award_points(50, 40), 40)

    def test_points_over_the_cap_are_trimmed(self):
        self.assertEqual(award_points(DAILY_POINT_CAP - 10, 40), 10)

    def test_nothing_is_awarded_once_the_cap_is_reached(self):
        self.assertEqual(award_points(DAILY_POINT_CAP, 40), 0)


class SuspiciousLogTests(TestCase):
    def test_a_normal_workout_is_not_flagged(self):
        self.assertFalse(is_suspicious(0, 40, 30))

    def test_an_unusually_long_workout_is_flagged(self):
        self.assertTrue(is_suspicious(0, 120, 120))
        self.assertTrue(is_suspicious(0, 150, 150))

    def test_a_workout_just_under_the_long_threshold_is_not_flagged(self):
        self.assertFalse(is_suspicious(0, 119, 119))

    def test_going_over_the_daily_cap_is_flagged(self):
        self.assertTrue(is_suspicious(DAILY_POINT_CAP - 5, 50, 45))


class WorkoutLogTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user("student", password="pw-for-tests")
        self.cardio = Exercise.objects.create(exercise_name="Running", category="cardio")
        self.today = timezone.localdate()

    def log(self, minutes=30, **extra):
        return WorkoutLog.objects.create(
            user=self.user, exercise=self.cardio, minutes=minutes,
            performed_on=extra.pop("performed_on", self.today), **extra
        )

    def test_points_are_calculated_by_the_server(self):
        workout = self.log(minutes=30)
        self.assertEqual(workout.points_awarded, 36)

    def test_a_client_supplied_point_total_is_ignored(self):
        workout = WorkoutLog(
            user=self.user, exercise=self.cardio, minutes=30, performed_on=self.today
        )
        workout.points_awarded = 999
        workout.save()
        self.assertEqual(workout.points_awarded, 36)

    def test_the_daily_cap_applies_across_a_users_logs(self):
        for _ in range(4):
            self.log(minutes=60)  # 72 points each, 288 total
        last = self.log(minutes=60)
        self.assertEqual(last.points_awarded, DAILY_POINT_CAP - 288)
        self.assertTrue(last.flagged)

    def test_a_normal_workout_is_not_flagged(self):
        self.assertFalse(self.log(minutes=30).flagged)

    def test_an_admin_can_clear_a_flag(self):
        workout = self.log(minutes=150)
        self.assertTrue(workout.flagged)
        workout.flagged = False
        workout.save()
        workout.refresh_from_db()
        self.assertFalse(workout.flagged)

    def test_a_future_date_is_rejected(self):
        with self.assertRaises(ValidationError):
            self.log(performed_on=self.today + timedelta(days=1))

    def test_a_date_before_this_week_is_rejected(self):
        with self.assertRaises(ValidationError):
            self.log(performed_on=start_of_current_week(self.today) - timedelta(days=1))

    def test_an_admin_can_clear_a_flag_on_last_weeks_workout(self):
        workout = self.log(minutes=150)
        last_week = start_of_current_week(self.today) - timedelta(days=3)
        WorkoutLog.objects.filter(pk=workout.pk).update(performed_on=last_week)
        workout.refresh_from_db()
        workout.flagged = False
        workout.full_clean()  # what the admin form runs before saving
        workout.save()
        workout.refresh_from_db()
        self.assertFalse(workout.flagged)

    def test_an_earlier_day_this_week_is_allowed(self):
        workout = self.log(performed_on=start_of_current_week(self.today))
        self.assertEqual(workout.points_awarded, 36)


class ExerciseCategoryTests(TestCase):
    def test_category_is_stored_in_the_canonical_spelling(self):
        lift = Exercise.objects.create(exercise_name="Snatch", category="Olympic_Weightlifting")
        self.assertEqual(lift.category, "olympic weightlifting")
