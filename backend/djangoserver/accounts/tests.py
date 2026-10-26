from django.contrib.auth import get_user_model
from django.test import TestCase

GOOD_SIGN_UP = {
    "username": "ana",
    "displayName": "Ana Ruiz",
    "email": "ana@ufl.edu",
    "password": "lift-heavy-2026",
}


class RegisterTests(TestCase):
    def sign_up(self, **changes):
        body = {**GOOD_SIGN_UP, **changes}
        return self.client.post("/api/auth/register/", body, content_type="application/json")

    def test_signing_up_creates_the_account_and_logs_you_in(self):
        response = self.sign_up()
        self.assertEqual(response.status_code, 201)
        user = get_user_model().objects.get(username="ana")
        self.assertEqual(response.json(), {"userId": user.id})
        self.assertEqual(user.first_name, "Ana Ruiz")
        self.assertEqual(self.client.session["_auth_user_id"], str(user.id))

    def test_the_password_is_stored_hashed_not_as_plain_text(self):
        self.sign_up()
        user = get_user_model().objects.get(username="ana")
        self.assertNotEqual(user.password, "lift-heavy-2026")
        self.assertTrue(user.check_password("lift-heavy-2026"))

    def test_a_taken_username_is_rejected_even_with_different_capitals(self):
        self.sign_up()
        response = self.sign_up(username="ANA", email="other@ufl.edu")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "That username is already taken.")

    def test_only_ufl_emails_can_sign_up(self):
        response = self.sign_up(email="ana@gmail.com")
        self.assertEqual(response.status_code, 400)
        self.assertIn("@ufl.edu", response.json()["detail"])

    def test_an_email_already_in_use_is_rejected(self):
        self.sign_up()
        response = self.sign_up(username="ana2", email="ANA@ufl.edu")
        self.assertEqual(response.status_code, 400)

    def test_weak_passwords_are_rejected(self):
        for weak in ["short", "password123", "12345678901"]:
            with self.subTest(password=weak):
                self.assertEqual(self.sign_up(password=weak).status_code, 400)
        self.assertEqual(get_user_model().objects.count(), 0)

    def test_missing_fields_are_rejected(self):
        for field in GOOD_SIGN_UP:
            with self.subTest(missing=field):
                self.assertEqual(self.sign_up(**{field: ""}).status_code, 400)

    def test_null_fields_are_treated_as_missing(self):
        # JSON null shouldn't turn into the text "None"
        for field in ["username", "displayName", "email", "password"]:
            with self.subTest(null=field):
                self.assertEqual(self.sign_up(**{field: None}).status_code, 400)
        self.assertEqual(get_user_model().objects.count(), 0)

    def test_a_username_with_invalid_characters_is_rejected(self):
        self.assertEqual(self.sign_up(username="ana ruiz!").status_code, 400)

    def test_a_body_that_isnt_json_is_rejected(self):
        response = self.client.post("/api/auth/register/", "nope", content_type="application/json")
        self.assertEqual(response.status_code, 400)

    def test_only_post_is_allowed(self):
        self.assertEqual(self.client.get("/api/auth/register/").status_code, 405)


class LoginLogoutTests(TestCase):
    def setUp(self):
        self.ana = get_user_model().objects.create_user("ana", password="lift-heavy-2026")

    def log_in(self, username, password):
        body = {"username": username, "password": password}
        return self.client.post("/api/auth/login/", body, content_type="application/json")

    def test_the_right_password_logs_you_in(self):
        response = self.log_in("ana", "lift-heavy-2026")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"userId": self.ana.id})
        self.assertEqual(self.client.session["_auth_user_id"], str(self.ana.id))

    def test_the_wrong_password_is_rejected_without_saying_which_part_was_wrong(self):
        for username, password in [("ana", "wrong-password"), ("nobody", "lift-heavy-2026")]:
            with self.subTest(username=username):
                response = self.log_in(username, password)
                self.assertEqual(response.status_code, 400)
                self.assertEqual(response.json()["detail"], "Incorrect username or password.")

    def test_logging_out_ends_the_session(self):
        self.log_in("ana", "lift-heavy-2026")
        response = self.client.post("/api/auth/logout/")
        self.assertEqual(response.status_code, 200)
        self.assertNotIn("_auth_user_id", self.client.session)
