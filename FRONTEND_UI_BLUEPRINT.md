# StudyMind AI — Complete Frontend UI Specification & Blueprint

> **Application Overview:** An AI-powered adaptive study planner and academic tracker. This document specifies the complete page architecture, visual layouts, UI components, interactive features, and connected FastAPI backend endpoints for building the frontend.

---

## 1. High-Level Page Architecture & Sitemap

The frontend is structured into **11 core pages** organized into 4 logical suites:

```text
StudyMind AI
├── 1. Authentication
│   ├── /login                     → Login Page
│   └── /register                  → Registration Page
│
├── 2. Academic Command Center
│   ├── /dashboard                 → Central Overview & Today's Agenda
│   ├── /classrooms                → Classrooms & Semesters Hub
│   ├── /classrooms/:id            → Classroom Workspace (Subjects, Exams, Notes)
│   └── /subjects/:id              → Subject Deep Dive (Topics, Progress, Assignments)
│
├── 3. Intelligent Planning
│   ├── /timetable                 → Interactive Calendar & Session Tracker
│   └── /availability              → Weekly Study Slot Customizer
│
├── 4. Knowledge, AI & Evaluation
│   ├── /notes-rag                 → PDF Manager & Notes Q&A with Citations
│   ├── /quizzes                   → Automated Notes-to-Quiz Arena
│   └── /ai-coach                  → AI Academic Coach & Gemini Live Audio
│
└── 5. Analytics & Profile
    ├── /analytics                 → Performance Prediction, Deficit & Weak Subjects
    └── /profile                   → User Profile & Account Settings
```

---

## 2. Common Layout & Shared Components

Every authenticated page shares a unified app shell:

### A. Sidebar Navigation (`Sidebar.jsx`)
- **Logo & App Title**: StudyMind AI with quick status indicator.
- **Navigation Links**:
  - 📊 Dashboard (`/dashboard`)
  - 🏫 Classrooms (`/classrooms`)
  - 📅 Timetable & Sessions (`/timetable`)
  - ⏰ Study Availability (`/availability`)
  - 📚 Notes & RAG (`/notes-rag`)
  - 📝 Quizzes (`/quizzes`)
  - 🎙️ AI Coach (`/ai-coach`)
  - 📈 Analytics (`/analytics`)
- **Footer**: Current user badge with quick link to `/profile` and Logout button.

### B. Top App Bar (`Navbar.jsx`)
- Page breadcrumbs (e.g., `Classrooms > CS Sem 7 > Machine Learning`).
- Quick-action buttons:
  - **"⚡ Quick Reschedule"** button (triggers adaptive recalculation).
  - **"🎙️ Ask AI Coach"** floating modal trigger.
- Notification badge (alerts for upcoming exams within 7 days or detected study deficits).

### C. Reusable Modal Components
- `SessionModal.jsx`: Timer popup for starting/completing a study session with actual minutes studied input.
- `PDFUploadModal.jsx`: Drag-and-drop file uploader with progress bar.
- `QuickQuizModal.jsx`: Pop-up quiz runner from any topic.

---

## 3. Detailed Page-by-Page Specification

---

### Page 1: Login (`/login`)
* **Purpose**: Authenticate existing students and store JWT access token.
* **Layout & Visual Elements**:
  - Centered glassmorphic card on dark gradient background.
  - Brand branding badge with subtitle: *"Intelligent Academic Planning"*.
* **UI Controls & Inputs**:
  - Email input field (`type="email"`).
  - Password input field (`type="password"` with show/hide toggle).
  - **"Sign In"** primary action button.
  - Link to `/register` (*"Don't have an account? Create one"*).
* **Connected Backend API**:
  - `POST /auth/login` (Body: `{ email, password }` → Returns: `{ access_token, token_type }`)

---

### Page 2: Register (`/register`)
* **Purpose**: Onboard new students with instant account creation.
* **Layout & Visual Elements**:
  - Dual-column or clean centered card with benefits list (Smart Scheduling, PDF RAG, Gemini Live Audio).
* **UI Controls & Inputs**:
  - Full Name input (`type="text"`).
  - Email input (`type="email"`).
  - Password input (`type="password"`).
  - **"Create Account"** primary action button.
  - Link to `/login`.
* **Connected Backend API**:
  - `POST /auth/register` (Body: `{ name, email, password }` → Returns: `{ access_token }`)

---

