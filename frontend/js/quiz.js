/* ═══════════════════════════════════════════════════════════
   quiz.js — Quiz page logic
   Handles: timer, question rendering, answer submission,
            leaderboard polling, auto-submit on TTL expiry
   ═══════════════════════════════════════════════════════════ */

const API = '';

// ── State ──────────────────────────────────────────────────
let state = null;        // loaded from sessionStorage
let currentIdx = 0;      // current question index displayed
let answeredMap = {};    // { qIndex: answer } — local tracking
let timer = null;        // setInterval handle
let secondsLeft = 0;
let timerDuration = 0;
let submitInProgress = false;

// ── Toast ───────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// ── Load state from sessionStorage ─────────────────────────
function loadState() {
  const raw = sessionStorage.getItem('quizState');
  if (!raw) {
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('error-screen').style.display = 'flex';
    return false;
  }
  state = JSON.parse(raw);
  answeredMap = state.answers || {};
  return true;
}

// ── Render dots ─────────────────────────────────────────────
function renderDots() {
  const nav = document.getElementById('q-nav');
  nav.innerHTML = '';
  state.questions.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'q-dot';
    dot.textContent = i + 1;
    dot.id = `dot-${i}`;
    if (answeredMap[i] !== undefined) dot.classList.add('answered');
    if (i === currentIdx) dot.classList.add('current');
    dot.addEventListener('click', () => navigateTo(i));
    nav.appendChild(dot);
  });
  updateProgress();
}

function updateSingleDot(idx) {
  const dot = document.getElementById(`dot-${idx}`);
  if (!dot) return;
  dot.classList.remove('current', 'answered');
  if (answeredMap[idx] !== undefined) dot.classList.add('answered');
  if (idx === currentIdx) dot.classList.add('current');
}

// ── Progress bar ────────────────────────────────────────────
function updateProgress() {
  const answered = Object.keys(answeredMap).length;
  const total = state.questions.length;
  document.getElementById('progress-fraction').textContent = `${answered}/${total}`;
  document.getElementById('progress-fill').style.width = `${(answered / total) * 100}%`;
}

