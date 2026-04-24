const Question = require('../models/Question');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');

// ─────────────────────────────────────────────────────────────
// POST /faculty/question
// ─────────────────────────────────────────────────────────────
exports.createQuestion = async (req, res) => {
  try {
    const { question, type, difficulty, subject, correct_answer, attributes } = req.body;
    const q = new Question({ question, type, difficulty, subject, correct_answer, attributes: attributes || {} });
    await q.save();
    res.status(201).json({ message: 'Question created', question: q });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /faculty/quiz
// ─────────────────────────────────────────────────────────────
exports.createQuiz = async (req, res) => {
  try {
    const { title, subject, duration, question_ids } = req.body;
    const quiz = new Quiz({ title, subject, duration, question_ids });
    await quiz.save();
    res.status(201).json({ message: 'Quiz created', quiz });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /faculty/questions
// ─────────────────────────────────────────────────────────────
exports.listQuestions = async (req, res) => {
  try {
    const { subject, type, difficulty } = req.query;
    const filter = {};
    if (subject) filter.subject = subject;
    if (type) filter.type = type;
    if (difficulty) filter.difficulty = difficulty;
    const questions = await Question.find(filter);
    res.json({ count: questions.length, questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /faculty/quizzes
// ─────────────────────────────────────────────────────────────
exports.listQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find().populate('question_ids', 'question type difficulty');
    res.json({ quizzes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// OBJECTIVE 1 — AGGREGATIONS
// GET /faculty/analytics/avg-score
// ─────────────────────────────────────────────────────────────
exports.avgScorePerQuiz = async (req, res) => {
  try {
    const result = await QuizAttempt.aggregate([
      {
        $group: {
          _id: '$quiz_id',
          averageScore: { $avg: '$score' },
          maxPossible: { $avg: '$max_score' },
          totalAttempts: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'quizzes',
          localField: '_id',
          foreignField: '_id',
          as: 'quiz',
        },
      },
      { $unwind: { path: '$quiz', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          quizTitle: '$quiz.title',
          subject: '$quiz.subject',
          averageScore: { $round: ['$averageScore', 2] },
          maxPossible: 1,
          totalAttempts: 1,
          percentage: {
            $round: [
              { $multiply: [{ $divide: ['$averageScore', '$maxPossible'] }, 100] },
              1,
            ],
          },
        },
      },
      { $sort: { averageScore: -1 } },
    ]);
    res.json({ avgScorePerQuiz: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /faculty/analytics/top-students
// OBJECTIVE 1 — Top 5 students overall
// ─────────────────────────────────────────────────────────────
exports.topStudents = async (req, res) => {
  try {
    const result = await QuizAttempt.aggregate([
      {
        $group: {
          _id: '$student_id',
          totalScore: { $sum: '$score' },
          quizzesTaken: { $sum: 1 },
          avgScore: { $avg: '$score' },
        },
      },
      { $sort: { totalScore: -1 } },
      { $limit: 5 },
      {
        $project: {
          studentId: '$_id',
          totalScore: 1,
          quizzesTaken: 1,
          avgScore: { $round: ['$avgScore', 2] },
          _id: 0,
        },
      },
    ]);
    res.json({ top5Students: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /faculty/analytics/difficult-questions
// OBJECTIVE 1 — Questions with correct rate < 30%
// ─────────────────────────────────────────────────────────────
exports.difficultQuestions = async (req, res) => {
  try {
    const result = await Question.aggregate([
      {
        $match: { times_answered: { $gt: 0 } },
      },
      {
        $addFields: {
          correctRate: {
            $divide: ['$times_correct', '$times_answered'],
          },
        },
      },
      {
        $match: { correctRate: { $lt: 0.3 } },
      },
      {
        $project: {
          question: 1,
          type: 1,
          difficulty: 1,
          subject: 1,
          times_answered: 1,
          times_correct: 1,
          correctRate: { $round: ['$correctRate', 3] },
        },
      },
      { $sort: { correctRate: 1 } },
    ]);
    res.json({ hardQuestions: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /faculty/analytics/subject-comparison
// OBJECTIVE 1 — Subject-wise performance comparison
// ─────────────────────────────────────────────────────────────
exports.subjectComparison = async (req, res) => {
  try {
    const result = await QuizAttempt.aggregate([
      {
        $lookup: {
          from: 'quizzes',
          localField: 'quiz_id',
          foreignField: '_id',
          as: 'quiz',
        },
      },
      { $unwind: '$quiz' },
      {
        $group: {
          _id: '$quiz.subject',
          avgScore: { $avg: '$score' },
          totalAttempts: { $sum: 1 },
          highestScore: { $max: '$score' },
          lowestScore: { $min: '$score' },
        },
      },
      {
        $project: {
          subject: '$_id',
          avgScore: { $round: ['$avgScore', 2] },
          totalAttempts: 1,
          highestScore: 1,
          lowestScore: 1,
          _id: 0,
        },
      },
      { $sort: { avgScore: -1 } },
    ]);
    res.json({ subjectComparison: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
