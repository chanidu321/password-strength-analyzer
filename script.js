// --- A small sample of widely-known weak passwords. ---
// In a real product you'd check against a much larger breached-password
// list (e.g. via the HaveIBeenPwned API) instead of a hardcoded array.
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password1',
  '111111', '12345678', 'iloveyou', 'admin', 'welcome', 'monkey',
  'letmein', 'dragon', 'football', 'baseball', 'master', 'sunshine',
  'princess', 'login'
];

// Used to detect keyboard-walk and alphabet/number sequences.
const SEQUENCES = [
  'abcdefghijklmnopqrstuvwxyz',
  '0123456789',
  'qwertyuiop',
  'asdfghjkl',
  'zxcvbnm'
];

// Assumed attacker speed for the crack-time estimate below.
const GUESSES_PER_SECOND = 1e10; // 10 billion guesses/sec, a fast offline attack

function hasRepeatedChars(pw) {
  return /(.)\1\1/.test(pw); // same character 3+ times in a row
}

function hasSequentialChars(pw) {
  const lower = pw.toLowerCase();
  for (const seq of SEQUENCES) {
    const backward = seq.split('').reverse().join('');
    for (let i = 0; i <= seq.length - 4; i++) {
      const forwardChunk = seq.slice(i, i + 4);
      const backwardChunk = backward.slice(i, i + 4);
      if (lower.includes(forwardChunk) || lower.includes(backwardChunk)) {
        return true;
      }
    }
  }
  return false;
}

// Core scoring function. Returns a 0-100 score, a label, and the
// individual checklist results so the UI can render them.
function analyzePassword(pw) {
  const length = pw.length;
  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSymbol = /[^A-Za-z0-9]/.test(pw);

  const varietyCount = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
  const isCommon = COMMON_PASSWORDS.includes(pw.toLowerCase());
  const isRepeated = hasRepeatedChars(pw);
  const isSequential = hasSequentialChars(pw);

  let score = 0;
  score += Math.min(length * 4, 40); // up to 40 pts, maxed out at 10+ characters
  score += varietyCount * 7.5;       // up to 30 pts for using all 4 character types

  if (isRepeated) score -= 15;
  if (isSequential) score -= 15;
  if (isCommon) score -= 50;

  score = Math.max(0, Math.min(100, Math.round(score)));

  let label = 'Weak';
  if (score >= 80) label = 'Strong';
  else if (score >= 55) label = 'Good';
  else if (score >= 30) label = 'Fair';

  return {
    score,
    label,
    checks: {
      length: length >= 12,
      case: hasLower && hasUpper,
      number: hasNumber,
      symbol: hasSymbol,
      pattern: !(isRepeated || isSequential || isCommon)
    }
  };
}

// Maps a 0-100 score to a continuous hue instead of a few fixed colors,
// so the meter shifts smoothly from red through to teal as you type.
function scoreToColor(score) {
  const hue = Math.min(score * 1.3, 160);
  return `hsl(${hue}, 70%, 55%)`;
}

// --- Crack-time estimate ---
// A simplified brute-force model: counts how many character categories
// are actually used, raises that to the power of the password's length,
// then divides by an assumed attack speed. This is a rough estimate for
// learning purposes, not a precise cryptographic guarantee.
function estimateCrackTime(pw) {
  if (COMMON_PASSWORDS.includes(pw.toLowerCase())) {
    return 'Instantly';
  }

  let charsetSize = 0;
  if (/[a-z]/.test(pw)) charsetSize += 26;
  if (/[A-Z]/.test(pw)) charsetSize += 26;
  if (/[0-9]/.test(pw)) charsetSize += 10;
  if (/[^A-Za-z0-9]/.test(pw)) charsetSize += 32;
  if (charsetSize === 0) charsetSize = 1;

  const combinations = Math.pow(charsetSize, pw.length);
  const seconds = combinations / GUESSES_PER_SECOND;
  return formatDuration(seconds);
}

