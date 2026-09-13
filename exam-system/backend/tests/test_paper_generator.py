import unittest
from app.models.question import Question
from app.services.paper_generator import _shuffle_options, strip_correct_answers


class TestPaperGenerator(unittest.TestCase):
    def test_shuffle_options_mapping(self):
        q = Question(
            id=1,
            question_text="What is the acceleration due to gravity?",
            option_a="8.9 m/s²",
            option_b="9.8 m/s²",
            option_c="10.8 m/s²",
            option_d="7.8 m/s²",
            correct_answer="B",  # "9.8 m/s²"
        )

        display_options, correct_mapped = _shuffle_options(q)

        # 4 distinct options must exist in the shuffled result
        self.assertEqual(len(display_options), 4)
        self.assertEqual(set(display_options.keys()), {"A", "B", "C", "D"})
        # The mapped correct option must point to the original correct text "9.8 m/s²"
        self.assertEqual(display_options[correct_mapped], "9.8 m/s²")

    def test_strip_correct_answers(self):
        paper = [
            {
                "question_id": 10,
                "question_text": "Sample Question",
                "options": {"A": "1", "B": "2", "C": "3", "D": "4"},
                "correct_mapped": "C",
            }
        ]

        safe_paper = strip_correct_answers(paper)
        self.assertEqual(len(safe_paper), 1)
        self.assertNotIn("correct_mapped", safe_paper[0])
        self.assertEqual(safe_paper[0]["question_id"], 10)
        self.assertEqual(safe_paper[0]["options"], {"A": "1", "B": "2", "C": "3", "D": "4"})


if __name__ == "__main__":
    unittest.main()
