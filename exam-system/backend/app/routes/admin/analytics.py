"""
Admin Analytics routes — per-exam statistics and leaderboard.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import statistics

from app.database.connection import get_db
from app.auth.jwt import require_admin
from app.models.user import User
from app.models.exam import Exam
from app.models.attempt import ExamAttempt, StudentAnswer
from app.models.result import Result

router = APIRouter()


@router.get("/{exam_id}")
def exam_analytics(
    exam_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    attempts = (
        db.query(ExamAttempt)
        .filter(ExamAttempt.exam_id == exam_id, ExamAttempt.status.in_(["submitted", "timed_out"]))
        .all()
    )

    if not attempts:
        return {
            "exam_title": exam.title,
            "total_attempts": 0,
            "avg_score": 0,
            "highest_score": 0,
            "lowest_score": 0,
            "median_score": 0,
            "pass_rate": 0,
            "avg_time_minutes": 0,
            "question_analytics": [],
        }

    results = [a.result for a in attempts if a.result]
    percentages = [r.percentage for r in results]
    times = [r.time_taken_seconds for r in results]

    avg_score = round(sum(percentages) / len(percentages), 2) if percentages else 0
    highest = round(max(percentages), 2) if percentages else 0
    lowest = round(min(percentages), 2) if percentages else 0
    median = round(statistics.median(percentages), 2) if percentages else 0
    pass_count = sum(1 for r in results if r.passed)
    pass_rate = round(pass_count / len(results) * 100, 2) if results else 0
    avg_time = round(sum(times) / len(times) / 60, 1) if times else 0

    # Per-question analytics
    total_submitted = len(attempts)
    question_analytics = []

    if attempts and attempts[0].paper:
        sample_paper = attempts[0].paper
        for item in sample_paper:
            q_id = item["question_id"]
            correct_mapped = item["correct_mapped"]
            q_text = item["question_text"][:100]

            correct_c = 0
            incorrect_c = 0
            unanswered_c = 0

            for attempt in attempts:
                answers_map = {a.question_id: a.selected_option for a in attempt.answers}
                selected = answers_map.get(q_id)
                if selected is None or selected == "":
                    unanswered_c += 1
                elif selected == correct_mapped:
                    correct_c += 1
                else:
                    incorrect_c += 1

            question_analytics.append({
                "question_id": q_id,
                "question_text": q_text,
                "correct_pct": round(correct_c / total_submitted * 100, 1),
                "incorrect_pct": round(incorrect_c / total_submitted * 100, 1),
                "unanswered_pct": round(unanswered_c / total_submitted * 100, 1),
            })

        # Sort by correct_pct ascending (hardest first)
        question_analytics.sort(key=lambda x: x["correct_pct"])

    return {
        "exam_title": exam.title,
        "total_attempts": total_submitted,
        "avg_score": avg_score,
        "highest_score": highest,
        "lowest_score": lowest,
        "median_score": median,
        "pass_rate": pass_rate,
        "avg_time_minutes": avg_time,
        "question_analytics": question_analytics,
    }


@router.get("/{exam_id}/leaderboard")
def exam_leaderboard(
    exam_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    attempts = (
        db.query(ExamAttempt)
        .filter(ExamAttempt.exam_id == exam_id, ExamAttempt.status.in_(["submitted", "timed_out"]))
        .all()
    )

    leaderboard = []
    for attempt in attempts:
        if attempt.result:
            leaderboard.append({
                "student_name": attempt.student.name if attempt.student else "Unknown",
                "reg_number": attempt.student.reg_number if attempt.student else "",
                "total_marks": attempt.result.total_marks,
                "max_marks": attempt.result.max_marks,
                "percentage": attempt.result.percentage,
                "time_taken_seconds": attempt.result.time_taken_seconds,
                "passed": attempt.result.passed,
            })

    leaderboard.sort(key=lambda x: (-x["total_marks"], x["time_taken_seconds"]))
    for idx, entry in enumerate(leaderboard):
        entry["rank"] = idx + 1

    return {"exam_title": exam.title, "leaderboard": leaderboard}
