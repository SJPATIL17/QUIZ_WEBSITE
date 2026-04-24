const mongoose = require('mongoose');

/**
 * OBJECTIVE 1 — ATTRIBUTE PATTERN
 * Common fields are on top-level. Type-specific fields live inside
 * the `attributes` sub-document so the collection stays flexible.
 *
 * MCQ      → attributes: { options: [...], option_count: N }
 * coding   → attributes: { test_cases: [...] }
 * true_false → attributes: {}  (no extra fields needed)
 */
const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    type: {
      type: String,
      enum: ['MCQ', 'true_false', 'coding'],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    subject: { type: String, required: true },
    correct_answer: { type: String, required: true },

    // ── Attribute Pattern ────────────────────────────────────────────
    // Type-specific fields stored here instead of sparse top-level fields
    attributes: {
      // MCQ fields
      options: [String],
      option_count: Number,

      // coding fields
      test_cases: [
        {
          input: String,
          expected_output: String,
        },
      ],
    },

    // Analytics helper — updated each time an attempt is graded
    times_answered: { type: Number, default: 0 },
    times_correct: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Question', questionSchema);
