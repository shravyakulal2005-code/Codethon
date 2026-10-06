# AI-Powered Intelligent Study Planner & Progress Tracker

## Complete Implementation Roadmap

> **Project goal:** Build an adaptive academic planning platform that
> allows students to organize classrooms, subjects, topics, notes,
> examinations, assignments, study availability, and progress; then
> generates and continuously updates a personalized study plan. RAG
> provides contextual access to uploaded study material, while a
> deterministic scheduling engine handles planning and rescheduling.

------------------------------------------------------------------------

# 1. Project Vision

The application should not be treated as a PDF/RAG application with a
timetable attached.

The core product is:

``` text
Student Academic Data
        ↓
Subjects + Topics + Exams + Assignments
        ↓
Progress + Available Study Time
        ↓
Priority Engine
        ↓
Study Scheduling Engine
        ↓
Personalized Study Plan
        ↓
Student completes / misses tasks
        ↓
Progress Update
        ↓
Adaptive Rescheduling
        ↓
Updated Study Plan
```

The RAG subsystem is a supporting knowledge layer:

``` text
Student Notes / PDFs
        ↓
Text Extraction
        ↓
Chunking
        ↓
Embeddings
        ↓
FAISS
        ↓
Context Retrieval
        ↓
Gemini / LLM
        ↓
AI Study Assistant
```

------------------------------------------------------------------------

# 2. Recommended Technology Stack

## 2.1 Frontend

Choose one primary frontend.

### Recommended for web

-   React
-   Vite
-   JavaScript / JSX
-   Vanilla CSS or CSS Modules
-   Recharts or Chart.js for charts
-   FullCalendar or a custom calendar component for timetable
-   Axios or Fetch API for REST communication

### Alternative

Flutter can be used if the project requires a mobile application.

Do not build React web and Flutter mobile simultaneously during the
initial implementation. Finish one client first.

------------------------------------------------------------------------

## 2.2 Backend

-   Python
-   FastAPI
-   Pydantic
-   SQLAlchemy
-   Alembic
-   JWT authentication
-   Python service modules for scheduling and AI

Recommended structure:

``` text
backend/
├── app/
│   ├── main.py
│   ├── core/
│   ├── db/
│   ├── models/
│   ├── schemas/
│   ├── api/
│   ├── services/
│   ├── scheduler/
│   ├── rag/
│   ├── ai/
│   └── utils/
├── tests/
├── requirements.txt
└── .env
```

------------------------------------------------------------------------

## 2.3 Main Database

Recommended:

-   SQLLITE     

Use PostgreSQL for structured application data.

It should store:

-   Users
-   Classrooms
-   Subjects
-   Topics
-   Exams
-   Assignments
-   Study availability
-   Study sessions
-   Generated study plans
-   Progress
-   Notes metadata
-   AI interaction metadata

MongoDB can work, but PostgreSQL is a stronger choice for this project
because the data is highly relational.

------------------------------------------------------------------------

## 2.4 Vector Search

Use:

-   FAISS

FAISS is the vector similarity search/indexing layer.

Do not treat FAISS as the primary application database.

Store metadata and ownership information in PostgreSQL.

Example:

``` text
PostgreSQL
    ↓
note_id
subject_id
classroom_id
file_path
chunk_id
embedding_reference
```

FAISS:

``` text
embedding vectors
      ↓
similarity search
      ↓
top-k chunk IDs
```

------------------------------------------------------------------------

## 2.5 AI / LLM

Use:

-   Gemini API

Main uses:

1.  RAG question answering
2.  AI study explanations
3.  Timetable/document extraction
4.  Daily/weekly summaries
5.  Study recommendations
6.  Natural-language interaction with the study planner

Do not use the LLM as the only scheduling engine.

------------------------------------------------------------------------

## 2.6 RAG Framework

Recommended:

-   LangChain

Use it where it genuinely simplifies:

-   Document loading
-   Text splitting
-   Embedding workflow
-   Retrieval
-   Prompt construction
-   RAG chains

The actual scheduling logic should remain your own Python
implementation.

------------------------------------------------------------------------

## 2.7 File Storage

For development:

-   Local storage defualt if avilable store to 
cloudinary -  api key:, secret key: ETiulwugHHYjDG8Y6HD8bjNTrgI, cloud name : dqoxbzl98 , 

For production:

-   AWS S3
-   Firebase Storage
-   Cloudinary
-   Another object storage provider

Store the actual PDFs outside PostgreSQL.

------------------------------------------------------------------------

## 2.8 Deployment

Possible stack:

``` text
Frontend → Vercel
Backend  → Render / Railway / AWS
Database → PostgreSQL / Neon
Files    → S3 / Firebase Storage
```

Docker should be added once the application works locally.

------------------------------------------------------------------------

# 3. High-Level Architecture

``` text
                         STUDENT
                            │
                            ▼
                    React / Flutter
                            │
                            ▼
                       FastAPI
                            │
        ┌───────────────────┼────────────────────┐
        │                   │                    │
        ▼                   ▼                    ▼
   Auth & Users       Academic Modules       AI Services
        │                   │                    │
        │          ┌────────┼─────────┐          │
        │          │        │         │          │
        │        Subjects  Exams   Assignments   │
        │          │        │         │          │
        │          └────────┼─────────┘          │
        │                   │                    │
        │                   ▼                    ▼
        │             Scheduler Engine      Gemini / RAG
        │                   │                    │
        └───────────────────┼────────────────────┘
                            ▼
                       PostgreSQL
                            +
                          FAISS
                            +
                       File Storage
```

------------------------------------------------------------------------

