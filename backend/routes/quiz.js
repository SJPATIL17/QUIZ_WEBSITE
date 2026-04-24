const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/quizController');

// Core quiz routes (OBJECTIVE 3)
router.get('/list', ctrl.listQuizzes);
router.post('/:id/start', ctrl.startQuiz);
router.post('/:id/answer', ctrl.submitAnswer);
router.get('/:id/leaderboard', ctrl.getLeaderboard);
router.post('/:id/submit', ctrl.submitQuiz);
router.get('/:id/questions', ctrl.getQuestions);
router.get('/:id/results/:studentId', ctrl.getResults);

module.exports = router;