// ── Render question ─────────────────────────────────────────
function renderQuestion(idx) {
  const q = state.questions[idx];
  if (!q) return;

  const area = document.getElementById('question-area');
  const alreadyAnswered = answeredMap[idx] !== undefined;

  const diffBadge = `<span class="badge diff-${q.difficulty}">${q.difficulty}</span>`;
  const typeBadge = `<span class="badge badge-info">${q.type}</span>`;
  const numBadge  = `<span class="badge badge-primary">Q ${idx + 1} of ${state.questions.length}</span>`;

  let inputHTML = '';

  if (q.type === 'MCQ') {
    const opts = (q.attributes && q.attributes.options) ? q.attributes.options : [];
    const letters = ['A', 'B', 'C', 'D', 'E'];
    inputHTML = `<div class="options-grid">`;
    opts.forEach((opt, oi) => {
      const isSelected = alreadyAnswered && answeredMap[idx] === opt;
      inputHTML += `
        <button class="option-btn ${isSelected ? 'selected' : ''}" data-val="${opt}"
          ${alreadyAnswered ? 'disabled' : ''}>
          <span class="option-label">${letters[oi] || oi}</span>
          <span>${opt}</span>
        </button>`;
    });
    inputHTML += `</div>`;
  } else if (q.type === 'true_false') {
    const given = answeredMap[idx];
    inputHTML = `<div class="tf-grid">
      <button class="tf-btn true-btn ${given === 'true' ? 'selected' : ''}" data-val="true"
        ${alreadyAnswered ? 'disabled' : ''}>✅ True</button>
      <button class="tf-btn false-btn ${given === 'false' ? 'selected' : ''}" data-val="false"
        ${alreadyAnswered ? 'disabled' : ''}>❌ False</button>
    </div>`;
  } else if (q.type === 'coding') {
    const hasTestCases = q.attributes && q.attributes.test_cases && q.attributes.test_cases.length > 0;
    let tcHTML = '';
    if (hasTestCases) {
      tcHTML = `<div class="card" style="padding:0.8rem;margin-top:0.8rem;">
        <div class="section-title" style="margin-bottom:0.5rem;">Sample Test Cases</div>`;
      q.attributes.test_cases.forEach((tc, i) => {
        tcHTML += `<div style="font-size:0.8rem;font-family:'JetBrains Mono',monospace;margin:0.3rem 0;">
          <span style="color:var(--text-muted);">Input:</span> ${tc.input} &nbsp;
          <span style="color:var(--text-muted);">→</span> &nbsp;
          <span style="color:var(--accent-success);">${tc.expected_output}</span>
        </div>`;
      });
      tcHTML += `</div>`;
    }
    const codeVal = alreadyAnswered ? answeredMap[idx] : '';
    inputHTML = `
      ${tcHTML}
      <textarea class="form-control code-input" id="code-answer" placeholder="Write your answer / code here..."
        ${alreadyAnswered ? 'disabled' : ''}>${codeVal}</textarea>
      ${!alreadyAnswered ? `<button class="btn btn-primary" id="submit-code-btn" style="margin-top:0.8rem;">Submit Answer</button>` : ''}`;
  }

  const answeredNotice = alreadyAnswered
    ? `<div class="answered-overlay pending">✅ You answered: <strong>${answeredMap[idx]}</strong></div>`
    : '';

  area.innerHTML = `
    <div class="question-card">
      <div class="question-meta">${numBadge}${diffBadge}${typeBadge}</div>
      <div class="question-text">${q.question}</div>
      ${inputHTML}
      ${answeredNotice}
      <div class="nav-buttons">
        <button class="btn btn-outline" id="prev-btn" ${idx === 0 ? 'disabled' : ''}>← Prev</button>
        <button class="btn btn-outline" id="next-btn" ${idx === state.questions.length - 1 ? 'disabled' : ''}>Next →</button>
      </div>
    </div>`;

  // Bind navigation with direction
  document.getElementById('prev-btn').addEventListener('click', () => navigateTo(currentIdx - 1, 'back'));
  document.getElementById('next-btn').addEventListener('click', () => navigateTo(currentIdx + 1, 'forward'));

  // Bind MCQ options
  area.querySelectorAll('.option-btn').forEach((btn) => {
    btn.addEventListener('click', () => handleAnswer(idx, btn.dataset.val));
  });

  // Bind T/F
  area.querySelectorAll('.tf-btn').forEach((btn) => {
    btn.addEventListener('click', () => handleAnswer(idx, btn.dataset.val));
  });

  // Bind coding submit
  const codeBtn = document.getElementById('submit-code-btn');
  if (codeBtn) {
    codeBtn.addEventListener('click', () => {
      const val = document.getElementById('code-answer').value.trim();
      if (!val) { showToast('Please enter your answer', 'error'); return; }
      handleAnswer(idx, val);
    });
  }
}

// Track direction for slide animation
let isTransitioning = false;

function navigateTo(idx, direction = null) {
  if (idx < 0 || idx >= state.questions.length) return;
  if (isTransitioning) return;

  // Auto-detect direction if not provided
  if (direction === null) direction = idx > currentIdx ? 'forward' : 'back';

  const prev = currentIdx;
  currentIdx = idx;
  updateSingleDot(prev);
  updateSingleDot(idx);
  animateQuestion(idx, direction);
}

