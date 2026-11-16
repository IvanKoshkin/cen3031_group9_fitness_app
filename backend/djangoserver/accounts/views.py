import json

from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

# our proposal says sign-up is for UF students, so only UF emails can register
ALLOWED_EMAIL_DOMAIN = "ufl.edu"


def read_json(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return None
    return data if isinstance(data, dict) else None


# JSON null or a number would otherwise turn into text like "None"
def text(data, key):
    value = data.get(key)
    return value if isinstance(value, str) else ""


# create an account and log the new user in
# csrf_exempt on these views because the app has no CSRF token before it logs in
@csrf_exempt
@require_POST
def register(request):
    data = read_json(request)
    if data is None:
        return JsonResponse({"detail": "Send the sign-up form as JSON."}, status=400)

    username = text(data, "username").strip()
    display_name = text(data, "displayName").strip()
    email = text(data, "email").strip().lower()
    password = text(data, "password")
    if not (username and display_name and email and password):
        return JsonResponse({"detail": "Fill in every field."}, status=400)

    User = get_user_model()
    if User.objects.filter(username__iexact=username).exists():
        return JsonResponse({"detail": "That username is already taken."}, status=400)
    if not email.endswith("@" + ALLOWED_EMAIL_DOMAIN):
        return JsonResponse({"detail": f"Use your @{ALLOWED_EMAIL_DOMAIN} email."}, status=400)
    if User.objects.filter(email__iexact=email).exists():
        return JsonResponse({"detail": "An account with that email already exists."}, status=400)

    # no profile model yet, so the display name is kept in first_name for now
    user = User(username=username, email=email, first_name=display_name)
    try:
        user.full_clean(exclude=["password"])
        validate_password(password, user)
    except ValidationError as error:
        return JsonResponse({"detail": " ".join(error.messages)}, status=400)

    user.set_password(password)
    user.save()
    login(request, user)
    return JsonResponse({"userId": user.id}, status=201)


@csrf_exempt
@require_POST
def log_in(request):
    data = read_json(request)
    if data is None:
        return JsonResponse({"detail": "Send your username and password as JSON."}, status=400)

    user = authenticate(
        request,
        username=text(data, "username").strip(),
        password=text(data, "password"),
    )
    if user is None:
        return JsonResponse({"detail": "Incorrect username or password."}, status=400)
    login(request, user)
    return JsonResponse({"userId": user.id})


@csrf_exempt
@require_POST
def log_out(request):
    logout(request)
    return JsonResponse({})
