/**
 * AUTO-SUBMIT MIDDLEWARE
 * 
 * OBJECTIVE 2 — When Redis TTL expires, this middleware checks
 * if a session is still alive before every answer/submit request.
 * 
 * A polling cron job (every 30s) also scans for expired sessions
 * and auto-submits them to MongoDB.
 */

const { getRedis } = require('../config/redis');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Question = require('../models/Question');

const autoSubmitSession = async (quizId, studentId) => {
  const redis = getRedis();
  const sKey = `session:${quizId}:${studentId}`;

  const sessionData = await redis.hgetall(sKey);
  if (!sessionData || Object.keys(sessionData).length === 0) return null;

  const quiz = await Quiz.findById(quizId).populate('question_ids');
  if (!quiz) return null;

  const rawAnswers = sessionData.answers ? JSON.parse(sessionData.answers) : {};
  const startTime = parseInt(sessionData.startTime || Date.now());
  const timeTaken = quiz.duration; // full time used

  let totalScore = 0;
  const maxScore = quiz.question_ids.length * 10;
  const gradedAnswers = quiz.question_ids.map((q, idx) => {
    const given = rawAnswers[idx] || null;
    const correct =
      given && given.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
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

  const attempt = new QuizAttempt({
    student_id: studentId,
    quiz_id: quizId,
    answers: gradedAnswers,
    score: totalScore,
    max_score: maxScore,
    time_taken: timeTaken,
    auto_submitted: true,
  });
  await attempt.save();

  // Update leaderboard with final score
  const lKey = `leaderboard:${quizId}`;
  await redis.zadd(lKey, totalScore, studentId);

  // Clean up Redis session
  await redis.del(sKey);
  console.log(`⏱️  Auto-submitted quiz ${quizId} for student ${studentId}, score: ${totalScore}`);

  return attempt;
};

module.exports = { autoSubmitSession };