# 4. Implementation Order

The project should be implemented in this exact dependency order:

``` text
1. Project Setup
        ↓
2. Database + Configuration
        ↓
3. Authentication
        ↓
4. Classroom Management
        ↓
5. Subject + Topic Management
        ↓
6. Exams + Assignments
        ↓
7. Study Availability
        ↓
8. Study Priority Engine
        ↓
9. Study Scheduling Engine
        ↓
10. Study Session Tracking
        ↓
11. Adaptive Rescheduling
        ↓
12. Dashboard + Calendar
        ↓
13. PDF / Notes Management
        ↓
14. RAG Pipeline
        ↓
15. AI Study Assistant
        ↓
16. AI Timetable Extraction
        ↓
17. Analytics + Prediction
        ↓
18. Notifications
        ↓
19. Testing
        ↓
20. Deployment
```

The scheduler should be implemented before the AI assistant. Otherwise
the AI layer will be built on top of an undefined planning system.

------------------------------------------------------------------------

# 5. Phase 1 --- Project Setup

## Objective

Create a clean foundation for the application.

## Backend

Create the FastAPI project.

Install:

``` text
fastapi
uvicorn
sqlalchemy
psycopg
alembic
pydantic
pydantic-settings
python-jose
passlib / pwdlib
python-multipart
```

Later:

``` text
google-genai
langchain
faiss-cpu
pypdf
```

## Configuration

Create:

``` text
.env
```

Example variables:

``` text
DATABASE_URL=
JWT_SECRET=
GEMINI_API_KEY=
STORAGE_PATH=
FAISS_INDEX_PATH=
```

Never hard-code API keys.

## Deliverable

A running API:

``` text
GET /health
```

Expected:

``` json
{
  "status": "ok"
}
```

------------------------------------------------------------------------

# 6. Phase 2 --- Database Design

Create the database before building most application modules.

## Core entities

``` text
users
classrooms
subjects
topics
exams
assignments
study_availability
study_plans
study_sessions
progress
notes
note_chunks
```

------------------------------------------------------------------------

# 7. User Model

Suggested fields:

``` text
users
-----
id
name
email
password_hash
created_at
updated_at
```

Constraints:

-   Email must be unique.
-   Password must never be stored directly.
-   Password must be hashed.

------------------------------------------------------------------------

# 8. Classroom Model

``` text
classrooms
----------
id
user_id
name
description
academic_year
created_at
updated_at
```

Relationship:

``` text
User
 ↓
Many Classrooms
```

Example:

``` text
Computer Science - Semester 7
```

------------------------------------------------------------------------

# 9. Subject Model

``` text
subjects
--------
id
classroom_id
name
code
description
target_exam_id (optional)
created_at
updated_at
```

Relationship:

``` text
Classroom
   ↓
Subjects
```

------------------------------------------------------------------------

# 10. Topic Model

``` text
topics
------
id
subject_id
name
description
difficulty
estimated_minutes
progress_percentage
status
created_at
updated_at
```

Difficulty:

``` text
1 = Easy
2 = Medium
3 = Hard
```

Status:

``` text
PENDING
IN_PROGRESS
COMPLETED
```

Example:

``` text
Subject: Machine Learning

Topics:
- Linear Regression
- Logistic Regression
- Decision Trees
- Random Forest
- SVM
```

------------------------------------------------------------------------

# 11. Exam Model

``` text
exams
-----
id
subject_id
title
exam_date
start_time
duration_minutes
weightage
created_at
updated_at
```

Example:

``` text
Machine Learning
20-11-2026
10:00 AM
```

------------------------------------------------------------------------

# 12. Assignment Model

``` text
assignments
-----------
id
subject_id
title
description
deadline
estimated_minutes
difficulty
status
created_at
updated_at
```

Status:

``` text
PENDING
IN_PROGRESS
COMPLETED
OVERDUE
```

------------------------------------------------------------------------

# 13. Study Availability Model

The student should define available study time.

Possible structure:

``` text
study_availability
------------------
id
user_id
day_of_week
start_time
end_time
available_minutes
```

Example:

``` text
Monday     7:00 PM - 9:00 PM
Tuesday    6:00 PM - 9:00 PM
Saturday   10:00 AM - 2:00 PM
```

This becomes an input to the scheduler.

------------------------------------------------------------------------

# 14. Study Session Model

``` text
study_sessions
--------------
id
user_id
subject_id
topic_id
plan_id
scheduled_start
scheduled_end
actual_minutes
status
completion_percentage
created_at
updated_at
```

Status:

``` text
PLANNED
IN_PROGRESS
COMPLETED
MISSED
CANCELLED
```

This is the most important historical data source for analytics.

------------------------------------------------------------------------

# 15. Notes Model

``` text
notes
-----
id
user_id
classroom_id
subject_id
title
file_path
file_type
file_size
processing_status
created_at
```

Processing status:

``` text
UPLOADED
PROCESSING
READY
FAILED
```

------------------------------------------------------------------------

# 16. Note Chunk Model

``` text
note_chunks
-----------
id
note_id
chunk_index
text
faiss_vector_id
created_at
```

The database stores metadata.

FAISS stores the vector representation.

------------------------------------------------------------------------

# 17. Phase 3 --- Authentication

Implement:

``` text
POST /auth/register
POST /auth/login
GET  /auth/me
```

## Registration flow

``` text
User
 ↓
Registration form
 ↓
Validate email
 ↓
Hash password
 ↓
Create user
 ↓
Return success
```

## Login flow

