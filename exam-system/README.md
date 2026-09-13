# 🎓 ExamPortal — Online Examination Management System

A complete, production-oriented online examination platform for educational institutions.

**Stack:** React 18 + Vite · FastAPI · PostgreSQL · SQLAlchemy · JWT · Tailwind CSS

---

## ✨ Features

| Category | Features |
|---|---|
| **Authentication** | JWT auth, role-based access (Admin/Teacher/Student), bcrypt passwords |
| **Student Management** | Add manually or import via CSV/Excel, search, filter, disable/enable |
| **Question Bank** | 500+ questions, difficulty levels, CSV/Excel bulk upload with validation |
| **Smart Exam Engine** | Unique paper per student, randomized options, difficulty distribution |
| **Exam Interface** | Timer, question navigator, mark-for-review, auto-save, auto-submit |
| **Anti-Cheat** | Tab-switch detection, fullscreen monitoring, violation warnings |
| **Results** | Server-side calculation, negative marking, pass/fail, time tracking |
| **Analytics** | Per-question accuracy, score distribution, leaderboard |
| **Export** | Results as CSV, Excel, PDF |
| **Notifications** | In-app notification system for students and teachers |
| **Scheduling** | Exam time windows with server-side enforcement |
| **Security** | CORS, rate limiting, input sanitization, no answer leakage |

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+**
- **Node.js 20+**
- **PostgreSQL 14+** (or Docker for instant setup)

---

### Option A: Docker (Recommended — Easiest)

```bash
# 1. Clone the repository
cd "exam-system"

# 2. Start everything (DB + Backend + Frontend)
docker compose up -d

# 3. Wait ~30 seconds for services to start, then seed the database
docker exec examportal_backend python -m app.utils.seed

# 4. Open the app
open http://localhost:5173
```

That's it! All services start automatically.

---

### Option B: Manual Setup

#### Step 1: PostgreSQL Database

```bash
# Create database and user
psql -U postgres

CREATE USER examuser WITH PASSWORD 'exampass';
CREATE DATABASE examdb OWNER examuser;
GRANT ALL PRIVILEGES ON DATABASE examdb TO examuser;
\q
```

#### Step 2: Backend Setup

```bash
cd exam-system/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate     # macOS/Linux
# venv\Scripts\activate      # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials (see Configuration section)

# Create database tables
python -c "from app.database.connection import create_all_tables; create_all_tables()"

# Seed with test data
python -m app.utils.seed

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

Backend runs at: http://localhost:8000
API Docs (Swagger): http://localhost:8000/docs
API Docs (ReDoc): http://localhost:8000/redoc

#### Step 3: Frontend Setup

```bash
cd exam-system/frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# VITE_API_URL=http://localhost:8000  (default — usually no change needed)

# Start the frontend
npm run dev
```

Frontend runs at: http://localhost:5173

---

## 🔑 Test Accounts

After running the seed script, these accounts are ready:

### Admin Account
| Field | Value |
|---|---|
| Email | `admin@school.com` |
| Password | `Admin@123` |
| Role | Admin |

### Teacher Accounts
| Email | Password |
|---|---|
| `teacher1@school.com` | `Teacher@123` |
| `teacher2@school.com` | `Teacher@123` |

### Student Accounts
| Registration Number | Password | Name |
|---|---|---|
| `STU001` | `Student@123` | Aarav Sharma |
| `STU002` | `Student@123` | Priya Patel |
| `STU003` | `Student@123` | Rohit Kumar |
| `STU004` | `Student@123` | Sneha Gupta |
| `STU005` | `Student@123` | Arjun Singh |
| ... | `Student@123` | (up to STU020) |

---

## ⚙️ Environment Configuration

### Backend: `backend/.env`

```env
# Database
DATABASE_URL=postgresql://examuser:exampass@localhost:5432/examdb

# JWT Security — CHANGE THIS IN PRODUCTION!
SECRET_KEY=your-super-secret-key-change-in-production-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

# First Admin Account (created automatically on startup)
FIRST_ADMIN_EMAIL=admin@school.com
FIRST_ADMIN_PASSWORD=Admin@123

