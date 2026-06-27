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

function hasRepeatedChars(pw) {
  // matches any character repeated 3+ times in a row, e.g. "aaa", "111"
  return /(.)\1\1/.test(pw);
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

const passwordInput = document.getElementById('password-input');
const toggleBtn = document.getElementById('toggle-visibility');
const meterFill = document.getElementById('meter-fill');
const meterLabel = document.getElementById('meter-label');
const checklistItems = document.querySelectorAll('#checklist li');

function render(pw) {
  if (pw.length === 0) {
    meterFill.style.width = '0%';
    meterFill.style.backgroundColor = 'transparent';
    meterFill.style.boxShadow = 'none';
    meterLabel.textContent = 'Enter a password to begin';
    meterLabel.style.color = 'var(--text-dim)';
    checklistItems.forEach((li) => li.classList.remove('met'));
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
}

passwordInput.addEventListener('input', (e) => render(e.target.value));

toggleBtn.addEventListener('click', () => {
  const isHidden = passwordInput.type === 'password';
  passwordInput.type = isHidden ? 'text' : 'password';
  toggleBtn.textContent = isHidden ? 'Hide' : 'Show';
});

render(''); // initial state