``` text
Email + Password
 ↓
Validate credentials
 ↓
Generate JWT
 ↓
Frontend stores token
 ↓
Authenticated API requests
```

Every protected endpoint should identify the current user from the JWT.

------------------------------------------------------------------------

# 18. Phase 4 --- Classroom Management

Implement:

``` text
POST   /classrooms
GET    /classrooms
GET    /classrooms/{id}
PUT    /classrooms/{id}
DELETE /classrooms/{id}
```

Rules:

-   A user can access only their own classrooms.
-   Classroom deletion should handle dependent subjects/notes safely.
-   Never trust `user_id` sent by the frontend.

The backend should derive the user from authentication.

------------------------------------------------------------------------

# 19. Phase 5 --- Subject Management

Implement:

``` text
POST   /classrooms/{id}/subjects
GET    /classrooms/{id}/subjects
GET    /subjects/{id}
PUT    /subjects/{id}
DELETE /subjects/{id}
```

Validate that the subject actually belongs to the requested classroom.

------------------------------------------------------------------------

# 20. Phase 6 --- Topic Management

Implement:

``` text
POST   /subjects/{id}/topics
GET    /subjects/{id}/topics
PUT    /topics/{id}
DELETE /topics/{id}
```

Allow:

-   Difficulty
-   Estimated study time
-   Current progress
-   Completion state

------------------------------------------------------------------------

# 21. Phase 7 --- Exams and Assignments

## Exam APIs

``` text
POST   /subjects/{id}/exams
GET    /subjects/{id}/exams
PUT    /exams/{id}
DELETE /exams/{id}
```

## Assignment APIs

``` text
POST   /subjects/{id}/assignments
GET    /subjects/{id}/assignments
PUT    /assignments/{id}
DELETE /assignments/{id}
```

The system must validate deadlines and dates.

------------------------------------------------------------------------

# 22. Phase 8 --- Study Availability

Implement:

``` text
POST /availability
GET  /availability
PUT  /availability/{id}
DELETE /availability/{id}
```

Also allow a student to specify:

``` text
Maximum daily study time
Preferred study hours
Days unavailable
```

This is essential because the scheduler cannot create a realistic plan
without knowing when the student can study.

------------------------------------------------------------------------

# 23. Phase 9 --- Priority Engine

This is the first major intelligence component.

Every incomplete topic/task receives a priority score.

## Inputs

``` text
Deadline urgency
Difficulty
Remaining work
Current progress
Exam proximity
Exam weightage
Assignment deadline
Historical weakness
```

A simple first version:

``` text
Priority =
    W1 × DeadlineUrgency
  + W2 × Difficulty
  + W3 × RemainingWork
  + W4 × LowProgress
  + W5 × ExamImportance
```

Normalize each component to 0--100.

Example:

``` text
Random Forest

Deadline urgency = 90
Difficulty        = 80
Remaining work    = 100
Low progress      = 95
Exam importance   = 90
```

Then:

``` text
Priority = weighted combination
```

The weights should be configurable.

------------------------------------------------------------------------

# 24. Deadline Urgency

Calculate based on remaining days.

Example conceptual scale:

``` text
Days remaining     Urgency
---------------------------
0                  100
1                  100
2                   90
3                   80
7                   60
14                  35
30                  15
```

Do not use a hardcoded table forever. A continuous function can later
replace it.

------------------------------------------------------------------------

# 25. Remaining Work

Calculate:

``` text
Remaining Work =
Estimated Study Time × (1 - progress / 100)
```

Example:

``` text
Estimated time = 180 minutes
Progress = 25%

Remaining work =
180 × 0.75
= 135 minutes
```

------------------------------------------------------------------------

# 26. Low Progress Score

``` text
LowProgress = 100 - progress_percentage
```

Example:

``` text
Progress = 20%
LowProgress = 80
```

This prevents the system from ignoring weak subjects.

------------------------------------------------------------------------

# 27. Phase 10 --- Study Scheduling Engine

This is the heart of the project.

Input:

``` text
Incomplete tasks
+
Priority scores
+
Available study slots
+
Exam dates
+
Assignment deadlines
+
Estimated duration
```

Output:

``` text
Study sessions
```

------------------------------------------------------------------------

# 28. Scheduling Algorithm

Basic process:

``` text
1. Collect incomplete tasks.
2. Calculate remaining work.
3. Calculate priority score.
4. Sort tasks by priority.
5. Load available study slots.
6. Allocate high-priority tasks first.
7. Split long tasks when necessary.
8. Reserve revision time before exams.
9. Avoid overlapping sessions.
10. Save generated sessions.
```

------------------------------------------------------------------------

# 29. Example

Student has:

``` text
Available:
Monday = 2 hours
Tuesday = 3 hours
Wednesday = 1 hour
```

Tasks:

``` text
ML Random Forest = 3 hours
DBMS Normalization = 2 hours
AI Search Algorithms = 1 hour
```

The scheduler may produce:

``` text
Monday
7:00–8:30 → ML Random Forest
8:30–9:00 → AI Search Algorithms

Tuesday
7:00–8:30 → ML Random Forest
8:30–10:30 → DBMS Normalization

Wednesday
7:00–8:00 → Revision
```

The exact result depends on priorities and deadlines.

------------------------------------------------------------------------

# 30. Scheduling Rules

The scheduler should:

-   Never exceed available time.
-   Never schedule a task after its hard deadline.
-   Avoid overlapping sessions.
-   Prefer high-priority work.
-   Preserve revision time.
-   Split long tasks.
-   Leave small buffers where possible.
-   Prefer the student's preferred study hours.
-   Recalculate when underlying data changes.