# CORS — comma-separated allowed origins
CORS_ORIGINS=http://localhost:5173
```

### Frontend: `frontend/.env`

```env
VITE_API_URL=http://localhost:8000
```

---

## 📁 Project Structure

```
exam-system/
│
├── docker-compose.yml          # Full stack Docker setup
├── init.sql                    # PostgreSQL initialization
├── sample_questions.csv        # 45 sample questions for upload testing
├── sample_students.csv         # 10 sample students for import testing
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── main.py             # FastAPI app entry point
│       ├── database/
│       │   └── connection.py   # SQLAlchemy setup
│       ├── models/             # ORM models
│       │   ├── user.py
│       │   ├── student.py
│       │   ├── teacher.py
│       │   ├── exam.py
│       │   ├── question.py
│       │   ├── attempt.py
│       │   ├── result.py
│       │   └── notification.py
│       ├── schemas/            # Pydantic schemas
│       │   ├── auth.py
│       │   ├── student.py
│       │   ├── question.py
│       │   ├── exam.py
│       │   ├── attempt.py
│       │   ├── result.py
│       │   └── notification.py
│       ├── routes/             # API routes
│       │   ├── auth.py
│       │   ├── questions.py
│       │   ├── attempts.py
│       │   ├── results.py
│       │   ├── notifications.py
│       │   └── admin/
│       │       ├── students.py
│       │       ├── exams.py
│       │       ├── dashboard.py
│       │       └── analytics.py
│       ├── services/           # Business logic
│       │   ├── auth_service.py
│       │   ├── student_service.py
│       │   ├── question_service.py
│       │   ├── exam_service.py
│       │   ├── paper_generator.py
│       │   ├── result_service.py
│       │   ├── export_service.py
│       │   └── notification_service.py
│       ├── auth/
│       │   ├── hashing.py      # bcrypt
│       │   └── jwt.py          # JWT + dependencies
│       └── utils/
│           ├── seed.py         # Database seeder
│           └── validators.py
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── context/
        │   └── AuthContext.jsx
        ├── services/
        │   └── api.js
        ├── hooks/
        │   ├── useExamTimer.js
        │   ├── useAntiCheat.js
        │   └── useNetworkStatus.js
        ├── layouts/
        │   ├── AdminLayout.jsx
        │   └── StudentLayout.jsx
        ├── components/
        │   ├── ProtectedRoute.jsx
        │   ├── NotificationBell.jsx
        │   └── ui/
        │       ├── Button.jsx
        │       ├── Modal.jsx
        │       ├── Table.jsx
        │       ├── Badge.jsx
        │       ├── Card.jsx
        │       ├── Input.jsx
        │       ├── Select.jsx
        │       ├── Spinner.jsx
        │       ├── SearchInput.jsx
        │       ├── Pagination.jsx
        │       ├── ConfirmDialog.jsx
        │       ├── StatsCard.jsx
        │       ├── EmptyState.jsx
        │       └── LoadingSkeleton.jsx
        └── pages/
            ├── auth/
            │   └── LoginPage.jsx
            ├── admin/
            │   ├── DashboardPage.jsx
            │   ├── StudentsPage.jsx
            │   ├── QuestionsPage.jsx
            │   ├── ExamsPage.jsx
            │   ├── ResultsPage.jsx
            │   └── AnalyticsPage.jsx
            ├── student/
            │   ├── StudentDashboard.jsx
            │   ├── StudentExamsPage.jsx
            │   ├── ExamInstructionsPage.jsx
            │   ├── ExamPage.jsx
            │   ├── StudentResultPage.jsx
            │   └── LeaderboardPage.jsx
            └── NotFoundPage.jsx
```

---

## 📡 API Reference

### Authentication
```
POST   /auth/login          Login (student or teacher)
GET    /auth/me             Get current user info
POST   /auth/logout         Logout
```

### Admin — Students
```
GET    /admin/students                  List all students (search, filter, paginate)
POST   /admin/students                  Create student
GET    /admin/students/{id}             Get student details
PUT    /admin/students/{id}             Update student
PATCH  /admin/students/{id}/toggle      Enable/disable student
DELETE /admin/students/{id}             Delete student
POST   /admin/students/import           Import from CSV/Excel
GET    /admin/students/{id}/performance Student exam performance
```

### Questions
```
GET    /questions                 List questions (filter by subject, topic, difficulty)
POST   /questions                 Create question
GET    /questions/{id}            Get question
PUT    /questions/{id}            Update question
DELETE /questions/{id}            Delete question (soft)
POST   /questions/upload          Upload CSV/Excel (preview + validate)
POST   /questions/upload/confirm  Confirm and import validated questions
```

### Admin — Exams
```
GET    /admin/exams               List exams
POST   /admin/exams               Create exam
GET    /admin/exams/{id}          Get exam details
PUT    /admin/exams/{id}          Update exam (draft/scheduled only)
DELETE /admin/exams/{id}          Delete exam (draft only)
GET    /admin/exams/{id}/attempts All student attempts for an exam
```

### Student — Exams
```
GET    /student/exams                    Available and upcoming exams
GET    /student/exams/{id}/instructions  Exam instructions
POST   /student/exams/{id}/start         Start exam (generates unique paper)
GET    /student/dashboard                Student dashboard data
```

### Exam Attempts
```
GET    /attempts/{id}                Get attempt + paper (no correct answers)
POST   /attempts/{id}/answers        Save one answer
POST   /attempts/{id}/answers/bulk   Save multiple answers
POST   /attempts/{id}/submit         Submit exam
POST   /attempts/{id}/violation      Report anti-cheat violation
```

### Results
```
GET    /results/{attempt_id}         Student result
GET    /admin/results                All results (admin, paginated, filtered)
GET    /admin/results/export         Export results (CSV/Excel/PDF)
```

### Analytics
```
GET    /admin/analytics/{exam_id}               Exam analytics
GET    /admin/analytics/{exam_id}/leaderboard   Leaderboard
```

### Admin Dashboard
```
GET    /admin/dashboard              Dashboard stats and charts data
```

### Notifications
```
GET    /notifications                Get user notifications
PATCH  /notifications/{id}/read      Mark one as read
PATCH  /notifications/read-all       Mark all as read
```

---

## 🔐 Security Features

1. **No Answer Leakage** — Correct answers stored in `paper` JSON in DB; never sent to frontend
2. **Server-Side Scoring** — All marks calculated server-side; client cannot manipulate results
3. **Server-Side Timer** — `server_deadline` computed at exam start; backend validates on submit
4. **JWT Auth** — All protected routes require valid JWT; tokens expire in 8 hours
5. **Role Enforcement** — Students cannot access admin APIs (403 Forbidden)
6. **Password Hashing** — bcrypt with salt rounds
7. **Rate Limiting** — API rate limiting via SlowAPI
8. **Input Sanitization** — All uploaded CSV/Excel data validated before processing
9. **CORS** — Restricted to configured origins
10. **No Duplicate Submissions** — Attempt status prevents re-submission

---

## 📊 Database Schema

```sql
users         → id, email, hashed_password, role, is_active, created_at
students      → id, user_id(FK), reg_number(UNIQUE), name, email, class, section, roll_number
teachers      → id, user_id(FK), name, department, employee_id
exams         → id, teacher_id(FK), title, subject, status, start_time, end_time,
                duration_minutes, total_questions, marks_per_question, negative_marking,
                passing_percentage, difficulty_distribution(JSON), topic_distribution(JSON),
                show_result_immediately, show_correct_answers, show_explanations,
                leaderboard_enabled, max_violations
