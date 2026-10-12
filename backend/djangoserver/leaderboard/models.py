from django.db import models

# Create your models here.
class Exercise(models.Model):
    exercise_name = models.CharField(max_length = 50) #arbitrary max length
    points = models.IntegerField(default = 0)

    def __str__(self):
        return self.exercise_name
    