------------------------------------------------------------------------

# 31. Phase 11 --- Study Session Tracking

Student sees:

``` text
Today's Plan

7:00–8:00 PM
Decision Trees

[Start]

8:00–9:00 PM
DBMS Normalization

[Start]
```

When completed:

``` text
[Mark Complete]
```

Store:

``` text
actual_minutes
status
completion_percentage
completed_at
```

This historical data becomes critical later.

------------------------------------------------------------------------

# 32. Missed Session Handling

If a session expires without completion:

``` text
PLANNED
   ↓
time passes
   ↓
MISSED
```

Then:

``` text
Missed task
    ↓
Remaining work recalculated
    ↓
Priority recalculated
    ↓
Available future slots loaded
    ↓
Schedule regenerated
```

------------------------------------------------------------------------

# 33. Phase 12 --- Adaptive Rescheduling

This should happen whenever:

-   Student misses a session
-   Student completes less than planned
-   Student completes a task early
-   Exam date changes
-   Assignment deadline changes
-   Topic difficulty changes
-   Available study time changes
-   Student manually asks to reschedule

Flow:

``` text
Existing Plan
      ↓
Student Action
      ↓
Update Progress
      ↓
Recalculate Remaining Work
      ↓
Recalculate Priority
      ↓
Check Available Time
      ↓
Generate Revised Schedule
      ↓
Save New Plan
```

Do not simply move the missed task to the next day.

Recalculate the entire affected planning horizon.

------------------------------------------------------------------------

# 34. Plan Versioning

Store plan versions.

Example:

``` text
Plan v1
Generated: Monday

Plan v2
Generated: Tuesday
Reason: ML session missed

Plan v3
Generated: Wednesday
Reason: Student completed DBMS early
```

This is useful for debugging and analytics.

Suggested table:

``` text
study_plans
-----------
id
user_id
classroom_id
generated_at
valid_from
valid_until
version
reason
status
```

------------------------------------------------------------------------

# 35. Phase 13 --- Dashboard

Dashboard should answer:

> "What is my academic situation right now?"

## Primary cards

``` text
Overall Progress
Study Hours This Week
Pending Tasks
Upcoming Exams
```

## Additional sections

``` text
Today's Study Plan
Subject Progress
Study Hours Graph
Upcoming Deadlines
Upcoming Exams
Weak Subjects
Recent Activity
```

Avoid making "number of uploaded notes" a primary metric. It is useful
as a secondary statistic, but it does not represent academic progress.

------------------------------------------------------------------------

# 36. Subject Progress Calculation

Simple version:

``` text
Subject Progress =
sum(topic progress × topic weight)
/
sum(topic weight)
```

Initially topic weight can be estimated from study time.

Example:

``` text
Topic A = 1 hour, 100%
Topic B = 3 hours, 50%
Topic C = 2 hours, 0%
```

Weighted progress:

``` text
(1×100 + 3×50 + 2×0) / 6
= 41.67%
```

This is more meaningful than simply averaging topic percentages.

------------------------------------------------------------------------

# 37. Overall Progress

Calculate across subjects using weighted workload.

Do not simply average subjects if their workloads differ significantly.

Example:

``` text
ML = 10 hours workload
DBMS = 4 hours
AI = 6 hours
```

The 10-hour ML subject should have more impact than the 4-hour DBMS
subject.

------------------------------------------------------------------------

# 38. Phase 14 --- Calendar / Timetable

Calendar should display:

-   Study sessions
-   Exams
-   Assignments
-   Deadlines
-   Revision sessions

Color/category should distinguish:

``` text
Study
Exam
Assignment
Revision
```

Clicking an event should show:

``` text
Subject
Topic
Duration
Priority
Status
Actions
```

Actions:

``` text
Mark Complete
Mark Missed
Reschedule
Start Session
```

------------------------------------------------------------------------

# 39. Phase 15 --- Notes and PDF Management

Implement:

``` text
POST /subjects/{id}/notes
GET  /subjects/{id}/notes
GET  /notes/{id}
DELETE /notes/{id}
```

Upload flow:

``` text
PDF
 ↓
Validate file
 ↓
Save file
 ↓
Create note record
 ↓
Queue processing
 ↓
Extract text
 ↓
Chunk text
 ↓
Generate embeddings
 ↓
Store vectors
 ↓
Mark note READY
```

------------------------------------------------------------------------

# 40. PDF Processing

Recommended pipeline:

``` text
PDF
 ↓
PyPDF / document loader
 ↓
Raw text
 ↓
Cleaning
 ↓
Chunking
 ↓
Embedding model
 ↓
FAISS
```

Handle:

-   Empty PDFs
-   Scanned PDFs
-   Corrupt PDFs
-   Large files
-   Duplicate uploads

If a PDF is image-only, OCR may be required.

------------------------------------------------------------------------

# 41. Chunking Strategy

Do not put an entire PDF into one vector.

Example:

``` text
Document
 ↓
Pages
 ↓
Sections
 ↓
Chunks
```

A starting point:

``` text
chunk size ≈ 500–1000 tokens
overlap ≈ 50–150 tokens
```

Tune based on retrieval quality.

Store:

``` text
chunk_id
note_id
subject_id
classroom_id
page_number
text
faiss_vector_id
```

------------------------------------------------------------------------

# 42. Phase 16 --- FAISS Vector Index

Maintain indexes with ownership boundaries.

Recommended conceptual structure:

``` text
FAISS
 ├── Classroom A
 │     ├── Subject ML
 │     └── Subject DBMS
 │
 └── Classroom B
       └── Subject AI
```

