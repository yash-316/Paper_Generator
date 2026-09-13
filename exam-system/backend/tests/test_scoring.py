import unittest
from datetime import datetime, timedelta
from unittest.mock import MagicMock
from app.services.result_service import calculate_result
from app.models.attempt import ExamAttempt, StudentAnswer
from app.models.exam import Exam


class TestScoring(unittest.TestCase):
    def test_calculate_result_scoring_logic(self):
        # 10 questions, 4 marks each, 1 negative mark, 40% passing
        exam = Exam(
            id=1,
            marks_per_question=4.0,
            negative_marking=1.0,
            passing_percentage=40.0,
        )

        paper = [
            {"question_id": i, "question_text": f"Q{i}", "correct_mapped": "A", "options": {}}
            for i in range(1, 11)
        ]

        # Student answers:
        # Q1-Q7: Correct ("A") => 7 correct * 4 = 28
        # Q8-Q9: Incorrect ("B") => 2 incorrect * -1 = -2
        # Q10: Unanswered (None) => 0
        # Expected Total: 28 - 2 = 26 marks out of 40 (65%) -> PASSED
        answers = [
            StudentAnswer(question_id=1, selected_option="A"),
            StudentAnswer(question_id=2, selected_option="A"),
            StudentAnswer(question_id=3, selected_option="A"),
            StudentAnswer(question_id=4, selected_option="A"),
            StudentAnswer(question_id=5, selected_option="A"),
            StudentAnswer(question_id=6, selected_option="A"),
            StudentAnswer(question_id=7, selected_option="A"),
            StudentAnswer(question_id=8, selected_option="B"),
            StudentAnswer(question_id=9, selected_option="B"),
        ]

        started_at = datetime.utcnow() - timedelta(minutes=25)
        submitted_at = datetime.utcnow()

        attempt = ExamAttempt(
            id=101,
            exam=exam,
            paper=paper,
            answers=answers,
            started_at=started_at,
            submitted_at=submitted_at,
        )

        db_mock = MagicMock()
        # Query Result returns None (no existing result)
        db_mock.query().filter().first.return_value = None

        result = calculate_result(db_mock, attempt)

        self.assertEqual(result.correct_count, 7)
        self.assertEqual(result.incorrect_count, 2)
        self.assertEqual(result.unanswered_count, 1)
        self.assertEqual(result.total_marks, 26.0)
        self.assertEqual(result.max_marks, 40.0)
        self.assertEqual(result.percentage, 65.0)
        self.assertEqual(round(result.accuracy, 2), 77.78)  # 7 / (7+2) = 77.78%
        self.assertTrue(result.passed)
        self.assertGreaterEqual(result.time_taken_seconds, 1400)


if __name__ == "__main__":
    unittest.main()
