const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    duration: { type: Number, required: true }, // seconds
    question_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    created_by: { type: String, default: 'faculty' },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Quiz', quizSchema);