At minimum, every retrieved vector must carry metadata identifying:

``` text
user
classroom
subject
note
chunk
```

Never return chunks from another user's data.

------------------------------------------------------------------------

# 43. RAG Retrieval Flow

``` text
Student Question
      ↓
Identify classroom / subject context
      ↓
Create query embedding
      ↓
FAISS similarity search
      ↓
Retrieve top-k chunks
      ↓
Filter by ownership / subject
      ↓
Build context
      ↓
Send context + question to Gemini
      ↓
Generate answer
```

------------------------------------------------------------------------

# 44. RAG Prompt Design

The model should be instructed to:

-   Prefer retrieved student material.
-   Clearly state when information is unavailable.
-   Avoid inventing facts from nonexistent notes.
-   Cite the source document/page where possible.
-   Answer according to the selected subject/classroom.

Example:

``` text
You are a study assistant.

Answer using the provided study material.
If the answer is not supported by the retrieved material,
say that the uploaded material does not contain enough information.

Context:
{retrieved_chunks}

Question:
{user_question}
```

------------------------------------------------------------------------

# 45. Phase 17 --- AI Study Assistant

The assistant should support multiple modes.

## Mode 1 --- Notes Q&A

``` text
"Explain Random Forest from my notes."
```

## Mode 2 --- Planning

``` text
"What should I study today?"
```

## Mode 3 --- Progress

``` text
"How am I performing in ML?"
```

## Mode 4 --- Recommendations

``` text
"Which subject needs more attention?"
```

## Mode 5 --- Rescheduling

``` text
"I couldn't study DBMS yesterday."
```

The backend should detect the intent and call the appropriate service.

------------------------------------------------------------------------

# 46. AI Should Not Directly Modify Important Data

Do not allow Gemini to directly execute database operations.

Instead:

``` text
User
 ↓
AI intent detection
 ↓
Structured command
 ↓
Backend validation
 ↓
Scheduler / service
 ↓
Database
```

Example:

``` json
{
  "intent": "MARK_SESSION_MISSED",
  "session_id": 123
}
```

The backend validates whether the session belongs to the authenticated
user before changing it.

------------------------------------------------------------------------

# 47. Phase 18 --- AI Timetable Extraction

Optional but strong feature.

Input:

``` text
Exam timetable PDF/image
```

Pipeline:

``` text
Upload
 ↓
OCR / PDF extraction
 ↓
Gemini structured extraction
 ↓
Detected exams
 ↓
Student confirmation
 ↓
Database
```

Example extracted object:

``` json
{
  "subject": "Machine Learning",
  "exam_date": "2026-11-20",
  "start_time": "10:00",
  "duration_minutes": 180
}
```

Never automatically trust extracted dates. Always provide confirmation
before saving.

------------------------------------------------------------------------

# 48. Phase 19 --- Study Deficit Engine

Calculate:

``` text
Required remaining study time
-
Available future study time
=
Study deficit
```

Example:

``` text
Remaining work = 18 hours
Available time = 14 hours

Deficit = 4 hours
```

Then recommend:

``` text
Add 40 minutes/day
for the next 6 days.
```

This directly addresses the "suggest additional study time" bonus
requirement.

------------------------------------------------------------------------

# 49. Phase 20 --- Weak Subject Detection

A subject can be considered weak based on:

``` text
Low topic completion
+
High difficulty
+
Low study consistency
+
Missed sessions
+
Poor historical performance
```

Example:

``` text
Machine Learning
Progress: 42%
Missed sessions: 4
Exam: 6 days away
```

The system flags:

``` text
HIGH ATTENTION
```

------------------------------------------------------------------------

# 50. Phase 21 --- Performance Prediction

Only implement after enough historical data exists.

Features:

``` text
Average study hours/day
Task completion rate
Missed session rate
Subject progress
Days remaining
Difficulty
Previous performance
```

Output:

``` text
Probability of completing planned syllabus
```

Possible model:

-   Logistic Regression
-   Random Forest
-   XGBoost

For an academic project, start with Logistic Regression or Random Forest
because they are easier to explain.

Do not train a complex model with insufficient data.

------------------------------------------------------------------------

# 51. Phase 22 --- Daily and Weekly Summary

Generate:

## Daily

``` text
Study time
Tasks completed
Tasks missed
Topics completed
Upcoming deadline
Tomorrow's priorities
```

## Weekly

``` text
Total study hours
Planned vs actual
Subject progress
Completion rate
Missed sessions
Strongest subject
Weakest subject
Next week's priorities
```

Gemini can convert structured statistics into natural-language
summaries.

------------------------------------------------------------------------

# 52. Phase 23 --- Charts

Recommended charts:

### Study hours

Line chart:

``` text
Days → Study hours
```

### Subject progress

Bar chart:

``` text
ML      65%
AI      80%
DBMS    45%
CN      60%
```

### Planned vs actual

Bar chart:

``` text
Planned: 18h
Actual:  14h
```

### Completion rate

``` text
Completed / Planned
```

Avoid unnecessary charts. Every chart should answer a useful question.

------------------------------------------------------------------------

# 53. Phase 24 --- Notifications

Notifications can include:

``` text
Exam approaching
Assignment deadline
Study session starting
Missed study session
Schedule updated
Study deficit detected
```

Start with in-app notifications.

Push/email notifications can be added later.

------------------------------------------------------------------------

# 54. REST API Overview

## Authentication

``` text
POST /auth/register
POST /auth/login
GET  /auth/me
```

## Classrooms

