Updating your database

After you pull, run these from backend/djangoserver with your virtual environment active:

python manage.py migrate
python manage.py seed_exercises
migrate applies new migrations (changes to the tables). Run it any time someone adds a file to a migrations folder, or you'll get errors like no such table or no such column.
seed_exercises adds the 876 Free Exercise DB exercises to the Exercise table. (Can run multiple times without issue

If you get No module named 'corsheaders', run pip install django-cors-headers
