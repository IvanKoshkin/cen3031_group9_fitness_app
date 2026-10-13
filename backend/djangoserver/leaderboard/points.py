"""Scoring rules for logged workouts.

Points are always calculated here, on the server, so a client can never send
its own point value. This is the mitigation for the fake-workout risk.
"""

# Points earned per minute, by exercise category. These are the seven
# categories used by Free Exercise DB, the dataset we seed the library from.
CATEGORY_RATE = {
    "strength": 1.0,
    "cardio": 1.2,
    "stretching": 0.5,
    "plyometrics": 1.2,
    "strongman": 1.1,
    "powerlifting": 1.1,
    "olympic weightlifting": 1.2,
}
DEFAULT_RATE = 1.0

INTENSITY_MULTIPLIER = {
    "light": 0.8,
    "moderate": 1.0,
    "vigorous": 1.3,
}

MIN_MINUTES = 5
MAX_MINUTES = 180
# Longer than this is allowed, but unusual enough to send to an admin.
LONG_WORKOUT_MINUTES = 120
DAILY_POINT_CAP = 300


def normalize_category(category):
    """The dataset writes 'olympic weightlifting'; code often writes it with
    an underscore. Accept either, and ignore case and surrounding spaces."""
    if not category:
        return ""
    return category.strip().lower().replace("_", " ")


def parse_minutes(minutes):
    """Request data often arrives as a string. Turn it into an int, and raise
    ValueError (not TypeError) for anything that isn't a whole number."""
    if isinstance(minutes, str) and minutes.strip().isdigit():
        return int(minutes.strip())
    if isinstance(minutes, float) and minutes.is_integer():
        return int(minutes)
    if isinstance(minutes, int) and not isinstance(minutes, bool):
        return minutes
    raise ValueError("minutes must be a whole number")


def points_for(category, minutes, intensity="moderate"):
    """Points for one workout, before the daily cap is applied."""
    minutes = parse_minutes(minutes)
    if minutes < MIN_MINUTES or minutes > MAX_MINUTES:
        raise ValueError(f"minutes must be between {MIN_MINUTES} and {MAX_MINUTES}")
    if intensity not in INTENSITY_MULTIPLIER:
        raise ValueError(f"unknown intensity: {intensity}")

    rate = CATEGORY_RATE.get(normalize_category(category), DEFAULT_RATE)
    return round(rate * minutes * INTENSITY_MULTIPLIER[intensity])


def award_points(points_already_today, earned):
    """Points actually awarded once the daily cap is applied."""
    remaining = DAILY_POINT_CAP - points_already_today
    if remaining <= 0:
        return 0
    return min(earned, remaining)


def is_suspicious(points_already_today, earned, minutes):
    """Flag a log for admin review instead of trusting it outright: an
    unusually long session, or one that pushes the day past the cap."""
    return minutes >= LONG_WORKOUT_MINUTES or points_already_today + earned > DAILY_POINT_CAP
