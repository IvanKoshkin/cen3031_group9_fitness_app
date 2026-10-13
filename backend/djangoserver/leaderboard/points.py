"""Scoring rules for logged workouts.

Points are always calculated here, on the server, so a client can never send
its own point value. This is the mitigation for the fake-workout risk.
"""

# Points earned per minute, by exercise category.
CATEGORY_RATE = {
    "strength": 1.0,
    "cardio": 1.2,
    "stretching": 0.5,
    "plyometrics": 1.2,
    "strongman": 1.1,
    "powerlifting": 1.1,
    "olympic_weightlifting": 1.2,
}
DEFAULT_RATE = 1.0

INTENSITY_MULTIPLIER = {
    "light": 0.8,
    "moderate": 1.0,
    "vigorous": 1.3,
}

MIN_MINUTES = 5
MAX_MINUTES = 180
DAILY_POINT_CAP = 300


def points_for(category, minutes, intensity="moderate"):
    """Points for one workout, before the daily cap is applied."""
    if minutes < MIN_MINUTES or minutes > MAX_MINUTES:
        raise ValueError(f"minutes must be between {MIN_MINUTES} and {MAX_MINUTES}")
    if intensity not in INTENSITY_MULTIPLIER:
        raise ValueError(f"unknown intensity: {intensity}")

    rate = CATEGORY_RATE.get(category, DEFAULT_RATE)
    return round(rate * minutes * INTENSITY_MULTIPLIER[intensity])


def award_points(points_already_today, earned):
    """Points actually awarded once the daily cap is applied."""
    remaining = DAILY_POINT_CAP - points_already_today
    if remaining <= 0:
        return 0
    return min(earned, remaining)


def is_suspicious(points_already_today, earned, minutes):
    """Flag a log for admin review instead of trusting it outright."""
    return minutes >= MAX_MINUTES or points_already_today + earned > DAILY_POINT_CAP
