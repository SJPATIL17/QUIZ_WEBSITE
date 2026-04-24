# 🎯 Online Quiz Platform with Real-Time Leaderboard

> **MCA 4055 — NoSQL Database Management Systems Project**
> Built with MongoDB · Redis · Node.js · Express · Vanilla JS

![Platform](https://img.shields.io/badge/Platform-Web-blue)
![Node](https://img.shields.io/badge/Node.js-18%2B-green)
![MongoDB](https://img.shields.io/badge/MongoDB-6%2B-brightgreen)
![Redis](https://img.shields.io/badge/Redis-7%2B-red)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Setup Guide](#-setup-guide)
- [Running the Application](#-running-the-application)
- [Sharing with Others](#-sharing-with-others)
- [API Endpoints](#-api-endpoints)
- [MongoDB Design](#-mongodb-design)
- [Redis Design](#-redis-design)
- [Seeded Data](#-seeded-data)
- [Troubleshooting](#-troubleshooting)

---

## 📖 About the Project

A full-stack timed online quiz platform where:

- 👨‍🏫 **Faculty** creates question banks and assembles quizzes
- 👩‍🎓 **Students** take timed quizzes with a live countdown timer
- 🏆 **Live Leaderboard** updates in real-time as students answer
- 🍃 **MongoDB** stores all permanent data (questions, quizzes, results)
- ⚡ **Redis** handles real-time sessions, spam prevention, and leaderboard

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎯 Timed Quizzes | SVG countdown timer ring synced to Redis TTL |
| 🔒 Anti-Cheat | Redis SET NX prevents re-answering the same question |
| 🏆 Live Leaderboard | Redis Sorted Set updates instantly on correct answers |
| 📊 Analytics | 4 MongoDB aggregation pipelines for faculty insights |
| 🎨 Modern UI | Dark-mode glassmorphism with smooth question transitions |
| 📱 Multi-User | Multiple students can take the same quiz simultaneously |
| ⏰ Auto-Submit | Quiz auto-submits when timer expires (saves to MongoDB) |
| 🌐 LAN Sharing | Share quiz with classmates on the same network |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| API Framework | Express.js 4.x |
| Permanent DB | MongoDB 6+ (Mongoose ODM) |
| Real-time DB | Redis 7+ (ioredis client) |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Config | dotenv |
| Fonts | Google Fonts (Inter) |

---

## 📁 Project Structure

```
project/
├── backend/                        # All server-side code
│   ├── server.js                   # Express entry point (Port 3000)
│   ├── .env                        # Environment variables
│   ├── package.json
│   │
│   ├── config/
│   │   ├── db.js                   # MongoDB connection (Mongoose)
│   │   └── redis.js                # Redis client singleton (ioredis)
│   │
│   ├── models/
│   │   ├── Question.js             # Attribute Pattern schema
│   │   ├── Quiz.js                 # Quiz schema
│   │   └── QuizAttempt.js          # Attempt schema + compound index
│   │
│   ├── routes/
│   │   ├── quiz.js                 # /quiz/* routes
│   │   └── faculty.js             # /faculty/* routes
│   │
│   ├── controllers/
│   │   ├── quizController.js       # Redis logic + quiz flow
│   │   └── facultyController.js   # 4 MongoDB aggregations
│   │
│   ├── middleware/
│   │   └── autoSubmit.js          # TTL expiry auto-submit
│   │
│   └── seed/
│       ├── seed.js                # Seeds 35 questions + 3 quizzes
│       └── aggregations.js        # Runs all 4 aggregations + explain()
│
├── frontend/                       # All client-side code
│   ├── index.html                  # Home — quiz browser
│   ├── quiz.html                   # Quiz page (timer + questions + LB)
│   ├── results.html                # Results — score + breakdown
│   ├── faculty.html               # Faculty dashboard + analytics
│   │
│   ├── css/
│   │   └── style.css              # Dark-mode glassmorphism styles
│   │
│   └── js/
│       └── quiz.js                # Timer, transitions, answer logic
│
├── open_firewall.bat              # Run as Admin to open port 3000
├── QuizPlatform_Postman_Collection.json  # Import into Postman
└── README.md                      # This file
```

---

## ✅ Prerequisites

Before you start, make sure you have these installed:

| Software | Download Link | Check if installed |
|----------|--------------|-------------------|
| **Node.js** (v18+) | https://nodejs.org | `node --version` |
| **MongoDB** | https://www.mongodb.com/try/download/community | Open MongoDB Compass |
| **Redis** | https://redis.io/download | `redis-server --version` |
| **Git** (optional) | https://git-scm.com | `git --version` |

---

## 🚀 Setup Guide

### Step 1 — Clone or Download the Project

```bash
# If using Git:
git clone <your-repo-url>
cd project

# Or just extract the ZIP file and open the folder
```

### Step 2 — Install Node.js Dependencies

```powershell
cd "D:\MIT\MCA SEM2\NOSQL\project\backend"
npm install
```

This installs: `express`, `mongoose`, `ioredis`, `cors`, `dotenv`

### Step 3 — Verify the .env File

Open `backend/.env` and confirm it has:

```env
MONGO_URI=mongodb://localhost:27017/quizplatform
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
PORT=3000
```

> ⚠️ Do NOT change these values unless your MongoDB/Redis run on different ports.

### Step 4 — Start MongoDB

Open **MongoDB Compass** → Click **Connect**

OR via terminal:
```bash
mongod
```

### Step 5 — Start Redis

Open a terminal and run:
```bash
redis-server
```

> Keep this terminal open. Do NOT close it.

### Step 6 — Seed the Database

```powershell
cd "D:\MIT\MCA SEM2\NOSQL\project\backend"
npm run seed
```

Expected output:
```
✅ Connected to MongoDB
🗑️  Cleared existing data
✅ Inserted 35 questions
✅ Created 3 quizzes
  Quiz 1 ID: <id> — JavaScript Fundamentals
  Quiz 2 ID: <id> — Databases & NoSQL
  Quiz 3 ID: <id> — Python & Networking Mix
✅ Created 5 sample quiz attempts
✅ Seeding complete!
```

### Step 7 — (Optional) Verify Aggregations

```powershell
npm run aggregations
```

This prints all 4 aggregation results + index explain() output.

---

## ▶️ Running the Application

### Start the Server

```powershell
cd "D:\MIT\MCA SEM2\NOSQL\project\backend"
npm start
```

Expected output:
```
✅ MongoDB Connected: localhost
✅ Redis Connected

╔══════════════════════════════════════════════════╗
║        🎯  QUIZ PLATFORM  IS  LIVE!             ║
╠══════════════════════════════════════════════════╣
║  👤 Your link  : http://localhost:3000           ║
║  🌐 Others use : http://192.168.x.x:3000        ║
╚══════════════════════════════════════════════════╝
```

### Open in Browser

```
http://localhost:3000
```

---

## 🌐 Sharing with Others (LAN / Public)

### Option A — Same WiFi (LAN)

1. Right-click `open_firewall.bat` → **Run as Administrator** → click Yes
2. Share your IP link shown in the terminal (e.g., `http://192.168.x.x:3000`)
3. Others must be on the **same WiFi network**

> ⚠️ College/university WiFi often blocks device-to-device communication.
> Use a **mobile hotspot** instead if LAN doesn't work.

### Option B — Public URL (Works Anywhere) ✅ Recommended

Open a **second terminal** and run:

```powershell
cd "D:\MIT\MCA SEM2\NOSQL\project"
npx localtunnel --port 3000
```

You'll get a public URL like:
```
your url is: https://red-tips-speak.loca.lt
```

**Share this URL with anyone.**

> When others open the link, they'll see a password screen.
> They enter your IP address (e.g., `10.50.2.192`) and click Submit.
> After that, the quiz site opens normally.

> ⚠️ The URL changes every time you restart `localtunnel`.
> ⚠️ Both `npm start` AND `npx localtunnel` must be running simultaneously.

---

## 📡 API Endpoints

### Quiz Endpoints

| Method | URL | Body | Description |
|--------|-----|------|-------------|
| `GET` | `/quiz/list` | — | List all quizzes |
| `POST` | `/quiz/:id/start` | `{ studentId }` | Start quiz → Redis session |
| `POST` | `/quiz/:id/answer` | `{ studentId, questionIndex, answer }` | Submit answer (NX lock) |
| `GET` | `/quiz/:id/leaderboard` | — | Live top-10 leaderboard |
| `POST` | `/quiz/:id/submit` | `{ studentId, autoSubmit }` | Final submit → MongoDB |
| `GET` | `/quiz/:id/results/:studentId` | — | Get saved results |

### Faculty Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| `POST` | `/faculty/question` | Create a question |
| `POST` | `/faculty/quiz` | Create a quiz |
| `GET` | `/faculty/questions` | List questions (filter by subject/type) |
| `GET` | `/faculty/quizzes` | List all quizzes |
| `GET` | `/faculty/analytics/avg-score` | Avg score per quiz |
| `GET` | `/faculty/analytics/top-students` | Top 5 students |
| `GET` | `/faculty/analytics/difficult-questions` | Questions < 30% correct rate |
| `GET` | `/faculty/analytics/subject-comparison` | Subject-wise comparison |

---

## 🍃 MongoDB Design

### Collections

| Collection | Documents | Purpose |
|-----------|-----------|---------|
| `questions` | 35 | Question bank (Attribute Pattern) |
| `quizzes` | 3 | Quiz config with question references |
| `quizattempts` | 5+ | Student results (permanent) |

### Attribute Pattern (Questions)

```json
{
  "question": "Which is NOT a JS data type?",
  "type": "MCQ",
  "attributes": {
    "options": ["String", "Boolean", "Float", "Symbol"],
    "option_count": 4
  }
}
```

MCQ → has `options[]` · Coding → has `test_cases[]` · True/False → empty `{}`

### Compound Index

```javascript
{ quiz_id: 1, score: -1 }
// Confirmed in explain() — uses IXSCAN not COLLSCAN
```

---

## ⚡ Redis Design

| Key | Type | TTL | Purpose |
|-----|------|-----|---------|
| `session:<quizId>:<studentId>` | HASH | Quiz duration | Active session |
| `leaderboard:<quizId>` | Sorted Set | None | Live rankings |
| `answer:<quizId>:<studentId>:<n>` | String | Quiz duration | Spam lock (NX) |

---

## 🌱 Seeded Data

After running `npm run seed`:

| Item | Count |
|------|-------|
| Total questions | 35 |
| MCQ questions | 20 |
| True/False questions | 10 |
| Coding questions | 5 |
| Subjects | JavaScript, Python, Databases, Networking |
| Quizzes created | 3 |
| Sample attempts | 5 |

### Quiz IDs (from seed output)

| Quiz | Subject | Duration |
|------|---------|---------|
| JavaScript Fundamentals | JavaScript | 10 min |
| Databases & NoSQL | Databases | 15 min |
| Python & Networking Mix | Python | 20 min |

> Quiz IDs are printed when you run `npm run seed`. Copy them for Postman testing.

---

## 🔧 Troubleshooting

### ❌ `npm error: Could not read package.json`

You're in the wrong folder. Always run npm commands from `backend/`:

```powershell
cd "D:\MIT\MCA SEM2\NOSQL\project\backend"
npm start
```

---

### ❌ `MongoDB connection error`

MongoDB is not running. Fix:
1. Open **MongoDB Compass** and click Connect
2. OR run `mongod` in a terminal

---

### ❌ `Redis Error: connect ECONNREFUSED 127.0.0.1:6379`

Redis server is not running. Fix:

```bash
# Open a new terminal and run:
redis-server
```

Keep that terminal open while using the app.

---

### ❌ Others can't access the LAN link

College WiFi isolates devices. Use localtunnel instead:

```powershell
npx localtunnel --port 3000
```

Share the `https://...loca.lt` URL. They enter your IP as the password.

---

### ❌ localtunnel URL stopped working

The tunnel disconnects if idle. Restart it:

```powershell
npx localtunnel --port 3000
```

Share the **new URL** (it changes each time).

---

### ❌ Port 3000 already in use

```powershell
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

---

## 📜 npm Scripts

```powershell
# All commands must be run from: backend/ folder

npm start           # Start the server
npm run seed        # Seed 35 questions + 3 quizzes into MongoDB
npm run aggregations # Run all 4 aggregations + show index explain()
```

---

## 🔐 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGO_URI` | `mongodb://localhost:27017/quizplatform` | MongoDB connection string |
| `REDIS_HOST` | `127.0.0.1` | Redis server host |
| `REDIS_PORT` | `6379` | Redis server port |
| `PORT` | `3000` | Express server port |

---

## 👥 Team

| Name | Role |
|------|------|
| _(Member 1)_ | MongoDB Design & Aggregations |
| _(Member 2)_ | Redis Integration & Real-time Features |
| _(Member 3)_ | Frontend & API Design |

**Faculty Guide:** _(Name)_
**Course:** MCA 4055 — NoSQL Database Management Systems

---

## 📄 License

This project is for academic purposes — MCA Semester 2, NoSQL Project.