``` text
POST   /classrooms
GET    /classrooms
GET    /classrooms/{id}
PUT    /classrooms/{id}
DELETE /classrooms/{id}
```

## Subjects

``` text
POST   /classrooms/{id}/subjects
GET    /classrooms/{id}/subjects
GET    /subjects/{id}
PUT    /subjects/{id}
DELETE /subjects/{id}
```

## Topics

``` text
POST   /subjects/{id}/topics
GET    /subjects/{id}/topics
PUT    /topics/{id}
DELETE /topics/{id}
```

## Exams

``` text
POST   /subjects/{id}/exams
GET    /subjects/{id}/exams
PUT    /exams/{id}
DELETE /exams/{id}
```

## Assignments

``` text
POST   /subjects/{id}/assignments
GET    /subjects/{id}/assignments
PUT    /assignments/{id}
DELETE /assignments/{id}
```

## Availability

``` text
POST   /availability
GET    /availability
PUT    /availability/{id}
DELETE /availability/{id}
```

## Study Plan

``` text
POST /classrooms/{id}/study-plan/generate
GET  /classrooms/{id}/study-plan
POST /study-sessions/{id}/complete
POST /study-sessions/{id}/miss
POST /study-plan/reschedule
```

## Notes

``` text
POST   /subjects/{id}/notes
GET    /subjects/{id}/notes
GET    /notes/{id}
DELETE /notes/{id}
```

## RAG

``` text
POST /rag/query
POST /rag/reindex/{note_id}
```

## Dashboard

``` text
GET /dashboard
GET /dashboard/study-hours
GET /dashboard/progress
GET /dashboard/upcoming
```

## Analytics

``` text
GET /analytics/subjects
GET /analytics/study-time
GET /analytics/completion
GET /analytics/prediction
```

------------------------------------------------------------------------

# 55. Frontend Page Structure

``` text
/pages
├── Login
├── Register
├── Dashboard
├── Classrooms
├── ClassroomDetails
├── SubjectDetails
├── Topics
├── Notes
├── Exams
├── Assignments
├── StudyPlan
├── Calendar
├── Analytics
├── AIStudyAssistant
└── Profile
```

------------------------------------------------------------------------

# 56. Classroom UI

``` text
Computer Science - Semester 7

Overview
Subjects
Notes
Exams
Assignments
Study Plan
Calendar
Analytics
AI Assistant
```

------------------------------------------------------------------------

# 57. Subject UI

Example:

``` text
Machine Learning

Progress: 62%

Topics
├── Linear Regression        ✓
├── Logistic Regression      ✓
├── Decision Trees           60%
├── Random Forest            20%
└── SVM                      0%

Notes
Assignments
Exam
Study Sessions
Ask AI
```

------------------------------------------------------------------------

# 58. Dashboard Data Flow

``` text
Frontend Dashboard
       ↓
GET /dashboard
       ↓
FastAPI
       ↓
Parallel service queries
       ↓
Progress Service
Upcoming Service
Study Hours Service
Plan Service
       ↓
Aggregated response
       ↓
Dashboard
```

Prefer one aggregated dashboard API rather than making the frontend call
15 separate endpoints during initial page load.

------------------------------------------------------------------------

# 59. Security Requirements

Implement:

-   Password hashing
-   JWT authentication
-   Authorization on every resource
-   Input validation
-   File type validation
-   File size limits
-   Secure file naming
-   Ownership checks
-   API rate limiting where appropriate
-   Secrets in environment variables
-   No API keys in frontend
-   No raw passwords in logs

Most importantly:

``` text
User A
cannot access
User B's classroom, notes, vectors, sessions, or analytics.
```

------------------------------------------------------------------------

# 60. RAG Security

Every vector must be traceable to:

``` text
user_id
classroom_id
subject_id
note_id
```

Retrieval must enforce ownership.

A similarity match alone is not enough.

Correct:

``` text
Query
 ↓
FAISS similarity
 ↓
Metadata filter
 ↓
Allowed chunks only
 ↓
LLM
```

------------------------------------------------------------------------

# 61. Error Handling

Define consistent API errors.

Examples:

``` text
400 → Invalid request
401 → Unauthenticated
403 → Unauthorized
404 → Resource not found
409 → Conflict
422 → Validation error
500 → Internal server error
```

Never expose stack traces to users.

------------------------------------------------------------------------

# 62. Testing Strategy

Testing should be implemented alongside modules.

## Unit tests

Test:

-   Priority calculation
-   Deadline urgency
-   Remaining work
-   Subject progress
-   Overall progress
-   Scheduling
-   Rescheduling
-   Study deficit

## API tests

Test:

-   Registration
-   Login
-   Classroom CRUD
-   Subject CRUD
-   Topic CRUD
-   Exams
-   Assignments
-   Study sessions

## RAG tests

Test:

-   PDF extraction
-   Chunking
-   Embedding
-   Retrieval
-   Wrong-subject retrieval
-   Unauthorized retrieval

------------------------------------------------------------------------

# 63. Scheduler Test Cases

The scheduler must be tested against edge cases.

### Case 1

``` text
No available study time
```

Expected:

``` text
No schedule generated
+
Explain deficit
```

### Case 2

``` text
Deadline tomorrow
```

Expected:

``` text
Very high priority
```

### Case 3

``` text
Task requires 5 hours
Available slot = 2 hours
```

Expected:

``` text
Split task
```

### Case 4

``` text
Student misses session
```

Expected:

``` text
Remaining work increases
+
Schedule recalculates
```

### Case 5

``` text
Exam date changed
```

Expected:

``` text
Priority and schedule update
```

------------------------------------------------------------------------

