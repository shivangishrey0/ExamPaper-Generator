# 📝 Exam Paper Generator

A full-stack exam management platform built with the MERN stack. Supports role-based access for Superadmin, Teacher and Student with features like question bank management, automated paper generation, webcam proctoring, and result publishing.

---

## 🔗 Live Demo

🌐 [Click here to open the app](https://your-vercel-link.vercel.app)

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| Super Admin | superadmin@example.com | SuperAdmin@123 |

---

## 👤 What Each Role Can Do

**Superadmin**
- Send invites to create teacher and student accounts
- Manage all users — activate, deactivate, delete
- Access all exams across all teachers

**Teacher**
- Upload questions via Excel or add manually
- Generate exam papers by subject, difficulty and type
- Publish exams, grade submissions and publish results

**Student**
- View and attempt published exams
- Webcam proctoring active during exam
- Auto-save answers every 15 seconds
- View results and full question breakdown after grading

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Auth | JWT, bcryptjs |
| Email | Nodemailer, Gmail SMTP |
| File Upload | Multer, SheetJS |
| Proctoring | react-webcam |

---

## 🔐 Key Features

- JWT authentication with role and permissions embedded in token
- RBAC with 3 roles — superadmin, teacher, student
- Secure invite flow — admin never handles user passwords
- Backend pagination using MongoDB skip and limit
- API rate limiting on auth endpoints
- Auto-save exam answers to localStorage
- Countdown timer with auto-submit
- Already-submitted guard prevents re-entry
- Full result breakdown with grade (A+ to F)

---

## 🚀 Local Setup

```bash
# Clone the repo
git clone https://github.com/yourusername/exam-paper-generator.git

# Backend setup
cd Backend
npm install
cp .env.example .env
# Fill in your env variables
node server.js

# Frontend setup
cd ../Frontend
npm install
npm run dev
```

---

## 📁 Project Structure
