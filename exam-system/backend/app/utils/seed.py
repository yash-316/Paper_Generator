"""
Database seeder — creates test accounts and sample data.

Run with:
    python -m app.utils.seed
"""
import os
import sys
from datetime import datetime, timedelta

# Ensure we can import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from dotenv import load_dotenv
load_dotenv()

from app.database.connection import SessionLocal, create_all_tables
from app.auth.hashing import hash_password
from app.models.user import User
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.question import Question
from app.models.exam import Exam


def seed():
    create_all_tables()
    db = SessionLocal()
    print("🌱 Seeding database...")

    # --- Admin ---
    admin_email = os.getenv("FIRST_ADMIN_EMAIL", "admin@school.com")
    admin_pass = os.getenv("FIRST_ADMIN_PASSWORD", "Admin@123")
    if not db.query(User).filter(User.email == admin_email).first():
        admin = User(email=admin_email, hashed_password=hash_password(admin_pass), role="admin", is_active=True)
        db.add(admin)
        db.commit()
        print(f"  ✅ Admin: {admin_email} / {admin_pass}")
    else:
        print(f"  ⏩ Admin already exists: {admin_email}")

    # --- Teachers ---
    teachers_data = [
        ("teacher1@school.com", "Teacher@123", "Dr. Rajesh Kumar", "Physics"),
        ("teacher2@school.com", "Teacher@123", "Prof. Anita Singh", "Chemistry"),
    ]
    for email, pwd, name, dept in teachers_data:
        if not db.query(User).filter(User.email == email).first():
            user = User(email=email, hashed_password=hash_password(pwd), role="teacher", is_active=True)
            db.add(user)
            db.flush()
            teacher = Teacher(user_id=user.id, name=name, department=dept, employee_id=f"T{user.id:03d}")
            db.add(teacher)
            db.commit()
            print(f"  ✅ Teacher: {email} / {pwd}")
        else:
            print(f"  ⏩ Teacher exists: {email}")

    # --- Students ---
    students_data = [
        ("STU001", "Aarav Sharma", "12", "A", "1"),
        ("STU002", "Priya Patel", "12", "A", "2"),
        ("STU003", "Rohit Kumar", "12", "A", "3"),
        ("STU004", "Sneha Gupta", "12", "A", "4"),
        ("STU005", "Arjun Singh", "12", "B", "1"),
        ("STU006", "Nisha Verma", "12", "B", "2"),
        ("STU007", "Vikram Joshi", "12", "B", "3"),
        ("STU008", "Ananya Das", "12", "B", "4"),
        ("STU009", "Karan Mehta", "11", "A", "1"),
        ("STU010", "Pooja Reddy", "11", "A", "2"),
        ("STU011", "Rahul Sharma", "11", "A", "3"),
        ("STU012", "Divya Nair", "11", "B", "1"),
        ("STU013", "Siddharth Roy", "11", "B", "2"),
        ("STU014", "Aisha Khan", "10", "A", "1"),
        ("STU015", "Nikhil Gupta", "10", "A", "2"),
    ]
    stu_pass = "Student@123"
    for reg, name, cls, sec, roll in students_data:
        if not db.query(Student).filter(Student.reg_number == reg).first():
            email = f"{reg.lower()}@student.school.com"
            user = User(email=email, hashed_password=hash_password(stu_pass), role="student", is_active=True)
            db.add(user)
            db.flush()
            student = Student(user_id=user.id, reg_number=reg, name=name,
                              email=email, student_class=cls, section=sec, roll_number=roll)
            db.add(student)
            db.commit()

    print(f"  ✅ Students: STU001-STU015 / {stu_pass}")

    # --- Questions ---
    existing_q = db.query(Question).count()
    if existing_q < 10:
        questions = [
            # Physics - Mechanics
            ("What is the SI unit of force?", "Newton", "Joule", "Watt", "Pascal", "A", "Physics", "Mechanics", "Force", "easy", 1.0, "Force is measured in Newtons (N)."),
            ("The acceleration due to gravity on Earth is approximately:", "8.9 m/s²", "9.8 m/s²", "10.8 m/s²", "7.8 m/s²", "B", "Physics", "Mechanics", "Gravitation", "easy", 1.0, "g ≈ 9.8 m/s² near Earth's surface."),
            ("Newton's Second Law: F =", "ma", "mv", "m/a", "mv²", "A", "Physics", "Mechanics", "Laws of Motion", "easy", 1.0, "F = ma — Force equals mass times acceleration."),
            ("Which is a vector quantity?", "Speed", "Distance", "Mass", "Velocity", "D", "Physics", "Mechanics", "Vectors", "easy", 1.0, "Velocity has both magnitude and direction."),
            ("Work done when force is perpendicular to displacement:", "Maximum", "Minimum", "Zero", "Fd", "C", "Physics", "Mechanics", "Work", "medium", 1.0, "W = Fd cosθ; cos90° = 0, so W = 0."),
            ("The law of conservation of momentum states:", "Momentum increases always", "Total momentum of closed system is constant", "Momentum equals force × time", "Momentum is always zero", "B", "Physics", "Mechanics", "Momentum", "medium", 1.0, "In absence of external forces, total momentum is conserved."),
            ("Kinetic energy formula:", "mv", "mv²", "½mv²", "mgh", "C", "Physics", "Mechanics", "Energy", "easy", 1.0, "KE = ½mv² where m is mass and v is velocity."),
            ("Power is defined as:", "Force × Time", "Work / Time", "Force × Velocity²", "Work × Time", "B", "Physics", "Mechanics", "Power", "easy", 1.0, "Power P = Work done / Time taken."),
            # Physics - Electricity
            ("What is the unit of electric current?", "Volt", "Ohm", "Ampere", "Watt", "C", "Physics", "Electricity", "Current", "easy", 1.0, "Electric current is measured in Amperes (A)."),
            ("Ohm's Law: V =", "IR", "I/R", "I+R", "I²R", "A", "Physics", "Electricity", "Ohm's Law", "easy", 1.0, "V = IR — Voltage equals Current times Resistance."),
            ("In a parallel circuit, total resistance is:", "Sum of all resistances", "Less than smallest resistance", "Product of resistances", "Infinite", "B", "Physics", "Electricity", "Circuits", "medium", 1.0, "1/R_total = 1/R1 + 1/R2 + ... so R_total < smallest R."),
            ("Electric power formula:", "VI", "V/I", "I/V", "V²I", "A", "Physics", "Electricity", "Power", "medium", 1.0, "P = VI = I²R = V²/R."),
            # Physics - Modern
            ("Speed of light in vacuum:", "3×10⁶ m/s", "3×10⁸ m/s", "3×10¹⁰ m/s", "3×10⁴ m/s", "B", "Physics", "Modern Physics", "Relativity", "easy", 1.0, "c = 3×10⁸ m/s exactly 299,792,458 m/s."),
            ("The photoelectric effect was explained by:", "Maxwell", "Hertz", "Einstein", "Planck", "C", "Physics", "Modern Physics", "Quantum", "medium", 1.0, "Einstein explained photoelectric effect using photons, earning the 1921 Nobel Prize."),
            ("De Broglie wavelength λ = h/p. If p doubles, λ:", "Doubles", "Halves", "Stays same", "Quadruples", "B", "Physics", "Modern Physics", "Matter Waves", "hard", 1.0, "λ = h/p; if p → 2p, then λ → h/2p = λ/2."),
            # Physics - Optics
            ("Focal length of convex mirror with R = 30 cm:", "15 cm", "30 cm", "60 cm", "-15 cm", "A", "Physics", "Optics", "Mirrors", "medium", 1.0, "f = R/2 = 15 cm for a convex mirror."),
            ("Phenomenon of light bending around obstacles:", "Reflection", "Refraction", "Diffraction", "Interference", "C", "Physics", "Optics", "Wave Optics", "medium", 1.0, "Diffraction is bending of waves around obstacles."),
            ("Refractive index n = c/v. If v decreases:", "n decreases", "n increases", "n stays same", "λ increases", "B", "Physics", "Optics", "Refraction", "medium", 1.0, "If v decreases and c is constant, n = c/v increases."),
            # Physics - Thermodynamics
            ("Boyle's Law: At constant T, P ∝", "V", "1/V", "V²", "T", "B", "Physics", "Thermodynamics", "Gas Laws", "medium", 1.0, "Boyle's Law: PV = constant, so P ∝ 1/V."),
            ("First Law of Thermodynamics states:", "Energy cannot be created", "ΔU = Q - W", "Entropy always increases", "Heat flows from cold to hot", "B", "Physics", "Thermodynamics", "Laws of Thermodynamics", "hard", 1.0, "ΔU = Q - W: change in internal energy equals heat added minus work done."),
            # Chemistry
            ("Atomic number of Carbon:", "4", "6", "8", "12", "B", "Chemistry", "Atomic Structure", "Periodic Table", "easy", 1.0, "Carbon has 6 protons, atomic number = 6."),
            ("Which is an exothermic reaction?", "Photosynthesis", "Combustion", "Electrolysis", "Decomposition of CaCO₃", "B", "Chemistry", "Thermochemistry", "Reactions", "easy", 1.0, "Combustion releases heat — exothermic."),
            ("pH of pure water at 25°C:", "0", "7", "14", "1", "B", "Chemistry", "Acid-Base", "pH Scale", "easy", 1.0, "Pure water is neutral, pH = 7."),
            ("Gas produced when Zn reacts with H₂SO₄:", "O₂", "CO₂", "H₂", "SO₂", "C", "Chemistry", "Reactions", "Acid-Metal", "easy", 1.0, "Zn + H₂SO₄ → ZnSO₄ + H₂↑"),
            ("Avogadro's number:", "6.022×10²³", "6.022×10²⁰", "6.022×10²⁶", "6.022×10¹⁶", "A", "Chemistry", "Stoichiometry", "Mole Concept", "easy", 1.0, "Nₐ = 6.022×10²³ mol⁻¹"),
            ("Highest electronegativity element:", "Oxygen", "Chlorine", "Nitrogen", "Fluorine", "D", "Chemistry", "Bonding", "Electronegativity", "medium", 1.0, "Fluorine has highest electronegativity: 3.98 Pauling scale."),
            ("Hybridization of carbon in ethylene:", "sp", "sp²", "sp³", "sp³d", "B", "Chemistry", "Organic", "Bonding", "medium", 1.0, "C in C₂H₄ is sp² hybridized with one π bond."),
            ("Le Chatelier's Principle:", "Reactions always go forward", "System shifts to oppose change", "Entropy increases", "Energy conserved", "B", "Chemistry", "Equilibrium", "Principles", "medium", 1.0, "System at equilibrium shifts to counteract disturbance."),
            ("Rate of reaction generally increases with:", "Decrease in temperature", "Increase in temperature", "Decrease in concentration", "None", "B", "Chemistry", "Kinetics", "Rate", "easy", 1.0, "Higher T → more collisions → faster reaction."),
            ("IUPAC name of CH₃-CH₂-OH:", "Methanol", "Ethanol", "Propanol", "Butanol", "B", "Chemistry", "Organic", "Alcohols", "easy", 1.0, "2 carbons + OH = ethanol."),
            # Mathematics
            ("Derivative of sin(x):", "cos(x)", "-cos(x)", "sin(x)", "-sin(x)", "A", "Mathematics", "Calculus", "Differentiation", "easy", 1.0, "d/dx[sin(x)] = cos(x)"),
            ("∫(1/x)dx =", "x", "ln|x|", "1/x²", "eˣ", "B", "Mathematics", "Calculus", "Integration", "easy", 1.0, "∫(1/x)dx = ln|x| + C"),
            ("Roots of x² - 5x + 6 = 0:", "2 and 3", "1 and 6", "2 and -3", "-2 and -3", "A", "Mathematics", "Algebra", "Quadratics", "easy", 1.0, "(x-2)(x-3)=0 → x=2,3"),
            ("sin²θ + cos²θ =", "0", "1", "2", "tanθ", "B", "Mathematics", "Trigonometry", "Identities", "easy", 1.0, "Pythagorean identity: sin²θ + cos²θ = 1"),
            ("lim(x→0) sin(x)/x =", "0", "∞", "1", "Undefined", "C", "Mathematics", "Calculus", "Limits", "medium", 1.0, "Standard limit = 1"),
            ("If f(x) = x³, f'(x) =", "3x", "3x²", "x²", "3x³", "B", "Mathematics", "Calculus", "Differentiation", "easy", 1.0, "Power rule: d/dx[xⁿ] = nxⁿ⁻¹"),
            ("Sum of angles in a triangle:", "90°", "180°", "270°", "360°", "B", "Mathematics", "Geometry", "Triangles", "easy", 1.0, "Triangle angle sum = 180°"),
            ("det([[2,3],[4,5]]) =", "2", "-2", "7", "22", "B", "Mathematics", "Algebra", "Matrices", "medium", 1.0, "(2×5)-(3×4) = 10-12 = -2"),
            ("∫₀¹ x² dx =", "1", "1/2", "1/3", "1/4", "C", "Mathematics", "Calculus", "Integration", "medium", 1.0, "[x³/3]₀¹ = 1/3"),
            ("Value of e:", "2.718", "3.141", "1.618", "1.414", "A", "Mathematics", "Calculus", "Constants", "easy", 1.0, "Euler's number e ≈ 2.71828"),
            ("Slope-intercept form:", "y=mx+b", "ax+by=c", "y-y₁=m(x-x₁)", "x²+y²=r²", "A", "Mathematics", "Geometry", "Lines", "easy", 1.0, "y=mx+b where m=slope, b=y-intercept"),
            ("Standard deviation =", "Mean of data", "Square root of variance", "Sum of deviations", "Variance squared", "B", "Mathematics", "Statistics", "Dispersion", "medium", 1.0, "SD = √variance"),
            ("Bayes' theorem relates:", "P(A) and P(B)", "P(A|B) and P(B|A)", "P(A∪B) and P(A∩B)", "P(A') and P(B')", "B", "Mathematics", "Probability", "Conditional", "hard", 1.0, "P(A|B) = P(B|A)P(A)/P(B)"),
            ("Area of circle with radius r:", "2πr", "πr²", "4πr²", "πr", "B", "Mathematics", "Geometry", "Areas", "easy", 1.0, "Area = πr²"),
            ("NOT a prime number:", "2", "7", "11", "15", "D", "Mathematics", "Number Theory", "Primes", "easy", 1.0, "15 = 3×5, composite"),
        ]

        admin_user = db.query(User).filter(User.email == admin_email).first()
        created_by = admin_user.id if admin_user else None

        for q_data in questions:
            q = Question(
                question_text=q_data[0],
                option_a=q_data[1], option_b=q_data[2], option_c=q_data[3], option_d=q_data[4],
                correct_answer=q_data[5],
                subject=q_data[6], chapter=q_data[7], topic=q_data[8],
                difficulty=q_data[9], marks=q_data[10], explanation=q_data[11],
                created_by=created_by, is_active=True,
            )
            db.add(q)
        db.commit()
        print(f"  ✅ Created {len(questions)} sample questions")
    else:
        print(f"  ⏩ Questions already exist ({existing_q})")

    # --- Sample Exams ---
    teacher = db.query(Teacher).first()
    if teacher and db.query(Exam).count() == 0:
        now = datetime.utcnow()

        # Live exam (Physics)
        live_exam = Exam(
            teacher_id=teacher.id,
            title="Physics Mid-Term Exam",
            subject="Physics",
            description="Mid-term examination covering Mechanics, Electricity and Modern Physics.",
            status="live",
            start_time=now - timedelta(hours=1),
            end_time=now + timedelta(hours=2),
            duration_minutes=60,
            total_questions=20,
            marks_per_question=4.0,
            negative_marking=1.0,
            passing_percentage=40.0,
            show_result_immediately=True,
            show_correct_answers=True,
            show_explanations=True,
            leaderboard_enabled=True,
            max_violations=3,
        )
        db.add(live_exam)

        # Scheduled exam
        scheduled_exam = Exam(
            teacher_id=teacher.id,
            title="Chemistry Final Exam",
            subject="Chemistry",
            description="Final examination for Chemistry. Covers all chapters.",
            status="scheduled",
            start_time=now + timedelta(days=2),
            end_time=now + timedelta(days=2, hours=3),
            duration_minutes=90,
            total_questions=30,
            marks_per_question=2.0,
            negative_marking=0.5,
            passing_percentage=35.0,
            show_result_immediately=False,
            show_correct_answers=False,
            show_explanations=False,
            leaderboard_enabled=False,
            max_violations=3,
        )
        db.add(scheduled_exam)
        db.commit()
        print("  ✅ Created 2 sample exams (1 live, 1 scheduled)")
    else:
        print("  ⏩ Exams already exist")

    db.close()
    print("\n✅ Seeding complete!")
    print("\n📋 Test Accounts:")
    print(f"  Admin:   {admin_email} / Admin@123")
    print(f"  Teacher: teacher1@school.com / Teacher@123")
    print(f"  Student: STU001 / Student@123  (through STU015)")


if __name__ == "__main__":
    seed()
