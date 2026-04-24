require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');

const quizRoutes = require('./routes/quiz');
const facultyRoutes = require('./routes/faculty');

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Serve frontend static files ─────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend')));

// ── API Routes ──────────────────────────────────────────────
app.use('/quiz', quizRoutes);
app.use('/faculty', facultyRoutes);

// ── Health check ────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'OK', time: new Date().toISOString() });
});

// ── Serve frontend pages ────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});
app.get('/quiz-page', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/quiz.html'));
});
app.get('/results-page', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/results.html'));
});
app.get('/faculty-page', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/faculty.html'));
});

// ── 404 handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.path} not found` });
});

// ── Error handler ───────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start server ────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const os = require('os');

// Get local WiFi IP address automatically
const getLocalIP = () => {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        // Prefer WiFi/Ethernet (skip virtual adapters)
        if (net.address.startsWith('192.168') || net.address.startsWith('10.')) {
          return net.address;
        }
      }
    }
  }
  return 'localhost';
};

const start = async () => {
  await connectDB();
  const redis = connectRedis();
  await redis.connect().catch(() => {}); // lazyConnect

  // Listen on ALL interfaces so anyone on the same WiFi can connect
  app.listen(PORT, '0.0.0.0', () => {
    const localIP = getLocalIP();
    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║        🎯  QUIZ PLATFORM  IS  LIVE!             ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  👤 Your link  : http://localhost:${PORT}           ║`);
    console.log(`║  🌐 Others use : http://${localIP}:${PORT}     ║`);
    console.log('╠══════════════════════════════════════════════════╣');
    console.log('║  Share the 🌐 link with classmates on same WiFi ║');
    console.log('║  Multiple students can take quiz simultaneously! ║');
    console.log('╚══════════════════════════════════════════════════╝\n');
  });
};

start();
