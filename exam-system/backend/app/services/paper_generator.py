"""
Paper generator — creates a unique, randomized exam paper per student.

SECURITY: correct_mapped is stored in the DB paper JSON but NEVER sent to the frontend.
"""
import random
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.exam import Exam
from app.models.question import Question


def _shuffle_options(question: Question) -> dict:
    """
    Shuffle options A/B/C/D and return:
    - display_options: {A: text, B: text, C: text, D: text} (shuffled)
    - correct_mapped: the NEW letter that corresponds to the correct answer after shuffle
    """
    original = {
        "A": question.option_a,
        "B": question.option_b,
        "C": question.option_c,
        "D": question.option_d,
    }
    original_correct_text = original[question.correct_answer]

    letters = ["A", "B", "C", "D"]
    texts = [original[l] for l in letters]
    random.shuffle(texts)

    display_options = dict(zip(letters, texts))
    # Find which letter now maps to the correct answer
    correct_mapped = next(l for l, t in display_options.items() if t == original_correct_text)

    return display_options, correct_mapped


def generate_paper(db: Session, exam: Exam) -> list[dict]:
    """
    Generate a unique paper for a student based on exam configuration.

    Returns a list of paper items:
    {
        question_id: int,
        question_text: str,
        options: {A: str, B: str, C: str, D: str},
        correct_mapped: str   ← stored in DB, NEVER sent to frontend
    }
    """
    base_query = db.query(Question).filter(
        Question.is_active == True,
        Question.subject.ilike(f"%{exam.subject}%")
    )

    selected: list[Question] = []

    if exam.difficulty_distribution:
        # Difficulty-based distribution e.g. {easy: 20, medium: 20, hard: 10}
        dist: dict = exam.difficulty_distribution
        for difficulty, count in dist.items():
            pool = base_query.filter(Question.difficulty == difficulty.lower()).all()
            if len(pool) < count:
                # Not enough — take what we have
                selected.extend(pool)
            else:
                selected.extend(random.sample(pool, count))

        # If we still need more to meet total_questions, fill from any difficulty
        if len(selected) < exam.total_questions:
            used_ids = {q.id for q in selected}
            remaining_pool = base_query.filter(~Question.id.in_(used_ids)).all()
            needed = exam.total_questions - len(selected)
            if remaining_pool:
                selected.extend(random.sample(remaining_pool, min(needed, len(remaining_pool))))

    elif exam.topic_distribution:
        # Topic-based distribution e.g. {Mechanics: 10, Thermodynamics: 10}
        dist: dict = exam.topic_distribution
        for topic, count in dist.items():
            pool = base_query.filter(Question.topic.ilike(f"%{topic}%")).all()
            if len(pool) < count:
                selected.extend(pool)
            else:
                selected.extend(random.sample(pool, count))

    else:
        # Pure random selection
        pool = base_query.all()
        n = min(exam.total_questions, len(pool))
        if n == 0:
            raise HTTPException(
                status_code=422,
                detail=f"No questions found for subject '{exam.subject}'. Please add questions first."
            )
        selected = random.sample(pool, n)

    if not selected:
        raise HTTPException(
            status_code=422,
            detail=f"Not enough questions available for exam '{exam.title}'. Please add more questions."
        )

    # Shuffle the order of questions
    random.shuffle(selected)

    paper = []
    for question in selected:
        display_options, correct_mapped = _shuffle_options(question)
        paper.append({
            "question_id": question.id,
            "question_text": question.question_text,
            "options": display_options,
            "correct_mapped": correct_mapped,  # STORED IN DB — never sent to frontend
        })

    return paper


def strip_correct_answers(paper: list[dict]) -> list[dict]:
    """Remove correct_mapped from paper before sending to frontend."""
    return [
        {
            "question_id": item["question_id"],
            "question_text": item["question_text"],
            "options": item["options"],
        }
        for item in paper
    ]
