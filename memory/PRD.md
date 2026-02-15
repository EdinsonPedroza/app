# Corporación Social Educando - Plataforma Educativa Virtual

## Overview
Full-stack education platform for "Corporación Social Educando", supporting 3 technical programs with role-based access for admins, teachers, and students.

## Tech Stack
- **Frontend**: React (CRA) + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI + MongoDB (Motor)
- **Auth**: JWT tokens with SHA-256 password hashing

## Programs
1. Técnico en Asistencia Administrativa (2 modules, 10 subjects)
2. Técnico Laboral en Atención a la Primera Infancia (2 modules, 14 subjects)
3. Técnico en Seguridad y Salud en el Trabajo (2 modules, 12 subjects)

## Roles & Features

### Admin
- Dashboard with platform stats
- CRUD Programs (técnicos)
- CRUD Subjects (materias) per program
- CRUD Teachers (email + password)
- CRUD Students (cédula + password, assigned to program)
- CRUD Courses (groups with teacher + student assignments)

### Teacher (Profesor)
- Course selector (first screen after login)
- Within course: Dashboard, Activities, Grades, Videos, Students
- Create/edit activities with deadlines (auto-lock after due date)
- Upload class video links (YouTube, etc.)
- Grade students per activity or general grade (0-5 scale)
- View enrolled students

### Student (Estudiante)
- Dashboard with academic summary
- View enrolled courses
- View activities with deadline status (Active/Blocked)
- Submit activities (text-based)
- View grades and average
- Watch class videos

## Default Test Users
- **Admin**: admin@educando.com / admin123
- **Profesor**: profesor@educando.com / profesor123
- **Profesor 2**: profesor2@educando.com / profesor123
- **Estudiante 1**: 1234567890 / estudiante123
- **Estudiante 2**: 0987654321 / estudiante123
- **Estudiante 3**: 1122334455 / estudiante123

## API Endpoints
- POST /api/seed - Initialize database with test data
- POST /api/auth/login - Login
- GET /api/auth/me - Get current user
- CRUD /api/users, /api/programs, /api/subjects, /api/courses
- CRUD /api/activities, /api/grades, /api/class-videos, /api/submissions
- GET /api/stats - Admin stats
