const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema(
  {
    student_id: { type: String, required: true },
    quiz_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    answers: [
      {
        question_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        question_index: Number,
        given_answer: String,
        correct_answer: String,
        is_correct: Boolean,
        points: { type: Number, default: 0 },
      },
    ],
    score: { type: Number, default: 0 },
    max_score: { type: Number, default: 0 },
    time_taken: { type: Number, default: 0 }, // seconds
    rank: { type: Number, default: 0 },
    submitted_at: { type: Date, default: Date.now },
    auto_submitted: { type: Boolean, default: false }, // true if TTL expired
  },
  { timestamps: true }
);

// OBJECTIVE 1 — INDEX: { quiz_id: 1, score: -1 }
quizAttemptSchema.index({ quiz_id: 1, score: -1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
