from django.test import TestCase

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

    def test_too_short_or_too_long_is_rejected(self):
        with self.assertRaises(ValueError):
            points_for("cardio", 2)
        with self.assertRaises(ValueError):
            points_for("cardio", 500)

    def test_unknown_intensity_is_rejected(self):
        with self.assertRaises(ValueError):
            points_for("cardio", 30, "maximum")


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

    def test_a_maximum_length_workout_is_flagged(self):
        self.assertTrue(is_suspicious(0, 200, 180))

    def test_going_over_the_daily_cap_is_flagged(self):
        self.assertTrue(is_suspicious(DAILY_POINT_CAP - 5, 50, 45))
