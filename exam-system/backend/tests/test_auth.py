import unittest
from app.auth.hashing import hash_password, verify_password
from app.auth.jwt import create_access_token, verify_token


class TestAuth(unittest.TestCase):
    def test_password_hashing(self):
        raw = "MySecurePassword@123"
        hashed = hash_password(raw)
        self.assertNotEqual(hashed, raw)
        self.assertTrue(verify_password(raw, hashed))
        self.assertFalse(verify_password("WrongPassword", hashed))

    def test_jwt_token_generation_and_decode(self):
        data = {"sub": "user@example.com", "role": "student", "user_id": 42}
        token = create_access_token(data)
        self.assertIsInstance(token, str)
        self.assertGreater(len(token), 20)

        payload = verify_token(token)
        self.assertEqual(payload["sub"], "user@example.com")
        self.assertEqual(payload["role"], "student")
        self.assertEqual(payload["user_id"], 42)
        self.assertIn("exp", payload)


if __name__ == "__main__":
    unittest.main()
