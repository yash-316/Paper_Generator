"""
Result service — server-side scoring engine.
"""
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.attempt import ExamAttempt, StudentAnswer
from app.models.result import Result
from app.models.exam import Exam


def calculate_result(db: Session, attempt: ExamAttempt) -> Result:
    """
    Calculate exam result from the stored paper (with correct_mapped) and student answers.
    All scoring is done server-side — client marks are never trusted.
    """
    # Check if result already exists
    existing = db.query(Result).filter(Result.attempt_id == attempt.id).first()
    if existing:
        return existing

    exam: Exam = attempt.exam
    paper: list[dict] = attempt.paper  # includes correct_mapped

    # Build lookup: question_id → selected_option
    answers: dict[int, str | None] = {}
    for ans in attempt.answers:
        answers[ans.question_id] = ans.selected_option

    correct_count = 0
    incorrect_count = 0
    unanswered_count = 0

    for item in paper:
        q_id = item["question_id"]
        correct_mapped = item["correct_mapped"]
        selected = answers.get(q_id)

        if selected is None or selected == "":
            unanswered_count += 1
        elif selected == correct_mapped:
            correct_count += 1
        else:
            incorrect_count += 1

    marks_per_q = exam.marks_per_question
    negative = exam.negative_marking

    total_marks = (correct_count * marks_per_q) - (incorrect_count * negative)
    total_marks = max(0.0, total_marks)  # floor at 0
    max_marks = len(paper) * marks_per_q
    percentage = (total_marks / max_marks * 100) if max_marks > 0 else 0.0
    attempted = correct_count + incorrect_count
    accuracy = (correct_count / attempted * 100) if attempted > 0 else 0.0
    passed = percentage >= exam.passing_percentage

    submitted_at = attempt.submitted_at or datetime.utcnow()
    time_taken = int((submitted_at - attempt.started_at).total_seconds())

    result = Result(
        attempt_id=attempt.id,
        correct_count=correct_count,
        incorrect_count=incorrect_count,
        unanswered_count=unanswered_count,
        total_marks=round(total_marks, 2),
        max_marks=round(max_marks, 2),
        percentage=round(percentage, 2),
        accuracy=round(accuracy, 2),
        passed=passed,
        time_taken_seconds=max(0, time_taken),
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result


def get_answer_review(attempt: ExamAttempt) -> list[dict]:
    """
    Build per-question review data. Includes correct answer and student answer.
    Called only when show_correct_answers=True.
    """
    answers: dict[int, StudentAnswer] = {a.question_id: a for a in attempt.answers}
    review = []

    for item in attempt.paper:
        q_id = item["question_id"]
        ans = answers.get(q_id)
        selected = ans.selected_option if ans else None
        correct = item["correct_mapped"]
        options = item["options"]

        review.append({
            "question_id": q_id,
            "question_text": item["question_text"],
            "options": options,
            "selected_option": selected,
            "correct_option": correct,
            "is_correct": selected == correct,
        })

    return review
