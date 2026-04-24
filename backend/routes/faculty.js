const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/facultyController');

router.post('/question', ctrl.createQuestion);
router.post('/quiz', ctrl.createQuiz);
router.get('/questions', ctrl.listQuestions);
router.get('/quizzes', ctrl.listQuizzes);

// Analytics — OBJECTIVE 1 Aggregations
router.get('/analytics/avg-score', ctrl.avgScorePerQuiz);
router.get('/analytics/top-students', ctrl.topStudents);
router.get('/analytics/difficult-questions', ctrl.difficultQuestions);
router.get('/analytics/subject-comparison', ctrl.subjectComparison);

module.exports = router;
