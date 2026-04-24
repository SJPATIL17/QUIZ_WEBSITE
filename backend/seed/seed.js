/**
 * SEED FILE — OBJECTIVE 1
 * Seeds 30+ questions (MCQ, true_false, coding) across 4 subjects
 * Seeds 3 quizzes and 5 sample student attempts
 *
 * Run: node seed/seed.js
 */

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Question = require('../models/Question');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/quizplatform';

// ─────────────────────────────────────────────────────────────
// 30+ QUESTIONS (Attribute Pattern)
// ─────────────────────────────────────────────────────────────
const questionsData = [
  // ── JAVASCRIPT (MCQ) ──────────────────────────────────────
  {
    question: 'Which of the following is NOT a JavaScript data type?',
    type: 'MCQ',
    difficulty: 'easy',
    subject: 'JavaScript',
    correct_answer: 'Float',
    attributes: {
      options: ['String', 'Boolean', 'Float', 'Symbol'],
      option_count: 4,
    },
  },
  {
    question: 'What does `typeof null` return in JavaScript?',
    type: 'MCQ',
    difficulty: 'medium',
    subject: 'JavaScript',
    correct_answer: 'object',
    attributes: {
      options: ['null', 'undefined', 'object', 'boolean'],
      option_count: 4,
    },
  },
  {
    question: 'Which method converts a JSON string to a JavaScript object?',
    type: 'MCQ',
    difficulty: 'easy',
    subject: 'JavaScript',
    correct_answer: 'JSON.parse()',
    attributes: {
      options: ['JSON.stringify()', 'JSON.parse()', 'JSON.convert()', 'JSON.decode()'],
      option_count: 4,
    },
  },
  {
    question: 'What is the output of `console.log(0.1 + 0.2 === 0.3)` in JavaScript?',
    type: 'MCQ',
    difficulty: 'hard',
    subject: 'JavaScript',
    correct_answer: 'false',
    attributes: {
      options: ['true', 'false', 'undefined', 'NaN'],
      option_count: 4,
    },
  },
  {
    question: 'Which keyword is used to declare a block-scoped variable in JavaScript?',
    type: 'MCQ',
    difficulty: 'easy',
    subject: 'JavaScript',
    correct_answer: 'let',
    attributes: {
      options: ['var', 'let', 'define', 'scope'],
      option_count: 4,
    },
  },
  {
    question: 'What does the `spread` operator (`...`) do in JavaScript?',
    type: 'MCQ',
    difficulty: 'medium',
    subject: 'JavaScript',
    correct_answer: 'Expands an iterable into individual elements',
    attributes: {
      options: [
        'Combines two arrays',
        'Expands an iterable into individual elements',
        'Creates a shallow copy only of objects',
        'Converts a string to an array',
      ],
      option_count: 4,
    },
  },
  {
    question: 'Which array method returns a new array with all elements that pass the test?',
    type: 'MCQ',
    difficulty: 'easy',
    subject: 'JavaScript',
    correct_answer: 'filter()',
    attributes: {
      options: ['map()', 'filter()', 'reduce()', 'find()'],
      option_count: 4,
    },
  },
  {
    question: 'Promises in JavaScript are used to handle ___.',
    type: 'MCQ',
    difficulty: 'medium',
    subject: 'JavaScript',
    correct_answer: 'Asynchronous operations',
    attributes: {
      options: [
        'Synchronous loops',
        'Asynchronous operations',
        'DOM manipulation',
        'Type checking',
      ],
      option_count: 4,
    },
  },

  // ── JAVASCRIPT (True/False) ───────────────────────────────
  {
    question: 'JavaScript is a statically typed language.',
    type: 'true_false',
    difficulty: 'easy',
    subject: 'JavaScript',
    correct_answer: 'false',
    attributes: {},
  },
  {
    question: 'Arrow functions in JavaScript have their own `this` context.',
    type: 'true_false',
    difficulty: 'medium',
    subject: 'JavaScript',
    correct_answer: 'false',
    attributes: {},
  },

  // ── PYTHON (MCQ) ──────────────────────────────────────────
  {
    question: 'Which of the following is a mutable data type in Python?',
    type: 'MCQ',
    difficulty: 'easy',
    subject: 'Python',
    correct_answer: 'list',
    attributes: {
      options: ['tuple', 'string', 'list', 'frozenset'],
      option_count: 4,
    },
  },
  {
    question: 'What is the output of `len("Hello, World!") in Python`?',
    type: 'MCQ',
    difficulty: 'easy',
    subject: 'Python',
    correct_answer: '13',
    attributes: {
      options: ['12', '13', '11', '14'],
      option_count: 4,
    },
  },
  {
    question: 'Which keyword is used to define a function in Python?',
    type: 'MCQ',
    difficulty: 'easy',
    subject: 'Python',
    correct_answer: 'def',
    attributes: {
      options: ['func', 'function', 'def', 'define'],
      option_count: 4,
    },
  },
  {
    question: 'What is a lambda function in Python?',
    type: 'MCQ',
    difficulty: 'medium',
    subject: 'Python',
    correct_answer: 'An anonymous one-line function',
    attributes: {
      options: [
        'A function that runs asynchronously',
        'An anonymous one-line function',
        'A built-in Python class',
        'A decorator function',
      ],
      option_count: 4,
    },
  },
  {
    question: 'Which Python module is used for regular expressions?',
    type: 'MCQ',
    difficulty: 'medium',
    subject: 'Python',
    correct_answer: 're',
    attributes: {
      options: ['regex', 're', 'regexp', 'pattern'],
      option_count: 4,
    },
  },
  {
    question: 'What is the time complexity of accessing an element in a Python dict?',
    type: 'MCQ',
    difficulty: 'hard',
    subject: 'Python',
    correct_answer: 'O(1)',
    attributes: {
      options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'],
      option_count: 4,
    },
  },

  // ── PYTHON (True/False) ───────────────────────────────────
  {
    question: 'Python supports multiple inheritance.',
    type: 'true_false',
    difficulty: 'easy',
    subject: 'Python',
    correct_answer: 'true',
    attributes: {},
  },
  {
    question: 'In Python, indentation is optional and only used for readability.',
    type: 'true_false',
    difficulty: 'easy',
    subject: 'Python',
    correct_answer: 'false',
    attributes: {},
  },

  // ── PYTHON (coding) ───────────────────────────────────────
  {
    question: 'Write Python code to reverse a string `s`.',
    type: 'coding',
    difficulty: 'easy',
    subject: 'Python',
    correct_answer: 's[::-1]',
    attributes: {
      test_cases: [
        { input: 'hello', expected_output: 'olleh' },
        { input: 'python', expected_output: 'nohtyp' },
      ],
    },
  },

  // ── DATABASES (MCQ) ───────────────────────────────────────
  {
    question: 'What does SQL stand for?',
    type: 'MCQ',
    difficulty: 'easy',
    subject: 'Databases',
    correct_answer: 'Structured Query Language',
    attributes: {
      options: [
        'Simple Query Language',
        'Structured Query Language',
        'Sequential Query Logic',
        'Standard Query Layer',
      ],
      option_count: 4,
    },
  },
  {
    question: 'Which NoSQL database is primarily key-value based and used for caching?',
    type: 'MCQ',
    difficulty: 'medium',
    subject: 'Databases',
    correct_answer: 'Redis',
    attributes: {
      options: ['MongoDB', 'Cassandra', 'Redis', 'Neo4j'],
      option_count: 4,
    },
  },
  {
    question: 'What is the purpose of an index in a database?',
    type: 'MCQ',
    difficulty: 'easy',
    subject: 'Databases',
    correct_answer: 'Speed up data retrieval',
    attributes: {
      options: [
        'Enforce data integrity',
        'Speed up data retrieval',
        'Store encrypted data',
        'Backup the database',
      ],
      option_count: 4,
    },
  },
  {
    question: 'Which MongoDB aggregation stage is used to filter documents?',
    type: 'MCQ',
    difficulty: 'medium',
    subject: 'Databases',
    correct_answer: '$match',
    attributes: {
      options: ['$filter', '$where', '$match', '$select'],
      option_count: 4,
    },
  },
  {
    question: 'What is the CAP theorem in distributed databases?',
    type: 'MCQ',
    difficulty: 'hard',
    subject: 'Databases',
    correct_answer: 'Consistency, Availability, Partition Tolerance',
    attributes: {
      options: [
        'Concurrency, Atomicity, Performance',
        'Consistency, Availability, Partition Tolerance',
        'Caching, Access, Processing',
        'Constraints, Aggregation, Pipeline',
      ],
      option_count: 4,
    },
  },
  {
    question: 'Which command in Redis adds a member with a score to a sorted set?',
    type: 'MCQ',
    difficulty: 'medium',
    subject: 'Databases',
    correct_answer: 'ZADD',
    attributes: {
      options: ['SADD', 'ZADD', 'LPUSH', 'HSET'],
      option_count: 4,
    },
  },

  // ── DATABASES (True/False) ────────────────────────────────
  {
    question: 'MongoDB stores data in BSON (Binary JSON) format.',
    type: 'true_false',
    difficulty: 'easy',
    subject: 'Databases',
    correct_answer: 'true',
    attributes: {},
  },
  {
    question: 'A Redis sorted set allows duplicate member names.',
    type: 'true_false',
    difficulty: 'medium',
    subject: 'Databases',
    correct_answer: 'false',
    attributes: {},
  },

  // ── NETWORKING (MCQ) ─────────────────────────────────────
  {
    question: 'What does HTTP stand for?',
    type: 'MCQ',
    difficulty: 'easy',
    subject: 'Networking',
    correct_answer: 'HyperText Transfer Protocol',
    attributes: {
      options: [
        'HyperText Transfer Protocol',
        'High Transfer Text Protocol',
        'HyperText Transmission Protocol',
        'Hybrid Text Transfer Protocol',
      ],
      option_count: 4,
    },
  },
  {
    question: 'Which HTTP status code indicates a "Not Found" error?',
    type: 'MCQ',
    difficulty: 'easy',
    subject: 'Networking',
    correct_answer: '404',
    attributes: {
      options: ['200', '301', '404', '500'],
      option_count: 4,
    },
  },
  {
    question: 'Which protocol is used for secure web communication?',
    type: 'MCQ',
    difficulty: 'easy',
    subject: 'Networking',
    correct_answer: 'HTTPS',
    attributes: {
      options: ['FTP', 'HTTP', 'HTTPS', 'SMTP'],
      option_count: 4,
    },
  },
  {
    question: 'What is the default port for MongoDB?',
    type: 'MCQ',
    difficulty: 'medium',
    subject: 'Networking',
    correct_answer: '27017',
    attributes: {
      options: ['3306', '5432', '27017', '6379'],
      option_count: 4,
    },
  },
  {
    question: 'What does DNS stand for?',
    type: 'MCQ',
    difficulty: 'easy',
    subject: 'Networking',
    correct_answer: 'Domain Name System',
    attributes: {
      options: [
        'Data Network Service',
        'Domain Name System',
        'Dynamic Name Server',
        'Distributed Network System',
      ],
      option_count: 4,
    },
  },
  {
    question: 'Which layer of the OSI model is responsible for routing packets?',
    type: 'MCQ',
    difficulty: 'hard',
    subject: 'Networking',
    correct_answer: 'Network layer (Layer 3)',
    attributes: {
      options: [
        'Physical layer (Layer 1)',
        'Data Link layer (Layer 2)',
        'Network layer (Layer 3)',
        'Transport layer (Layer 4)',
      ],
      option_count: 4,
    },
  },

  // ── NETWORKING (True/False) ───────────────────────────────
  {
    question: 'TCP is a connectionless protocol.',
    type: 'true_false',
    difficulty: 'medium',
    subject: 'Networking',
    correct_answer: 'false',
    attributes: {},
  },
  {
    question: 'The default port for Redis is 6379.',
    type: 'true_false',
    difficulty: 'easy',
    subject: 'Networking',
    correct_answer: 'true',
    attributes: {},
  },
];