function animateQuestion(idx, direction = 'forward') {
  const area = document.getElementById('question-area');
  const existing = area.querySelector('.question-card');

  // If no existing card just render directly
  if (!existing) { renderQuestion(idx); return; }

  isTransitioning = true;

  // Slide OUT current card
  const outX = direction === 'forward' ? '-60px' : '60px';
  existing.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
  existing.style.opacity = '0';
  existing.style.transform = `translateX(${outX})`;

  setTimeout(() => {
    renderQuestion(idx);

    // Slide IN new card from opposite side
    const newCard = area.querySelector('.question-card');
    if (newCard) {
      const inX = direction === 'forward' ? '60px' : '-60px';
      newCard.style.transition = 'none';
      newCard.style.opacity = '0';
      newCard.style.transform = `translateX(${inX})`;

      // Force reflow so transition fires
      newCard.getBoundingClientRect();

      newCard.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      newCard.style.opacity = '1';
      newCard.style.transform = 'translateX(0)';

      setTimeout(() => { isTransitioning = false; }, 260);
    } else {
      isTransitioning = false;
    }
  }, 220);
}

// ── Handle answer submission ─────────────────────────────────
async function handleAnswer(qIdx, answer) {
  if (answeredMap[qIdx] !== undefined) {
    showToast('You already answered this question', 'warning');
    return;
  }

  try {
    const res = await fetch(`${API}/quiz/${state.quizId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: state.studentId,
        questionIndex: qIdx,
        answer,
      }),
    });

    const data = await res.json();

    if (res.status === 409) {
      // Already answered (from server perspective — set NX already existed)
      answeredMap[qIdx] = answer;
      showToast('Answer already recorded', 'warning');
    } else if (!res.ok) {
      showToast(data.error || 'Failed to submit answer', 'error');
      return;
    } else {
      answeredMap[qIdx] = answer;
      if (data.correct) {
        showToast(`✅ Correct! +${data.pointsEarned} points`, 'success');
      } else {
        showToast('❌ Wrong answer', 'error');
      }
    }

    // Update session state
    state.answers = { ...answeredMap };
    sessionStorage.setItem('quizState', JSON.stringify(state));

    // Re-render to show answered state
    renderQuestion(qIdx);
    updateSingleDot(qIdx);
    updateProgress();

    // Auto-advance to next unanswered (with direction)
    const next = findNextUnanswered(qIdx);
    if (next !== null) {
      const dir = next > qIdx ? 'forward' : 'back';
      setTimeout(() => navigateTo(next, dir), 500);
    }
  } catch (err) {
    showToast('Network error — answer may not have been saved', 'error');
  }
}

function findNextUnanswered(from) {
  for (let i = from + 1; i < state.questions.length; i++) {
    if (answeredMap[i] === undefined) return i;
  }
  for (let i = 0; i < from; i++) {
    if (answeredMap[i] === undefined) return i;
  }
  return null;
}

// ── Timer ───────────────────────────────────────────────────
const circumference = 2 * Math.PI * 34; // r=34

function startTimer(seconds) {
  secondsLeft = seconds;
  timerDuration = seconds;
  updateTimerDisplay();

  timer = setInterval(() => {
    secondsLeft--;
    updateTimerDisplay();

    if (secondsLeft <= 0) {
      clearInterval(timer);
      autoSubmit();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const display = document.getElementById('timer-display');
  const arc = document.getElementById('timer-arc');

  display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // Update stroke arc
  const ratio = secondsLeft / timerDuration;
  const offset = circumference * (1 - ratio);
  arc.style.strokeDashoffset = offset;

  // Color warning states
  display.classList.remove('warning', 'danger');
  if (secondsLeft <= 60) {
    display.classList.add('danger');
    arc.style.stroke = '#ff5757';
  } else if (secondsLeft <= timerDuration * 0.25) {
    display.classList.add('warning');
    arc.style.stroke = '#fbbf24';
  }
}

// ── Auto-submit on timer expiry ──────────────────────────────
async function autoSubmit() {
  if (submitInProgress) return;
  submitInProgress = true;
  document.getElementById('timeout-modal').classList.add('open');

  try {
    const res = await fetch(`${API}/quiz/${state.quizId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: state.studentId, autoSubmit: true }),
    });
    const data = await res.json();
    if (res.ok) {
      goToResults(data);
    } else {
      showToast(data.error || 'Auto-submit failed', 'error');
      document.getElementById('timeout-modal').classList.remove('open');
    }
  } catch (err) {
    showToast('Auto-submit network error', 'error');
    document.getElementById('timeout-modal').classList.remove('open');
  }
}

