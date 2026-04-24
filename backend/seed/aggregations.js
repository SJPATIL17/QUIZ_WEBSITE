/**
 * AGGREGATIONS DEMO — OBJECTIVE 1
 * Runs all 4 aggregations and prints results + explain() output
 *
 * Run: node seed/aggregations.js
 */

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Question = require('../models/Question');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/quizplatform';

const runAggregations = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB\n');
  console.log('='.repeat(60));

  // ── 1. Average score per quiz ─────────────────────────────
  console.log('\n📊 AGGREGATION 1: Average Score Per Quiz');
  console.log('-'.repeat(40));
  const avgScore = await QuizAttempt.aggregate([
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
  console.log(JSON.stringify(avgScore, null, 2));

  // ── 2. Top 5 students overall ─────────────────────────────
  console.log('\n🏆 AGGREGATION 2: Top 5 Students Overall');
  console.log('-'.repeat(40));
  const topStudents = await QuizAttempt.aggregate([
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
  console.log(JSON.stringify(topStudents, null, 2));

  // ── 3. Difficult questions (correct rate < 30%) ──────────
  console.log('\n❓ AGGREGATION 3: Difficult Questions (correct rate < 30%)');
  console.log('-'.repeat(40));
  const hardQ = await Question.aggregate([
    { $match: { times_answered: { $gt: 0 } } },
    {
      $addFields: {
        correctRate: { $divide: ['$times_correct', '$times_answered'] },
      },
    },
    { $match: { correctRate: { $lt: 0.3 } } },
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
  console.log(JSON.stringify(hardQ, null, 2));
  if (hardQ.length === 0) console.log('  (No questions with < 30% correct rate yet — take more quizzes)');

  // ── 4. Subject-wise comparison ────────────────────────────
  console.log('\n📚 AGGREGATION 4: Subject-Wise Performance Comparison');
  console.log('-'.repeat(40));
  const subjectComp = await QuizAttempt.aggregate([
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
  console.log(JSON.stringify(subjectComp, null, 2));

  // ── 5. INDEX explain() ────────────────────────────────────
  console.log('\n🔍 INDEX EXPLAIN: { quiz_id: 1, score: -1 }');
  console.log('-'.repeat(40));
  const explainResult = await QuizAttempt.find({})
    .sort({ score: -1 })
    .explain('executionStats');
  console.log('  winningPlan stage:', explainResult.queryPlanner?.winningPlan?.stage);
  console.log(
    '  indexName used:',
    explainResult.queryPlanner?.winningPlan?.inputStage?.indexName || 'COLLSCAN (index may not apply without quiz_id filter)'
  );
  const withFilter = await QuizAttempt.find({ quiz_id: (await Quiz.findOne())._id })
    .sort({ score: -1 })
    .explain('executionStats');
  console.log('\n  With quiz_id filter (index should be used):');
  console.log('  winningPlan stage:', withFilter.queryPlanner?.winningPlan?.stage);
  const inputStage = withFilter.queryPlanner?.winningPlan?.inputStage;
  console.log('  indexName:', inputStage?.indexName || inputStage?.inputStage?.indexName || 'IXSCAN');
  console.log('  docsExamined:', withFilter.executionStats?.totalDocsExamined);
  console.log('  keysExamined:', withFilter.executionStats?.totalKeysExamined);
  console.log('  executionTimeMs:', withFilter.executionStats?.executionTimeMillis);

  console.log('\n' + '='.repeat(60));
  console.log('✅ All aggregations completed.\n');

  await mongoose.disconnect();
  process.exit(0);
};

runAggregations().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
