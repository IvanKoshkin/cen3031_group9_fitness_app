# loads the exercises in data/free_exercise_db.json into the Exercise table
# run it with: python manage.py seed_exercises
# safe to run again, exercises already in the table get skipped

import json
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction

from leaderboard.models import Exercise

# points to leaderboard/data/free_exercise_db.json
DATA_FILE = Path(__file__).resolve().parents[2] / "data" / "free_exercise_db.json"


class Command(BaseCommand):
    help = "Adds the Free Exercise DB exercises to the Exercise table"

    def handle(self, *args, **options):
        with open(DATA_FILE, encoding="utf-8") as f:
            exercises = json.load(f)["exercises"]

        # lowercase so "Running" and "running" count as the same exercise
        names_in_table = Exercise.objects.values_list("exercise_name", flat=True)
        existing_names = {name.lower() for name in names_in_table}

        added = 0
        # one transaction: faster, and if it crashes halfway nothing gets saved
        with transaction.atomic():
            for exercise in exercises:
                name = exercise["name"]
                if name.lower() in existing_names:
                    continue
                Exercise.objects.create(exercise_name=name, category=exercise["category"])
                existing_names.add(name.lower())
                added += 1

        skipped = len(exercises) - added
        message = f"Added {added} exercises, skipped {skipped} that were already there"
        self.stdout.write(self.style.SUCCESS(message))