### Page 3: Dashboard (`/dashboard`)
* **Purpose**: Answers *"What is my academic situation right now?"* in a single glance.
* **Layout & Sections**:
  1. **Top Metric Cards (Row 1)**:
     - **Overall Progress**: Ring/progress bar with percentage (e.g., `68.5%`).
     - **Study Hours This Week**: Actual vs. Planned hours (e.g., `12.5h / 16.0h`).
     - **Pending Tasks**: Incomplete topics & assignments count.
     - **Study Deficit Alert**: Green *"On Track"* or Red/Amber badge with recommended daily increase (e.g., `+35 min/day required`).
  2. **Today's Study Schedule (Row 2, Left)**:
     - Chronological list of scheduled study blocks for today.
     - Each card displays: Subject tag, Topic name, Start/End time, Duration badge.
     - Interactive Buttons:
       - **"▶ Start Session"**: Opens live study timer.
       - **"✓ Complete"**: Marks session complete, updates topic progress.
       - **"✕ Miss"**: Marks session missed, triggers adaptive rescheduling.
  3. **Upcoming Deadlines & Exams (Row 2, Right)**:
     - Countdown cards for upcoming exams (e.g., *"Midterm: 4 days left"*).
     - Coursework assignments with priority color badges.
  4. **Weak Subjects & Focus Areas (Row 3)**:
     - Cards showing subjects flagged with `HIGH ATTENTION` or `MEDIUM ATTENTION`.
     - Direct button to generate a practice quiz or start revision session.