// ── Manual submit flow ───────────────────────────────────────
document.getElementById('submit-btn').addEventListener('click', () => {
  const answered = Object.keys(answeredMap).length;
  const total = state ? state.questions.length : 0;
  document.getElementById('confirm-msg').textContent =
    `You have answered ${answered} out of ${total} questions. Submit now?`;
  document.getElementById('confirm-modal').classList.add('open');
});

document.getElementById('confirm-cancel').addEventListener('click', () => {
  document.getElementById('confirm-modal').classList.remove('open');
});

document.getElementById('confirm-submit').addEventListener('click', async () => {
  if (submitInProgress) return;
  submitInProgress = true;
  clearInterval(timer);
  document.getElementById('confirm-modal').classList.remove('open');
  document.getElementById('confirm-submit').disabled = true;
  document.getElementById('confirm-submit').textContent = 'Submitting...';

  try {
    const res = await fetch(`${API}/quiz/${state.quizId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: state.studentId, autoSubmit: false }),
    });
    const data = await res.json();
    if (res.ok) {
      goToResults(data);
    } else {
      showToast(data.error || 'Submission failed', 'error');
      submitInProgress = false;
    }
  } catch (err) {
    showToast('Network error during submission', 'error');
    submitInProgress = false;
  }
});

function goToResults(data) {
  // Store results for the results page
  sessionStorage.setItem('quizResults', JSON.stringify({
    ...data,
    quizId: state.quizId,
    studentId: state.studentId,
    quizTitle: state.quizTitle,
    questions: state.questions,
  }));
  window.location.href = '/results-page';
}

// ── Leaderboard polling ──────────────────────────────────────
async function fetchLeaderboard() {
  if (!state) return;
  try {
    const res = await fetch(`${API}/quiz/${state.quizId}/leaderboard`);
    const data = await res.json();
    renderLeaderboard(data.leaderboard || []);
    const now = new Date();
    document.getElementById('lb-updated').textContent =
      `Updated ${now.toLocaleTimeString()}`;
  } catch (err) {
    // Silently fail
  }
}

function renderLeaderboard(entries) {
  const list = document.getElementById('leaderboard-list');
  if (entries.length === 0) {
    list.innerHTML = '<p style="font-size:0.82rem;text-align:center;color:var(--text-muted);">No entries yet</p>';
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];
  list.innerHTML = entries.map((e) => {
    const isMe = e.studentId === state.studentId;
    return `<div class="lb-item rank-${e.rank}" style="${isMe ? 'border-color:var(--accent-primary);background:rgba(108,99,255,0.1);' : ''}">
      <span class="lb-rank">${medals[e.rank - 1] || e.rank}</span>
      <span class="lb-name" title="${e.studentId}">${e.studentId}${isMe ? ' <b>(you)</b>' : ''}</span>
      <span class="lb-score">${e.score}</span>
    </div>`;
  }).join('');
}

// ── Initialize page ──────────────────────────────────────────
function init() {
  if (!loadState()) return;

  document.getElementById('loading-screen').style.display = 'none';
  document.getElementById('quiz-main').style.display = 'block';

  document.getElementById('quiz-title-display').textContent = state.quizTitle;
  document.getElementById('quiz-student-display').textContent = `Student: ${state.studentId}`;
  document.getElementById('nav-student-id').textContent = state.studentId;

  renderDots();
  renderQuestion(0);

  startTimer(state.remainingTime || state.duration);

  // Fetch leaderboard immediately, then every 5 seconds
  fetchLeaderboard();
  setInterval(fetchLeaderboard, 5000);
}

init();