# 64. Recommended Development Milestones

## Milestone 1 --- Foundation

Deliver:

``` text
FastAPI
PostgreSQL
React
Authentication
```

------------------------------------------------------------------------

## Milestone 2 --- Academic Structure

Deliver:

``` text
Classrooms
Subjects
Topics
Exams
Assignments
```

------------------------------------------------------------------------

## Milestone 3 --- Planning Engine

Deliver:

``` text
Availability
Priority scoring
Scheduler
Study sessions
```

This is the most important milestone.

------------------------------------------------------------------------

## Milestone 4 --- Adaptive System

Deliver:

``` text
Completion
Missed sessions
Rescheduling
Plan versioning
```

------------------------------------------------------------------------

## Milestone 5 --- Dashboard

Deliver:

``` text
Progress
Study hours
Upcoming events
Calendar
Charts
```

------------------------------------------------------------------------

## Milestone 6 --- RAG

Deliver:

``` text
PDF upload
Text extraction
Chunking
Embeddings
FAISS
Retrieval
Gemini answers
```

------------------------------------------------------------------------

## Milestone 7 --- AI Layer

Deliver:

``` text
AI assistant
AI summaries
Recommendations
Timetable extraction
```

------------------------------------------------------------------------

## Milestone 8 --- Advanced Intelligence

Deliver:

``` text
Study deficit
Weak subject detection
Performance prediction
Adaptive recommendations
```

------------------------------------------------------------------------

## Milestone 9 --- Production

Deliver:

``` text
Testing
Docker
Deployment
Monitoring
Security review
```

------------------------------------------------------------------------

# 65. Suggested Folder Structure

``` text
intelligent-study-planner/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── context/
│   │   └── utils/
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   │
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── dependencies.py
│   │   │
│   │   ├── db/
│   │   │   ├── session.py
│   │   │   └── base.py
│   │   │
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── classroom.py
│   │   │   ├── subject.py
│   │   │   ├── topic.py
│   │   │   ├── exam.py
│   │   │   ├── assignment.py
│   │   │   ├── study_session.py
│   │   │   ├── study_plan.py
│   │   │   ├── note.py
│   │   │   └── progress.py
│   │   │
│   │   ├── schemas/
│   │   │
│   │   ├── api/
│   │   │   ├── auth.py
│   │   │   ├── classrooms.py
│   │   │   ├── subjects.py
│   │   │   ├── topics.py
│   │   │   ├── exams.py
│   │   │   ├── assignments.py
│   │   │   ├── study_plan.py
│   │   │   ├── notes.py
│   │   │   ├── rag.py
│   │   │   ├── dashboard.py
│   │   │   └── analytics.py
│   │   │
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── progress_service.py
│   │   │   └── dashboard_service.py
│   │   │
│   │   ├── scheduler/
│   │   │   ├── priority.py
│   │   │   ├── allocator.py
│   │   │   ├── rescheduler.py
│   │   │   └── constraints.py
│   │   │
│   │   ├── rag/
│   │   │   ├── loaders.py
│   │   │   ├── chunker.py
│   │   │   ├── embeddings.py
│   │   │   ├── vector_store.py
│   │   │   └── retriever.py
│   │   │
│   │   ├── ai/
│   │   │   ├── gemini.py
│   │   │   ├── prompts.py
│   │   │   ├── assistant.py
│   │   │   ├── extraction.py
│   │   │   └── summaries.py
│   │   │
│   │   └── utils/
│   │
│   ├── migrations/
│   ├── tests/
│   └── requirements.txt
│
├── storage/
│   ├── uploads/
│   └── faiss/
│
├── docs/
│   ├── architecture.md
│   ├── database.md
│   ├── api.md
│   ├── scheduler.md
│   └── rag.md
│
├── docker-compose.yml
└── README.md
```

------------------------------------------------------------------------

# 66. Recommended Build Sequence

The practical order should be:

``` text
DAY / STAGE 1
Project setup
        ↓
Database connection
        ↓
SQLAlchemy models
        ↓
Alembic migrations

STAGE 2
Authentication
        ↓
JWT
        ↓
Protected routes

STAGE 3
Classrooms
        ↓
Subjects
        ↓
Topics

STAGE 4
Exams
        ↓
Assignments
        ↓
Study availability

STAGE 5
Priority engine
        ↓
Scheduling engine
        ↓
Study sessions

STAGE 6
Completion
        ↓
Missed tasks
        ↓
Adaptive rescheduling

STAGE 7
Dashboard
        ↓
Calendar
        ↓
Charts
        ↓
Analytics

STAGE 8
PDF upload
        ↓
Text extraction
        ↓
Chunking
        ↓
Embeddings
        ↓
FAISS

STAGE 9
RAG retrieval
        ↓
Gemini
        ↓
AI Study Assistant

STAGE 10
Timetable extraction
        ↓
AI recommendations
        ↓
Daily/weekly summaries

STAGE 11
Study deficit
        ↓
Weak subject detection
        ↓
Performance prediction

STAGE 12
Testing
        ↓
Security
        ↓
Docker
        ↓
Deployment
```

------------------------------------------------------------------------

# 67. What Should NOT Be Done Early

Avoid these mistakes:

## Do not start with RAG

RAG is not the core problem.

Build the academic data model and scheduler first.

## Do not let Gemini generate the entire timetable

LLMs are useful for interpretation and recommendations, but
deterministic constraints should control scheduling.

## Do not put PDFs inside the database

Store file metadata in PostgreSQL and files in file/object storage.

## Do not treat FAISS as the application database

FAISS is the vector retrieval layer.