* **Connected Backend API**:
  - `GET /dashboard` (Returns aggregated summary: progress, hours, exams, today's sessions, weak subjects, deficit).
  - `POST /study-sessions/{id}/complete`
  - `POST /study-sessions/{id}/miss`
  - `POST /study-plan/reschedule`

---

### Page 4: Classrooms Hub (`/classrooms`)
* **Purpose**: Manage semesters and academic batches.
* **Layout & Elements**:
  - Header with **"+ New Classroom"** modal trigger.
  - Grid of Classroom cards displaying:
    - Classroom Name (e.g., *"Computer Science - Semester 7"*).
    - Academic Year tag (e.g., *"2026-2027"*).
    - Subject count badge (e.g., *"5 Subjects"*).
    - Action buttons: View Workspace, Edit, Delete.
* **Modals**:
  - *Create/Edit Classroom Modal*: Name, Description, Academic Year.
* **Connected Backend APIs**:
  - `GET /classrooms`
  - `POST /classrooms`
  - `PUT /classrooms/{id}`
  - `DELETE /classrooms/{id}`

---

### Page 5: Classroom Workspace (`/classrooms/:id`)
* **Purpose**: Deep-dive hub for a specific semester, bringing together all subjects, exams, and notes.
* **Layout & Tabs**:
  - **Header**: Classroom title, academic year, and overall classroom completion rate.
  - **Tab 1: Subjects Grid**:
    - Subject cards displaying Code, Title, Topic Count, and calculated progress bar.
    - **"+ Add Subject"** button.
  - **Tab 2: Examinations**:
    - Table of scheduled exams for this classroom with Date, Start Time, Duration, Weightage.
    - **"+ Add Exam"** modal.
    - **"📄 Extract from Timetable"** button (opens AI timetable text extraction tool).
  - **Tab 3: Study Plan**:
    - **"⚡ Generate Classroom Plan"** button.
    - Active timetable preview specifically for this classroom.
* **Connected Backend APIs**:
  - `GET /classrooms/{id}`
  - `GET /classrooms/{id}/subjects`
  - `POST /classrooms/{id}/subjects`
  - `POST /classrooms/{id}/study-plan/generate`
  - `GET /classrooms/{id}/study-plan`

---

### Page 6: Subject Deep Dive (`/subjects/:id`)
* **Purpose**: Manage syllabus topics, coursework assignments, lecture notes, and quizzes for a single subject.
* **Layout & Tabs**:
  - **Header**: Subject title, code, description, and weighted subject progress meter.
  - **Tab 1: Topics & Syllabus**:
    - List of topics with Difficulty tags (🟢 Easy, 🟡 Medium, 🔴 Hard).
    - Interactive Progress Slider (0–100%) or quick completion checkbox.
    - Status badge (`PENDING`, `IN_PROGRESS`, `COMPLETED`).
    - **"+ Add Topic"** button.
  - **Tab 2: Coursework & Assignments**:
    - List of assignments with deadline countdowns, estimated minutes, and status toggles.
    - **"+ Add Assignment"** button.
  - **Tab 3: Lecture Notes & PDFs**:
    - Upload area (drag-and-drop PDF upload).
    - Table of indexed notes: Filename, Size, Processing Status (`READY`, `PROCESSING`), Chunks count.
    - Action buttons: **"Ask AI"**, **"Generate Quiz"**, **"Delete"**.
* **Connected Backend APIs**:
  - `GET /subjects/{id}`
  - `GET /subjects/{id}/topics` & `POST /subjects/{id}/topics`
  - `PUT /topics/{topic_id}` & `DELETE /topics/{topic_id}`
  - `GET /subjects/{id}/assignments` & `POST /subjects/{id}/assignments`
  - `GET /subjects/{id}/notes` & `POST /subjects/{id}/notes`

---

### Page 7: Timetable & Calendar (`/timetable`)
* **Purpose**: Full calendar and daily agenda viewer for planned study sessions, exams, and deadlines.
* **Layout & Controls**:
  - **View Switcher**: Day View / Week View / Month View.
  - **Color-Coded Events**:
    - 🔵 Blue: Standard Topic Study Session
    - 🟣 Purple: Pre-Exam Revision Block (auto-reserved before exams)
    - 🔴 Red: Examination Date
    - 🟠 Orange: Assignment Deadline
  - **Top Action Bar**:
    - **"🔄 Regenerate Schedule"** button.
    - **"⚡ Adaptive Reschedule"** button with reason selector modal.
  - **Interactive Event Click**:
    - Popover showing Subject, Topic, Duration, Scheduled Window.
    - Buttons: **"Mark Complete"**, **"Mark Missed"**, **"Reschedule"**.
* **Connected Backend APIs**:
  - `GET /study-sessions`
  - `GET /study-plan/active`
  - `POST /study-plan/generate`
  - `POST /study-plan/reschedule`
  - `POST /study-sessions/{id}/complete`
  - `POST /study-sessions/{id}/miss`

---

### Page 8: Study Availability (`/availability`)
* **Purpose**: Customize recurring weekly study hours so the scheduling engine plans realistically.
* **Layout & Elements**:
  - Weekly Schedule Matrix (Monday through Sunday).
  - For each day:
    - Enable/Disable day toggle.
    - Time range picker: `Start Time` (e.g., `18:00`) to `End Time` (e.g., `21:00`).
    - Total calculated available minutes badge (e.g., `180 min`).
  - **Summary Banner**: Total available weekly study hours (e.g., *"18.5 Hours/Week available"*).
  - **"Save & Recalculate Schedule"** primary button.
* **Connected Backend APIs**:
  - `GET /availability`
  - `POST /availability` (Batch set slots)
  - `DELETE /availability/{slot_id}`

---

### Page 9: Notes & RAG Q&A (`/notes-rag`)
* **Purpose**: Document library and conversational question-answering strictly grounded in student lecture notes.
* **Layout & Split Pane**:
  - **Left Pane: Notes Library**:
    - PDF uploader widget.
    - Subject filter dropdown.
    - List of uploaded notes with Cloudinary/local links and chunk statistics.
  - **Right Pane: RAG Search & Chat**:
    - Question input bar with subject context selector (e.g., *"Select Machine Learning notes"*).
    - Search / Ask button.
    - AI Response Card:
      - Clean formatted answer generated by Gemini Flash.
      - **Citations Accordion**: Shows exact document title, page number, and source text snippets used to formulate the answer.
      - Strict hallucination notice if notes do not contain sufficient data.
* **Connected Backend APIs**:
  - `POST /subjects/{id}/notes` (Upload PDF)
  - `GET /subjects/{id}/notes`
  - `DELETE /notes/{id}`
  - `POST /rag/query` (Body: `{ question, subject_id, classroom_id }` → Returns answer + citations)

---

### Page 10: Quizzes Arena (`/quizzes`)
* **Purpose**: Automated knowledge testing generated directly from notes or topics.
* **Layout & Flow**:
  1. **Quiz Generator Form (Header)**:
     - Select Subject & Optional Topic.
     - Select Number of Questions (3, 5, 10).
     - Select Difficulty (Easy, Medium, Hard).
     - **"Generate Quiz with Gemini"** button.
  2. **Active Quiz Runner**:
     - Stepper displaying Question 1 of N.
     - Clear question text with 4 selectable multiple-choice option cards (A, B, C, D).
     - Next / Previous buttons and **"Submit Quiz"** button.
  3. **Results & Review View**:
     - Score ring (e.g., `4 / 5 Correct (80%)`).
     - AI Motivational feedback badge.
     - Question breakdown: displays student's answer, correct answer, and **detailed conceptual explanation**.
* **Connected Backend APIs**:
  - `POST /quizzes/generate`
  - `GET /quizzes/{id}`
  - `POST /quizzes/{id}/submit`

---

### Page 11: AI Academic Coach & Audio (`/ai-coach`)
* **Purpose**: Multimodal academic advisor providing timetable extraction, chat coaching, and Gemini Live voice guidance.
* **Layout & Sub-Sections**:
  1. **Mode 1: Conversational Chat Coach**:
     - Chat thread with quick topic prompts:
       - *"What should I prioritize today?"*
       - *"I missed my study block yesterday, help me adapt"*
       - *"Analyze my weak areas in DBMS"*
     - Structured action suggestion buttons attached to AI messages (e.g., *"Click to Auto-Reschedule"*).
  2. **Mode 2: Timetable Text Extractor**:
     - Text area to paste messy exam schedules or syllabi.
     - **"Extract Exam Dates"** button.
     - Table preview of detected exams with **"Save to Database"** confirmation.
  3. **Mode 3: Gemini Live Audio Coach**:
     - Voice assistant widget with microphone visualizer.
     - Audio prompt input bar or quick voice trigger.
     - Spoken guidance transcript player and bulleted action item cards.
* **Connected Backend APIs**:
  - `POST /ai/chat`
  - `POST /ai/timetable/extract`
  - `POST /ai/audio/guidance`

---

### Page 12: Analytics & Predictions (`/analytics`)
* **Purpose**: In-depth analytics, syllabus velocity, weak subject diagnostics, and performance forecasting.
* **Layout & Visual Charts**:
  1. **Syllabus Mastery Prediction Card**:
     - Probability meter (e.g., `85% Completion Probability`).
     - Velocity metric (topics mastered per week).
     - Consistency rating (completed vs. missed sessions).
     - Diagnostic verdict & advice card.
  2. **Study Deficit Analysis**:
     - Comparison bar: Total Required Study Minutes vs. Total Available Future Minutes.
     - Deficit badge and daily adjustment recommendation.
  3. **Subject Breakdown Table / Chart**:
     - Bar chart of completion rates across all subjects.
     - Attention level tags: `HIGH ATTENTION`, `MEDIUM ATTENTION`, `LOW ATTENTION`.
  4. **Planned vs. Actual Study Hours**:
     - Weekly comparison bar chart showing planned vs. actual hours studied.
* **Connected Backend API**:
  - `GET /analytics`

---

### Page 13: Profile & Settings (`/profile`)
* **Purpose**: Manage account details and preferences.
* **Layout & Elements**:
  - User details card: Name, Email, Account Created Date.
  - Edit Profile form (Update name, email, or password).
  - System status indicators: Backend API connectivity, Gemini AI model status, Cloudinary status.
  - Sign out button.
* **Connected Backend APIs**:
  - `GET /users/me`
  - `PUT /users/me`

---

## 4. Summary Table of Frontend Pages & API Routes

| # | Page Name | Route | Key Backend Endpoints |
|---|---|---|---|
| 1 | **Login** | `/login` | `POST /auth/login` |
| 2 | **Register** | `/register` | `POST /auth/register` |
| 3 | **Dashboard** | `/dashboard` | `GET /dashboard`, `POST /study-sessions/{id}/complete`, `POST /study-sessions/{id}/miss`, `POST /study-plan/reschedule` |
| 4 | **Classrooms** | `/classrooms` | `GET /classrooms`, `POST /classrooms`, `PUT /classrooms/{id}`, `DELETE /classrooms/{id}` |
| 5 | **Classroom Workspace** | `/classrooms/:id` | `GET /classrooms/{id}`, `GET /classrooms/{id}/subjects`, `POST /classrooms/{id}/subjects`, `POST /classrooms/{id}/study-plan/generate` |
| 6 | **Subject Deep Dive** | `/subjects/:id` | `GET /subjects/{id}`, `GET /subjects/{id}/topics`, `POST /subjects/{id}/topics`, `GET /subjects/{id}/exams`, `GET /subjects/{id}/notes` |
| 7 | **Timetable & Calendar** | `/timetable` | `GET /study-sessions`, `GET /study-plan/active`, `POST /study-plan/generate`, `POST /study-plan/reschedule` |
| 8 | **Study Availability** | `/availability` | `GET /availability`, `POST /availability`, `DELETE /availability/{id}` |
| 9 | **Notes & RAG** | `/notes-rag` | `POST /subjects/{id}/notes`, `GET /subjects/{id}/notes`, `DELETE /notes/{id}`, `POST /rag/query` |
| 10 | **Quizzes Arena** | `/quizzes` | `POST /quizzes/generate`, `GET /quizzes/{id}`, `POST /quizzes/{id}/submit` |
| 11 | **AI Coach & Audio** | `/ai-coach` | `POST /ai/chat`, `POST /ai/timetable/extract`, `POST /ai/audio/guidance` |
| 12 | **Analytics** | `/analytics` | `GET /analytics` |
| 13 | **Profile** | `/profile` | `GET /users/me`, `PUT /users/me` |

---

## 5. Recommended UI Component Technology Stack
- **Framework**: React 18 / 19 + Vite (already configured in `/frontend`).
- **Styling**: Vanilla Modern CSS with CSS Variables for theming (dark mode, sleek glassmorphism, accent gradients).
- **Icons**: Lucide React (`lucide-react`) or SVG icon set for clean academic icons.
- **Charts**: Lightweight Chart.js (`react-chartjs-2`) or Canvas-based progress rings for progress and study hour bars.
- **HTTP Client**: Axios configured in `/frontend/src/api/client.js` with Bearer Token interceptor.
