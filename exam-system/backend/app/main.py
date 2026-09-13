"""
FastAPI application entry point.
"""
import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

load_dotenv()

# ---------------------------------------------------------------------------
# Rate limiter
# ---------------------------------------------------------------------------
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

# ---------------------------------------------------------------------------
# Lifespan — runs on startup / shutdown
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables and bootstrap admin
    from app.database.connection import create_all_tables, SessionLocal
    from app.services.auth_service import create_admin_if_not_exists
    from app.services.exam_service import update_exam_statuses

    create_all_tables()
    db = SessionLocal()
    try:
        create_admin_if_not_exists(db)
        update_exam_statuses(db)
    finally:
        db.close()
    yield


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------
app = FastAPI(
    title="ExamPortal API",
    description="Online Examination Management System",
    version="1.0.0",
    lifespan=lifespan,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
cors_origins_raw = os.getenv("CORS_ORIGINS", "http://localhost:5173")
cors_origins = [o.strip() for o in cors_origins_raw.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
from app.routes.auth import router as auth_router
from app.routes.questions import router as questions_router
from app.routes.attempts import router as attempts_router
from app.routes.results import router as results_router
from app.routes.notifications import router as notifications_router
from app.routes.admin.students import router as admin_students_router
from app.routes.admin.exams import router as admin_exams_router
from app.routes.admin.analytics import router as admin_analytics_router
from app.routes.admin.dashboard import router as admin_dashboard_router
from app.routes.student.exams import router as student_exams_router

app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(admin_students_router, prefix="/admin/students", tags=["Admin - Students"])
app.include_router(admin_exams_router, prefix="/admin/exams", tags=["Admin - Exams"])
app.include_router(admin_analytics_router, prefix="/admin/analytics", tags=["Admin - Analytics"])
app.include_router(admin_dashboard_router, prefix="/admin/dashboard", tags=["Admin - Dashboard"])
app.include_router(questions_router, prefix="/questions", tags=["Questions"])
app.include_router(student_exams_router, prefix="/student", tags=["Student"])
app.include_router(attempts_router, prefix="/attempts", tags=["Attempts"])
app.include_router(results_router, tags=["Results"])
app.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "ExamPortal API"}


# ---------------------------------------------------------------------------
# Global exception handlers
# ---------------------------------------------------------------------------
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(status_code=404, content={"detail": "Resource not found"})


@app.exception_handler(500)
async def server_error_handler(request: Request, exc):
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