## Do not train an ML model immediately

First collect real study-session data.

## Do not build every bonus feature before the core works

The core scheduler must be stable first.

------------------------------------------------------------------------

# 68. Final System Flow

The finished system should operate like this:

``` text
                     STUDENT
                        │
                        ▼
                 REGISTER / LOGIN
                        │
                        ▼
                  CREATE CLASSROOM
                        │
                        ▼
                  ADD SUBJECTS
                        │
                        ▼
                   ADD TOPICS
                        │
             ┌──────────┼───────────┐
             │          │           │
             ▼          ▼           ▼
           EXAMS    ASSIGNMENTS   NOTES
             │          │           │
             │          │           ▼
             │          │       RAG PIPELINE
             │          │           │
             │          │        FAISS
             │          │           │
             └──────────┼───────────┘
                        ▼
              ENTER AVAILABLE TIME
                        │
                        ▼
                PRIORITY ENGINE
                        │
                        ▼
              SCHEDULING ENGINE
                        │
                        ▼
                 STUDY PLAN
                        │
          ┌─────────────┼─────────────┐
          │             │             │
          ▼             ▼             ▼
       CALENDAR      DASHBOARD      AI ASSISTANT
          │             │             │
          └─────────────┼─────────────┘
                        ▼
                  STUDENT STUDIES
                        │
              ┌─────────┴─────────┐
              │                   │
              ▼                   ▼
          COMPLETED             MISSED
              │                   │
              └─────────┬─────────┘
                        ▼
                PROGRESS UPDATE
                        │
                        ▼
              PRIORITY RECALCULATION
                        │
                        ▼
              ADAPTIVE RESCHEDULING
                        │
                        ▼
                 UPDATED PLAN
                        │
                        ▼
                ANALYTICS / ML
                        │
                        ▼
              FUTURE PREDICTION
```

------------------------------------------------------------------------

# 69. Final MVP Definition

The first complete version should contain:

-   User registration/login
-   Classroom creation
-   Subject management
-   Topic management
-   Exam management
-   Assignment management
-   Available study hours
-   Priority calculation
-   Personalized study schedule
-   Calendar
-   Mark complete
-   Mark missed
-   Adaptive rescheduling
-   Subject progress
-   Overall progress
-   Dashboard
-   PDF upload
-   RAG-based notes Q&A

That is already a strong project.

------------------------------------------------------------------------

# 70. Advanced Version

After the MVP works:

-   AI timetable extraction
-   AI recommendations
-   Study deficit detection
-   Weak subject detection
-   Daily summaries
-   Weekly summaries
-   Performance prediction
-   Notifications
-   Advanced analytics
-   Plan version history
-   Mobile application
-   Cloud deployment

------------------------------------------------------------------------

# 71. Final Architecture Principle

The project should be designed around five layers:

``` text
LAYER 1 — DATA
Users
Classrooms
Subjects
Topics
Exams
Assignments
Notes
Progress

        ↓

LAYER 2 — DECISION
Priority Engine
Scheduling Engine
Constraint Engine

        ↓

LAYER 3 — ADAPTATION
Completion Tracking
Missed Task Detection
Rescheduling
Study Deficit

        ↓

LAYER 4 — KNOWLEDGE
PDF Processing
Embeddings
FAISS
RAG
Gemini

        ↓

LAYER 5 — EXPERIENCE
Dashboard
Calendar
Analytics
AI Assistant
Notifications
```

The central engineering principle is:

> **The scheduler decides what should happen. The AI explains, extracts,
> summarizes, and assists. The database records what actually
> happened.**

This separation keeps the project technically defensible and prevents
the AI layer from becoming a black box.

------------------------------------------------------------------------

# 72. Definition of Done

The project is ready for demonstration when a student can perform this
complete flow:

``` text
Register
  ↓
Create "Computer Science - Semester 7"
  ↓
Add ML, AI, DBMS
  ↓
Add topics
  ↓
Add exam dates
  ↓
Add assignment deadlines
  ↓
Set available study hours
  ↓
Generate study plan
  ↓
View plan in calendar
  ↓
Complete study sessions
  ↓
Miss one session
  ↓
System automatically recalculates the schedule
  ↓
Dashboard reflects new progress
  ↓
Upload ML notes PDF
  ↓
System indexes the PDF
  ↓
Ask AI about ML notes
  ↓
RAG retrieves relevant content
  ↓
Gemini answers using the student's notes
  ↓
System shows progress, pending work, deadlines,
and recommended priorities
```

That end-to-end flow is the actual demonstration of the problem
statement.

------------------------------------------------------------------------

# 73. Recommended Immediate Implementation Order

Do not start coding all modules at once.

Start with:

``` text
1. Create repository
2. Create FastAPI backend
3. Create React frontend
4. Connect PostgreSQL
5. Create SQLAlchemy models
6. Run Alembic migrations
7. Implement registration/login
8. Implement classroom CRUD
9. Implement subject CRUD
10. Implement topic CRUD
11. Implement exams
12. Implement assignments
13. Implement study availability
14. Implement priority calculation
15. Implement scheduling engine
16. Test scheduler independently
17. Implement study-session tracking
18. Implement adaptive rescheduling
19. Build dashboard
20. Build calendar
21. Add PDF processing
22. Add FAISS
23. Add RAG
24. Add Gemini assistant
25. Add AI extraction/recommendations
26. Add analytics/prediction
27. Test complete workflows
28. Dockerize
29. Deploy
```

**Do not move to the RAG/AI phase until steps 1--20 work correctly.**
The scheduling engine is the actual core of this project.
