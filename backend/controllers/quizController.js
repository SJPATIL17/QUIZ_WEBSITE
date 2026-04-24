const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const QuizAttempt = require('../models/QuizAttempt');
const { getRedis } = require('../config/redis');

// ─────────────────────────────────────────────────────────────
// HELPER — Build redis key names
// ─────────────────────────────────────────────────────────────
const sessionKey = (quizId, studentId) => `session:${quizId}:${studentId}`;
const leaderboardKey = (quizId) => `leaderboard:${quizId}`;
const answerKey = (quizId, studentId, qNo) =>
  `answer:${quizId}:${studentId}:${qNo}`;

// ─────────────────────────────────────────────────────────────
// OBJECTIVE 2 — HELPER: grade a single answer
// ─────────────────────────────────────────────────────────────
const gradeAnswer = (question, givenAnswer) => {
  if (!givenAnswer) return false;
  return (
    givenAnswer.trim().toLowerCase() ===
    question.correct_answer.trim().toLowerCase()
  );
};

// ─────────────────────────────────────────────────────────────
// POST /quiz/:id/start
// 1. Fetch quiz + questions from MongoDB
// 2. Create Redis HASH session with TTL = quiz.duration
// 3. ZADD student to leaderboard with score 0
// ─────────────────────────────────────────────────────────────
exports.startQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId } = req.body;

    if (!studentId) return res.status(400).json({ error: 'studentId required' });

    const quiz = await Quiz.findById(id).populate('question_ids');
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const redis = getRedis();
    const sKey = sessionKey(id, studentId);

    // Check if already in an active session
    const existing = await redis.exists(sKey);
    if (existing) {
      // Return remaining TTL so frontend can re-sync timer
      const ttl = await redis.ttl(sKey);
      const answersRaw = await redis.hget(sKey, 'answers');
      const answers = answersRaw ? JSON.parse(answersRaw) : {};
      return res.json({
        message: 'Session resumed',
        quizTitle: quiz.title,
        duration: quiz.duration,
        remainingTime: ttl,
        questions: quiz.question_ids,
        answers,
      });
    }

    // ── OBJECTIVE 2: SESSION MANAGEMENT ──
    // HSET session:<quizId>:<studentId>  field value ...
    await redis.hset(sKey, {
      currentQuestion: 0,
      answers: JSON.stringify({}),
      startTime: Date.now().toString(),
      quizId: id,
      studentId,
    });

    // TTL = quiz duration (seconds)
    await redis.expire(sKey, quiz.duration);

    // ── OBJECTIVE 2: LIVE LEADERBOARD ──
    // ZADD leaderboard:<quizId> NX 0 <studentId>
    await redis.zadd(leaderboardKey(id), 'NX', 0, studentId);

    // Strip correct_answer before sending to frontend (anti-cheat)
    const safeQuestions = quiz.question_ids.map((q) => ({
      _id: q._id,
      question: q.question,
      type: q.type,
      difficulty: q.difficulty,
      subject: q.subject,
      attributes: q.attributes,
    }));

    res.json({
      message: 'Quiz started',
      quizTitle: quiz.title,
      subject: quiz.subject,
      duration: quiz.duration,
      remainingTime: quiz.duration,
      questions: safeQuestions,
      answers: {},
    });
  } catch (err) {
    console.error('startQuiz error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /quiz/:id/answer
// OBJECTIVE 2 — SPAM PREVENTION using SET NX
// ─────────────────────────────────────────────────────────────
exports.submitAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId, questionIndex, answer } = req.body;

    if (studentId === undefined || questionIndex === undefined || answer === undefined)
      return res.status(400).json({ error: 'studentId, questionIndex, answer required' });

    const redis = getRedis();
    const sKey = sessionKey(id, studentId);

    // Verify session exists (TTL not expired)
    const exists = await redis.exists(sKey);
    if (!exists)
      return res.status(403).json({ error: 'Session expired or not started' });

    // ── SPAM PREVENTION: SET answer:<quizId>:<studentId>:<qNo> NX ──
    // NX = only set if not exists → prevents re-answering
    const aKey = answerKey(id, studentId, questionIndex);
    const quiz = await Quiz.findById(id).populate('question_ids');
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    // Get TTL remaining for the answer lock (same as session TTL)
    const ttl = await redis.ttl(sKey);
    const lockResult = await redis.set(aKey, answer, 'NX', 'EX', Math.max(ttl, 1));

    if (!lockResult)
      return res.status(409).json({ error: 'Answer already submitted for this question' });

    // ── UPDATE SESSION HASH ──
    const answersRaw = await redis.hget(sKey, 'answers');
    const answers = answersRaw ? JSON.parse(answersRaw) : {};
    answers[questionIndex] = answer;
    await redis.hset(sKey, 'answers', JSON.stringify(answers));
    await redis.hset(sKey, 'currentQuestion', questionIndex + 1);

    // ── REAL-TIME SCORING → ZINCRBY on leaderboard ──
    const question = quiz.question_ids[questionIndex];
    let pointsEarned = 0;
    if (question) {
      const correct = gradeAnswer(question, answer);
      if (correct) {
        pointsEarned = 10;
        // ZINCRBY leaderboard:<quizId> 10 <studentId>
        await redis.zincrby(leaderboardKey(id), 10, studentId);

        // Update analytics on the question doc
        await Question.findByIdAndUpdate(question._id, {
          $inc: { times_answered: 1, times_correct: 1 },
        });
      } else {
        await Question.findByIdAndUpdate(question._id, {
          $inc: { times_answered: 1 },
        });
      }
    }

    res.json({
      message: 'Answer recorded',
      correct: pointsEarned > 0,
      pointsEarned,
    });
  } catch (err) {
    console.error('submitAnswer error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /quiz/:id/leaderboard
// OBJECTIVE 2 — ZREVRANGE top 10 with scores
// ─────────────────────────────────────────────────────────────
exports.getLeaderboard = async (req, res) => {
  try {
    const { id } = req.params;
    const redis = getRedis();

    // ZREVRANGE leaderboard:<quizId> 0 9 WITHSCORES
    const raw = await redis.zrevrange(leaderboardKey(id), 0, 9, 'WITHSCORES');

    const leaderboard = [];
    for (let i = 0; i < raw.length; i += 2) {
      leaderboard.push({
        rank: Math.floor(i / 2) + 1,
        studentId: raw[i],
        score: parseInt(raw[i + 1]),
      });
    }

    res.json({ leaderboard });
  } catch (err) {
    console.error('getLeaderboard error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /quiz/:id/submit  (manual submit OR called by auto-submit)
// OBJECTIVE 2 — END OF QUIZ
// 1. Read answers from Redis session
// 2. Grade all answers
// 3. Save QuizAttempt to MongoDB
// 4. DEL session key + all answer keys
// ─────────────────────────────────────────────────────────────
exports.submitQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId, autoSubmit = false } = req.body;

    if (!studentId) return res.status(400).json({ error: 'studentId required' });

    const redis = getRedis();
    const sKey = sessionKey(id, studentId);

    // Read session data
    const sessionData = await redis.hgetall(sKey);
    if (!sessionData || Object.keys(sessionData).length === 0)
      return res.status(404).json({ error: 'No active session found' });

    const quiz = await Quiz.findById(id).populate('question_ids');
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const rawAnswers = sessionData.answers ? JSON.parse(sessionData.answers) : {};
    const startTime = parseInt(sessionData.startTime || Date.now());
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    // ── GRADE ALL ANSWERS ──
    let totalScore = 0;
    const maxScore = quiz.question_ids.length * 10;
    const gradedAnswers = quiz.question_ids.map((q, idx) => {
      const given = rawAnswers[idx] || null;
      const correct = given ? gradeAnswer(q, given) : false;
      if (correct) totalScore += 10;
      return {
        question_id: q._id,
        question_index: idx,
        given_answer: given,
        correct_answer: q.correct_answer,
        is_correct: correct,
        points: correct ? 10 : 0,
      };
    });

    // ── SAVE TO MONGODB ──
    const attempt = new QuizAttempt({
      student_id: studentId,
      quiz_id: id,
      answers: gradedAnswers,
      score: totalScore,
      max_score: maxScore,
      time_taken: Math.min(timeTaken, quiz.duration),
      auto_submitted: autoSubmit,
    });
    await attempt.save();

    // Compute rank from leaderboard sorted set
    const rankRaw = await redis.zrevrank(leaderboardKey(id), studentId);
    const rank = rankRaw !== null ? rankRaw + 1 : null;
    await QuizAttempt.findByIdAndUpdate(attempt._id, { rank });

    // Update final score in leaderboard (overwrite with accurate graded score)
    await redis.zadd(leaderboardKey(id), totalScore, studentId);

    // ── DELETE REDIS KEYS ──
    await redis.del(sKey);
    // Delete all answer lock keys for this student
    const answerKeys = quiz.question_ids.map((_, idx) =>
      answerKey(id, studentId, idx)
    );
    if (answerKeys.length > 0) await redis.del(...answerKeys);

    res.json({
      message: autoSubmit ? 'Auto-submitted (time expired)' : 'Quiz submitted successfully',
      score: totalScore,
      maxScore,
      timeTaken: Math.min(timeTaken, quiz.duration),
      rank,
      attemptId: attempt._id,
      answers: gradedAnswers,
    });
  } catch (err) {
    console.error('submitQuiz error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /quiz/:id/questions  — for faculty preview / re-fetch
// ─────────────────────────────────────────────────────────────
exports.getQuestions = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('question_ids');
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json({ quiz });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /quiz/:id/results/:studentId
// ─────────────────────────────────────────────────────────────
exports.getResults = async (req, res) => {
  try {
    const { id, studentId } = req.params;
    const attempt = await QuizAttempt.findOne({
      quiz_id: id,
      student_id: studentId,
    })
      .sort({ createdAt: -1 })
      .populate('quiz_id');

    if (!attempt) return res.status(404).json({ error: 'No result found' });

    res.json({ attempt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /quiz/list — list all active quizzes
// ─────────────────────────────────────────────────────────────
exports.listQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ is_active: true }).select(
      'title subject duration question_ids createdAt'
    );
    const data = quizzes.map((q) => ({
      _id: q._id,
      title: q.title,
      subject: q.subject,
      duration: q.duration,
      questionCount: q.question_ids.length,
      createdAt: q.createdAt,
    }));
    res.json({ quizzes: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
