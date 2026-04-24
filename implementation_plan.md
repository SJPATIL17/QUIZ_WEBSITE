# Online Quiz Platform with Leaderboard — Implementation Plan

## Overview

A full-stack online quiz platform built with Node.js, Express, MongoDB, and Redis. Faculty create quizzes, students take timed quizzes, and a live leaderboard updates in real-time. MongoDB handles permanent storage; Redis handles sessions, answers, and the leaderboard.

---

## Project Structure

```
project/
├── backend/
│   ├── server.js                  # Express app entry point
│   ├── config/
│   │   ├── db.js                  # MongoDB connection (Mongoose)
│   │   └── redis.js               # Redis client (ioredis)
│   ├── models/
│   │   ├── Question.js            # Attribute Pattern schema
│   │   ├── Quiz.js                # Quiz schema
│   │   └── QuizAttempt.js         # Attempt schema
│   ├── routes/
│   │   ├── quiz.js                # All /quiz routes
│   │   └── faculty.js             # Faculty routes (create quiz/questions)
│   ├── controllers/
│   │   ├── quizController.js      # start, answer, submit, leaderboard
│   │   └── facultyController.js   # create questions & quizzes
│   ├── middleware/
│   │   └── autoSubmit.js          # TTL expiry → auto-submit logic
│   ├── seed/
│   │   └── seed.js                # Seeds 30+ questions, quizzes
│   └── package.json
└── frontend/
    ├── index.html                 # Landing / home page
    ├── quiz.html                  # Quiz page (timer, questions, leaderboard sidebar)
    ├── results.html               # Results page (rank, score breakdown)
    ├── faculty.html               # Faculty dashboard (create quiz/questions)
    ├── css/
    │   └── style.css              # Dark-mode, glassmorphism, animations
    └── js/
        ├── quiz.js                # Timer, navigation, answer submission
        ├── leaderboard.js         # Polls /leaderboard every 5s
        ├── results.js             # Renders results page
        └── faculty.js             # Faculty form handling
```

---

## Proposed Changes

### [NEW] Backend — Config

#### [NEW] backend/config/db.js
Mongoose connection with error handling.

#### [NEW] backend/config/redis.js
ioredis client singleton.

---

### [NEW] Backend — Models

#### [NEW] backend/models/Question.js
Attribute Pattern:
- Common: `question`, `type` (MCQ | true_false | coding), `difficulty`, `subject`
- Conditional: `options[]`, `option_count` for MCQ; `test_cases[]` for coding
- `correct_answer`

#### [NEW] backend/models/Quiz.js
- `title`, `subject`, `duration` (seconds), `question_ids[]` (refs)

#### [NEW] backend/models/QuizAttempt.js
- `student_id`, `quiz_id`, `answers[]`, `score`, `time_taken`, `rank`

---

### [NEW] Backend — Routes & Controllers

#### [NEW] backend/routes/quiz.js
```
POST /quiz/:id/start        → quizController.startQuiz
POST /quiz/:id/answer       → quizController.submitAnswer
GET  /quiz/:id/leaderboard  → quizController.getLeaderboard
POST /quiz/:id/submit       → quizController.submitQuiz
GET  /quiz/:id/questions    → quizController.getQuestions
GET  /quiz/:id/results/:sid → quizController.getResults
```

#### [NEW] backend/routes/faculty.js
```
POST /faculty/question      → create question
POST /faculty/quiz          → create quiz
GET  /faculty/questions     → list all questions
GET  /faculty/quizzes       → list all quizzes
```

#### [NEW] backend/controllers/quizController.js

**startQuiz**: 
1. Load quiz + questions from MongoDB
2. Create Redis HASH `session:<quizId>:<studentId>` with TTL = duration
3. Return questions to frontend

**submitAnswer**:
1. SET `answer:<quizId>:<studentId>:<questionNo> NX` (spam prevention)
2. If set succeeds → HSET session answers field
3. Grade on-the-fly, ZINCRBY leaderboard

**getLeaderboard**:
1. ZREVRANGE `leaderboard:<quizId>` 0 9 WITHSCORES

**submitQuiz**:
1. HGETALL session
2. Grade all answers, compute score + time_taken
3. Save QuizAttempt to MongoDB
4. DEL session key & answer keys
5. ZADD final score (if not already there)

---

### [NEW] Backend — Aggregations (seed/aggregations.js)

1. **Average score per quiz** — `$group` on quiz_id
2. **Top 5 students overall** — `$group` on student_id, `$sort` score, `$limit 5`
3. **Difficult questions** — `$match` correct_rate < 0.3
4. **Subject-wise comparison** — `$lookup` quiz → `$group` by subject

---

### [NEW] Backend — Seed (seed/seed.js)

Seeds:
- 30+ questions (MCQ, true_false, coding types across subjects: JavaScript, Python, Databases, Networks)
- 3 quizzes referencing those questions
- 5 sample students with quiz attempts

---

### [NEW] Frontend Pages

#### quiz.html
- Countdown timer (synced via TTL from start response)
- Question card with multiple choice / true-false / coding input
- Question navigation dots
- Live leaderboard sidebar (polls every 5s)
- Auto-submit on timer expiry

#### results.html
- Rank badge
- Score breakdown (question-by-question: correct/wrong)
- Correct answers revealed
- Time taken

#### faculty.html
- Create question form (dynamic fields based on type)
- Create quiz form with question selection
- Preview quiz questions

---

## Redis Commands Reference (for documentation)

```redis
# Session creation with TTL
HSET session:quiz1:stu1 currentQuestion 0 answers "{}"
EXPIRE session:quiz1:stu1 1800

# Spam prevention (NX = only set if not exists)
SET answer:quiz1:stu1:0 "A" NX EX 3600

# Leaderboard operations
ZADD leaderboard:quiz1 0 stu1
ZINCRBY leaderboard:quiz1 10 stu1
ZREVRANGE leaderboard:quiz1 0 9 WITHSCORES

# Check TTL
TTL session:quiz1:stu1

# Cleanup after submit
DEL session:quiz1:stu1
```

---

## Verification Plan

### Automated
- Run `node backend/seed/seed.js` → verify 30+ docs in MongoDB
- Run aggregation queries via `node backend/seed/aggregations.js`

### Browser Testing
- Open frontend, start quiz as "student1"
- Submit answers, verify leaderboard updates
- Let timer expire, verify auto-submit
- Check results page for breakdown

### Postman Tests
```
POST http://localhost:3000/quiz/:id/start   { studentId: "stu1" }
POST http://localhost:3000/quiz/:id/answer  { studentId: "stu1", questionIndex: 0, answer: "A" }
GET  http://localhost:3000/quiz/:id/leaderboard
POST http://localhost:3000/quiz/:id/submit  { studentId: "stu1" }
```
