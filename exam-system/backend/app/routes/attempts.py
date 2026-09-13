"""
Attempts routes — get paper, save answers, submit, report violations.
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.auth.jwt import require_student
from app.models.user import User
from app.models.student import Student
from app.models.attempt import ExamAttempt, StudentAnswer
from app.services.paper_generator import strip_correct_answers
from app.services.result_service import calculate_result
from app.services.notification_service import notify_teacher_submission

router = APIRouter()


def _get_attempt(db: Session, attempt_id: int, user: User) -> ExamAttempt:
    student = db.query(Student).filter(Student.user_id == user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    attempt = db.query(ExamAttempt).filter(ExamAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    if attempt.student_id != student.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return attempt


@router.get("/{attempt_id}")
def get_attempt(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    attempt = _get_attempt(db, attempt_id, current_user)

    # Calculate time remaining
    now = datetime.utcnow()
    time_remaining = max(0, int((attempt.server_deadline - now).total_seconds()))

    # Build answers map
    answers_map = {a.question_id: {"selected": a.selected_option, "marked": a.is_marked_review}
                   for a in attempt.answers}

    # Strip correct answers from paper before sending
    safe_paper = strip_correct_answers(attempt.paper)

    # Annotate with current answer state
    for item in safe_paper:
        q_id = item["question_id"]
        ans = answers_map.get(q_id, {})
        item["selected_option"] = ans.get("selected")
        item["is_marked_review"] = ans.get("marked", False)

    return {
        "attempt_id": attempt.id,
        "exam_id": attempt.exam_id,
        "exam_title": attempt.exam.title if attempt.exam else "",
        "exam_subject": attempt.exam.subject if attempt.exam else "",
        "status": attempt.status,
        "started_at": attempt.started_at.isoformat(),
        "server_deadline": attempt.server_deadline.isoformat(),
        "time_remaining_seconds": time_remaining,
        "violations_count": attempt.violations_count,
        "max_violations": attempt.exam.max_violations if attempt.exam else 3,
        "paper": safe_paper,
        "total_questions": len(safe_paper),
    }


@router.post("/{attempt_id}/answers")
def save_answer(
    attempt_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    attempt = _get_attempt(db, attempt_id, current_user)
    if attempt.status in ("submitted", "timed_out"):
        raise HTTPException(status_code=400, detail="Exam already submitted")

    question_id = payload.get("question_id")
    selected_option = payload.get("selected_option")
    is_marked_review = payload.get("is_marked_review", False)

    if not question_id:
        raise HTTPException(status_code=400, detail="question_id is required")

    # Upsert answer
    existing = db.query(StudentAnswer).filter(
        StudentAnswer.attempt_id == attempt_id,
        StudentAnswer.question_id == question_id,
    ).first()

    if existing:
        existing.selected_option = selected_option
        existing.is_marked_review = is_marked_review
        existing.answered_at = datetime.utcnow()
    else:
        answer = StudentAnswer(
            attempt_id=attempt_id,
            question_id=question_id,
            selected_option=selected_option,
            is_marked_review=is_marked_review,
        )
        db.add(answer)

    db.commit()
    return {"saved": True}


@router.post("/{attempt_id}/answers/bulk")
def save_answers_bulk(
    attempt_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    attempt = _get_attempt(db, attempt_id, current_user)
    if attempt.status in ("submitted", "timed_out"):
        return {"saved": 0, "skipped": True}

    answers = payload.get("answers", [])
    saved = 0

    for ans_data in answers:
        q_id = ans_data.get("question_id")
        if not q_id:
            continue
        existing = db.query(StudentAnswer).filter(
            StudentAnswer.attempt_id == attempt_id,
            StudentAnswer.question_id == q_id,
        ).first()
        if existing:
            existing.selected_option = ans_data.get("selected_option")
            existing.is_marked_review = ans_data.get("is_marked_review", False)
            existing.answered_at = datetime.utcnow()
        else:
            db.add(StudentAnswer(
                attempt_id=attempt_id,
                question_id=q_id,
                selected_option=ans_data.get("selected_option"),
                is_marked_review=ans_data.get("is_marked_review", False),
            ))
        saved += 1

    db.commit()
    return {"saved": saved}


@router.post("/{attempt_id}/submit")
def submit_exam(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    attempt = _get_attempt(db, attempt_id, current_user)

    if attempt.status in ("submitted", "timed_out"):
        # Return existing result
        result = attempt.result
        if result:
            return _result_response(attempt, result)
        raise HTTPException(status_code=400, detail="Exam already submitted")

    now = datetime.utcnow()
    timed_out = now > attempt.server_deadline
    attempt.submitted_at = now
    attempt.status = "timed_out" if timed_out else "submitted"
    db.commit()

    result = calculate_result(db, attempt)

    # Notify teacher
    try:
        notify_teacher_submission(db, attempt.exam, attempt.student.name)
    except Exception:
        pass  # Non-critical

    return _result_response(attempt, result)


@router.post("/{attempt_id}/violation")
def report_violation(
    attempt_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    attempt = _get_attempt(db, attempt_id, current_user)
    if attempt.status in ("submitted", "timed_out"):
        return {"auto_submitted": False}

    violation_type = payload.get("violation_type", "tab_switch")
    attempt.violations_count += 1
    db.commit()

    max_v = attempt.exam.max_violations if attempt.exam else 3
    if attempt.violations_count >= max_v:
        # Auto-submit
        now = datetime.utcnow()
        attempt.submitted_at = now
        attempt.status = "flagged"
        db.commit()
        calculate_result(db, attempt)
        return {
            "violations_count": attempt.violations_count,
            "auto_submitted": True,
            "message": "You have been auto-submitted due to repeated violations.",
        }

    return {
        "violations_count": attempt.violations_count,
        "max_violations": max_v,
        "auto_submitted": False,
        "message": f"Warning {attempt.violations_count}/{max_v}: {_violation_message(violation_type)}",
    }


def _violation_message(vtype: str) -> str:
    messages = {
        "tab_switch": "You switched away from the examination window.",
        "window_blur": "You moved focus away from the exam.",
        "fullscreen_exit": "You exited fullscreen mode.",
    }
    return messages.get(vtype, "Suspicious activity detected.")


def _result_response(attempt: ExamAttempt, result) -> dict:
    exam = attempt.exam
    return {
        "attempt_id": attempt.id,
        "exam_id": attempt.exam_id,
        "exam_title": exam.title if exam else "",
        "status": attempt.status,
        "show_result": exam.show_result_immediately if exam else True,
        "result": {
            "correct_count": result.correct_count,
            "incorrect_count": result.incorrect_count,
            "unanswered_count": result.unanswered_count,
            "total_marks": result.total_marks,
            "max_marks": result.max_marks,
            "percentage": result.percentage,
            "accuracy": result.accuracy,
            "passed": result.passed,
            "time_taken_seconds": result.time_taken_seconds,
        } if exam and exam.show_result_immediately else None,
    }