function formatDuration(seconds) {
  if (seconds < 1) return 'Instantly';

  const units = [
    { label: 'second', secs: 1 },
    { label: 'minute', secs: 60 },
    { label: 'hour', secs: 3600 },
    { label: 'day', secs: 86400 },
    { label: 'month', secs: 2592000 },
    { label: 'year', secs: 31536000 },
    { label: 'century', secs: 3153600000 }
  ];

  let chosen = units[0];
  for (const unit of units) {
    if (seconds >= unit.secs) chosen = unit;
  }

  const value = seconds / chosen.secs;
  const rounded = value >= 100 ? Math.round(value) : Math.round(value * 10) / 10;
  const display = rounded >= 1000 ? abbreviateNumber(rounded) : rounded.toString();
  return `${display} ${chosen.label}${rounded === 1 ? '' : 's'}`;
}

function abbreviateNumber(n) {
  const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp'];
  let i = 0;
  while (n >= 1000 && i < suffixes.length - 1) {
    n /= 1000;
    i++;
  }
  return `${n.toFixed(1)}${suffixes[i]}`;
}

// --- Suggestions ---
function buildTips(checks) {
  const tips = [];
  if (!checks.length) tips.push('Use at least 12 characters — every extra character makes it exponentially harder to guess.');
  if (!checks.case) tips.push('Mix uppercase and lowercase letters.');
  if (!checks.number) tips.push('Add at least one number.');
  if (!checks.symbol) tips.push('Add a symbol, like ! @ # or %.');
  if (!checks.pattern) tips.push('Avoid repeated characters, keyboard sequences, or common passwords.');
  return tips;
}

function renderTips(checks) {
  tipsList.innerHTML = '';
  const tips = buildTips(checks);

  if (tips.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'Nice — this password checks every box.';
    li.classList.add('all-good');
    tipsList.appendChild(li);
    return;
  }

  tips.forEach((tip) => {
    const li = document.createElement('li');
    li.textContent = tip;
    tipsList.appendChild(li);
  });
}

const passwordInput = document.getElementById('password-input');
const toggleBtn = document.getElementById('toggle-visibility');
const meterFill = document.getElementById('meter-fill');
const meterLabel = document.getElementById('meter-label');
const checklistItems = document.querySelectorAll('#checklist li');
const crackTimeSection = document.getElementById('crack-time-section');
const crackTimeValue = document.getElementById('crack-time');
const tipsSection = document.getElementById('tips');
const tipsList = document.getElementById('tips-list');
const card = document.getElementById('card');

function render(pw) {
  if (pw.length === 0) {
    meterFill.style.width = '0%';
    meterFill.style.backgroundColor = 'transparent';
    meterFill.style.boxShadow = 'none';
    meterLabel.textContent = 'Enter a password to begin';
    meterLabel.style.color = 'var(--text-dim)';
    checklistItems.forEach((li) => li.classList.remove('met'));
    crackTimeSection.classList.add('hidden');
    tipsSection.classList.add('hidden');
    card.classList.remove('is-strong');
    return;
  }

  const { score, label, checks } = analyzePassword(pw);
  const color = scoreToColor(score);

  meterFill.style.width = `${score}%`;
  meterFill.style.backgroundColor = color;
  meterFill.style.boxShadow = `0 0 12px ${color}`;

  meterLabel.textContent = `${label} · ${score}/100`;
  meterLabel.style.color = color;

  checklistItems.forEach((li) => {
    const key = li.dataset.check;
    li.classList.toggle('met', checks[key]);
  });

  crackTimeSection.classList.remove('hidden');
  crackTimeValue.textContent = estimateCrackTime(pw);
  crackTimeValue.style.color = color;

  tipsSection.classList.remove('hidden');
  renderTips(checks);

  card.classList.toggle('is-strong', label === 'Strong');
}

passwordInput.addEventListener('input', (e) => render(e.target.value));

toggleBtn.addEventListener('click', () => {
  const isHidden = passwordInput.type === 'password';
  passwordInput.type = isHidden ? 'text' : 'password';
  toggleBtn.textContent = isHidden ? 'Hide' : 'Show';
});

render(''); // initial state