// ─────────────────────────────────────────────────────────────
// SEED FUNCTION
// ─────────────────────────────────────────────────────────────
const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Question.deleteMany({});
    await Quiz.deleteMany({});
    await QuizAttempt.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Insert questions
    const insertedQuestions = await Question.insertMany(questionsData);
    console.log(`✅ Inserted ${insertedQuestions.length} questions`);

    // Group by subject for quiz creation
    const bySubject = {};
    insertedQuestions.forEach((q) => {
      if (!bySubject[q.subject]) bySubject[q.subject] = [];
      bySubject[q.subject].push(q._id);
    });

    // Create 3 quizzes
    const quiz1 = await Quiz.create({
      title: 'JavaScript Fundamentals',
      subject: 'JavaScript',
      duration: 600, // 10 minutes
      question_ids: bySubject['JavaScript'],
    });

    const quiz2 = await Quiz.create({
      title: 'Databases & NoSQL',
      subject: 'Databases',
      duration: 900, // 15 minutes
      question_ids: bySubject['Databases'],
    });

    const quiz3 = await Quiz.create({
      title: 'Python & Networking Mix',
      subject: 'Python',
      duration: 1200, // 20 minutes
      question_ids: [
        ...bySubject['Python'],
        ...bySubject['Networking'],
      ],
    });

    console.log('✅ Created 3 quizzes');
    console.log('  Quiz 1 ID:', quiz1._id, '—', quiz1.title);
    console.log('  Quiz 2 ID:', quiz2._id, '—', quiz2.title);
    console.log('  Quiz 3 ID:', quiz3._id, '—', quiz3.title);

    // ── SAMPLE ATTEMPTS ──────────────────────────────────────
    // Simulate 5 students attempting quiz1
    const students = ['alice', 'bob', 'charlie', 'diana', 'eve'];
    const quiz1Questions = await Quiz.findById(quiz1._id).populate('question_ids');
    const q1Qs = quiz1Questions.question_ids;

    const attempts = [];
    for (let i = 0; i < students.length; i++) {
      const stu = students[i];
      // Simulate varying performance
      const correctCount = Math.floor(Math.random() * q1Qs.length);
      const answers = q1Qs.map((q, idx) => {
        const isCorrect = idx < correctCount;
        const given = isCorrect ? q.correct_answer : (q.type === 'MCQ' ? q.attributes.options[1] : 'wrong');
        return {
          question_id: q._id,
          question_index: idx,
          given_answer: given,
          correct_answer: q.correct_answer,
          is_correct: isCorrect,
          points: isCorrect ? 10 : 0,
        };
      });
      const score = correctCount * 10;

      // Update analytics
      for (let j = 0; j < q1Qs.length; j++) {
        const isCorrect = j < correctCount;
        await Question.findByIdAndUpdate(q1Qs[j]._id, {
          $inc: { times_answered: 1, times_correct: isCorrect ? 1 : 0 },
        });
      }

      attempts.push({
        student_id: stu,
        quiz_id: quiz1._id,
        answers,
        score,
        max_score: q1Qs.length * 10,
        time_taken: Math.floor(Math.random() * 600) + 60,
        rank: i + 1,
      });
    }

    await QuizAttempt.insertMany(attempts);
    console.log('✅ Created 5 sample quiz attempts');

    console.log('\n📋 QUIZ IDs (copy these for testing):');
    console.log('  JS Quiz:         ', quiz1._id.toString());
    console.log('  Databases Quiz:  ', quiz2._id.toString());
    console.log('  Python+Net Quiz: ', quiz3._id.toString());

    console.log('\n✅ Seeding complete! Total documents:');
    console.log('  Questions:', insertedQuestions.length);
    console.log('  Quizzes: 3');
    console.log('  Attempts:', attempts.length);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seed();