questions     → id, subject, chapter, topic, difficulty, question_text,
                option_a..d, correct_answer, marks, explanation, created_by(FK), is_active
exam_attempts → id, student_id(FK), exam_id(FK), started_at, submitted_at, status,
                violations_count, paper(JSON), server_deadline
student_answers → id, attempt_id(FK), question_id(FK), selected_option, is_marked_review
results       → id, attempt_id(FK), correct_count, incorrect_count, unanswered_count,
                total_marks, max_marks, percentage, accuracy, passed, time_taken_seconds
notifications → id, user_id(FK), title, message, notification_type, is_read, created_at
```

---

## 📤 CSV Upload Formats

### Questions CSV (`sample_questions.csv`)
```csv
question_text,option_a,option_b,option_c,option_d,correct_answer,subject,chapter,topic,difficulty,marks,explanation
"What is 2+2?","3","4","5","6","B","Math","Arithmetic","Addition","easy","1","2+2=4"
```

**Required columns:** `question_text, option_a, option_b, option_c, option_d, correct_answer, subject, difficulty`  
**Optional columns:** `chapter, topic, marks, explanation`  
**correct_answer:** Must be `A`, `B`, `C`, or `D` (case-insensitive)

### Students CSV (`sample_students.csv`)
```csv
registration_number,name,email,password,class,section,roll_number,phone
STU001,John Doe,john@email.com,Student@123,12,A,1,9876543210
```

**Required columns:** `registration_number, name, password`  
**Optional columns:** `email, class, section, roll_number, phone`

---

## 🚢 Production Deployment

### Environment Variables to Change for Production

```env
# backend/.env
SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_hex(32))">
DATABASE_URL=postgresql://user:password@your-db-host:5432/examdb
CORS_ORIGINS=https://yourdomain.com
FIRST_ADMIN_PASSWORD=<strong-password>
ACCESS_TOKEN_EXPIRE_MINUTES=60  # Reduce for production
```

### Deploy with Docker

```bash
# Build production images
docker compose -f docker-compose.prod.yml up -d

# Or deploy individually to your cloud provider
# Backend: any Python WSGI/ASGI host (Railway, Render, AWS ECS, etc.)
# Frontend: Netlify, Vercel, or serve build output with nginx
# Database: Managed PostgreSQL (Neon, Supabase, AWS RDS, etc.)
```

### Build Frontend for Production

```bash
cd frontend
npm run build
# dist/ folder contains the production build
# Serve with: nginx, Vercel, Netlify, etc.
```

### Backend with Gunicorn (Production)

```bash
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

---

## 🧪 Running Tests

```bash
cd backend

# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html
```

---

## 🐛 Troubleshooting

### "Connection refused" on database
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# With Docker:
docker compose ps
docker compose logs db
```

### "Module not found" errors
```bash
# Ensure virtual environment is activated
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend can't reach backend (CORS error)
```bash
# Check CORS_ORIGINS in backend .env
CORS_ORIGINS=http://localhost:5173

# Restart backend after changing .env
uvicorn app.main:app --reload
```

### JWT token errors
```bash
# Ensure SECRET_KEY is set and not empty in .env
# Token expires after ACCESS_TOKEN_EXPIRE_MINUTES — try logging in again
```

---

## 📋 Anti-Cheat Notice

> ⚠️ **Browser-based anti-cheat provides limited protection.** The implemented controls (tab-switch detection, window focus monitoring, fullscreen exit detection) can only provide basic monitoring. Determined students can bypass browser-based controls. For high-stakes examinations, consider additional supervision measures.

---

## 📄 License

MIT License — Free for educational and commercial use.

---

**Built with ❤️ for educational institutions**
