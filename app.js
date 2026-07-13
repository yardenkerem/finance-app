// Shared logic for Focusing Finance

function getIncomes() {
  return JSON.parse(localStorage.getItem('ff_incomes') || '[]');
}

function getSettings() {
  return JSON.parse(localStorage.getItem('ff_settings') || '{"incomeTaxRate":0}');
}

// Returns true if jars should be unlocked (2+ months since first income)
function jarsUnlocked() {
  const incomes = getIncomes();
  if (incomes.length === 0) return false;

  const sorted = [...incomes].sort((a, b) => new Date(a.date) - new Date(b.date));
  const firstDate = new Date(sorted[0].date);
  const now = new Date();

  // At least 2 full months have passed
  const monthsDiff =
    (now.getFullYear() - firstDate.getFullYear()) * 12 +
    (now.getMonth() - firstDate.getMonth());

  return monthsDiff >= 2;
}

// Returns how many months until jars unlock (0 = unlocked)
function monthsUntilJars() {
  const incomes = getIncomes();
  if (incomes.length === 0) return 2;

  const sorted = [...incomes].sort((a, b) => new Date(a.date) - new Date(b.date));
  const firstDate = new Date(sorted[0].date);
  const now = new Date();

  const monthsDiff =
    (now.getFullYear() - firstDate.getFullYear()) * 12 +
    (now.getMonth() - firstDate.getMonth());

  return Math.max(0, 2 - monthsDiff);
}

// Build the nav HTML — jars link shown only if unlocked
function buildNav(activePage) {
  const unlocked = jarsUnlocked();
  const pages = [
    { href: 'index.html', label: '🏠 דף הבית', key: 'home' },
    { href: 'income.html', label: 'הכנסות', key: 'income' },
    { href: 'expenses.html', label: 'הוצאות עסק', key: 'expenses' },
    { href: 'summary.html', label: 'כמה נשאר?', key: 'summary' },
    { href: 'home-expenses.html', label: 'הוצאות בית', key: 'home-expenses' },
    { href: 'barometer.html', label: 'ברומטר הכסף 🌡️', key: 'barometer' },
    { href: 'settings.html', label: 'גיבוי נתונים', key: 'settings' },
    { href: 'focusing-chat.html', label: 'שיח התמקדות', key: 'chat' },
    { href: 'vision.html', label: 'לאן אני הולכת 🌟', key: 'vision' },
    { href: 'daily-practice.html', label: 'תרגול ☀️🌿', key: 'daily-practice' },
    { href: 'books.html', label: 'ספריה 📚', key: 'books' },
  ];

  pages.splice(5, 0, { href: 'jars.html', label: 'הכדים שלי 🫙', key: 'jars' });

  const links = pages.map(p =>
    `<a href="${p.href}" class="${p.key === activePage ? 'active' : ''}" onclick="closeNav()">${p.label}</a>`
  ).join('');

  return `
    <div class="nav-links" id="nav-links">${links}</div>
    <a href="index.html" class="nav-logo" style="text-decoration:none;">
      Focusing For Freedom
      <span class="nav-logo-sub">Focusing Finance</span>
      <span class="nav-tagline">rewrite your money blueprint</span>
    </a>
    <button class="nav-burger" id="nav-burger" onclick="toggleNav()" aria-label="תפריט">☰</button>
  `;
}

// Inject nav into element with id="navbar"
function initNav(activePage) {
  const nav = document.getElementById('navbar');
  if (nav) nav.innerHTML = buildNav(activePage);
  checkNewMonth();
}

// ── DAILY MOOD (ברומטר הכסף) ──
const MOODS = [
  { label: 'קפאון',    emoji: '❄️',  blocking: true  },
  { label: 'כבדות',    emoji: '🌑',  blocking: true  },
  { label: 'חרדה',     emoji: '🌀',  blocking: true  },
  { label: 'ריקנות',   emoji: '🫙',  blocking: true  },
  { label: 'זרימה',    emoji: '🌊',  blocking: false },
  { label: 'ביטחון',   emoji: '⭐',  blocking: false },
  { label: 'התרגשות',  emoji: '✨',  blocking: false },
  { label: 'שמחה',     emoji: '🌟',  blocking: false },
];

function checkDailyMood() {
  if (window.location.pathname.endsWith('barometer.html')) return;
  if (sessionStorage.getItem('ff_mood_shown')) return;
  const todayKey = new Date().toISOString().split('T')[0];
  const last = localStorage.getItem('ff_last_mood_date');
  if (last === todayKey) return;
  sessionStorage.setItem('ff_mood_shown', '1');
  setTimeout(showMoodPicker, 600);
}

function showMoodPicker() {
  if (document.getElementById('mood-modal')) return;
  const btns = MOODS.map(m =>
    `<button class="mood-btn" onclick="saveMood('${m.label}','${m.emoji}',${m.blocking})">
      <span class="mood-emoji">${m.emoji}</span>
      <span class="mood-label">${m.label}</span>
    </button>`
  ).join('');

  const el = document.createElement('div');
  el.id = 'mood-modal';
  el.innerHTML = `
    <div class="mood-backdrop" onclick="closeMoodModal()"></div>
    <div class="mood-box" dir="rtl">
      <button class="mood-close" onclick="closeMoodModal()">✕</button>
      <div class="mood-title">ברומטר הכסף</div>
      <div class="mood-q">איך את מרגישה מול הכסף היום?</div>
      <div class="mood-grid">${btns}</div>
    </div>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('mood-open'));
}

function saveMood(label, emoji, blocking) {
  const todayKey = new Date().toISOString().split('T')[0];
  localStorage.setItem('ff_last_mood_date', todayKey);
  const history = JSON.parse(localStorage.getItem('ff_mood_history') || '[]');
  const i = history.findIndex(e => e.date === todayKey);
  const entry = { date: todayKey, mood: label, emoji, blocking };
  if (i !== -1) history[i] = entry; else history.unshift(entry);
  localStorage.setItem('ff_mood_history', JSON.stringify(history));

  const box = document.querySelector('.mood-box');
  if (!box) return;

  if (blocking) {
    box.innerHTML = `
      <div class="mood-title">${emoji} ${label}</div>
      <div class="mood-q" style="margin-bottom:24px;">יש כאן משהו שמחכה לתשומת לב.<br/>רוצה לשבת איתו דקה?</div>
      <div style="display:flex; flex-direction:column; gap:10px;">
        <a href="focusing-chat.html" class="btn btn-primary" style="text-align:center;" onclick="closeMoodModal()">כן, בואי נעשה שיח התמקדות</a>
        <button class="btn btn-ghost" onclick="closeMoodModal()">לא עכשיו</button>
      </div>`;
  } else {
    box.innerHTML = `
      <div class="mood-title">${emoji} ${label}</div>
      <div class="mood-q">נרשם. תמשיכי ביום טוב 🌿</div>
      <button class="btn btn-ghost" style="margin-top:20px; width:100%;" onclick="closeMoodModal()">סגרי</button>`;
    setTimeout(closeMoodModal, 2000);
  }
}

function closeMoodModal() {
  const el = document.getElementById('mood-modal');
  if (!el) return;
  el.classList.remove('mood-open');
  setTimeout(() => el.remove(), 300);
}

// ── NEW MONTH DETECTION ──
const MONTHS_HE = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];

function checkNewMonth() {
  const now = new Date();
  const currentKey = `${now.getFullYear()}-${now.getMonth()}`;
  const lastSeen = localStorage.getItem('ff_last_seen_month');
  localStorage.setItem('ff_last_seen_month', currentKey);
  if (!lastSeen || lastSeen === currentKey) return;
  const [py, pm] = lastSeen.split('-').map(Number);
  showNewMonthModal(py, pm);
}

function showNewMonthModal(prevYear, prevMonthIdx) {
  const incomes   = getIncomes();
  const expenses  = JSON.parse(localStorage.getItem('ff_expenses')      || '[]');
  const homeExp   = JSON.parse(localStorage.getItem('ff_home_expenses') || '[]');
  const taxRate   = getSettings().incomeTaxRate || 0;
  const fmt = n => '₪' + Math.round(Math.abs(n)).toLocaleString('he-IL');

  const inMonth = arr => arr.filter(x => {
    const d = new Date(x.date);
    return d.getFullYear() === prevYear && d.getMonth() === prevMonthIdx;
  });

  const gross       = inMonth(incomes).reduce((s, i) => s + (i.amount || 0), 0);
  const netIncome   = gross / 1.18 * (1 - taxRate / 100);
  const bizTotal    = inMonth(expenses).reduce((s, e) => s + (e.amount || 0), 0);
  const homeTotal   = inMonth(homeExp).reduce((s, e) => s + (e.amount || 0), 0);
  const leftover    = netIncome - bizTotal - homeTotal;
  const monthName   = MONTHS_HE[prevMonthIdx];

  const statsHtml = gross > 0 ? `
    <div class="nm-stats">
      <div class="nm-stat"><span>הכנסות ברוטו</span><span>${fmt(gross)}</span></div>
      <div class="nm-stat"><span>נטו אחרי מיסים</span><span>${fmt(netIncome)}</span></div>
      ${bizTotal  > 0 ? `<div class="nm-stat"><span>הוצאות עסק</span><span class="nm-red">- ${fmt(bizTotal)}</span></div>`  : ''}
      ${homeTotal > 0 ? `<div class="nm-stat"><span>הוצאות בית</span><span class="nm-red">- ${fmt(homeTotal)}</span></div>` : ''}
      <div class="nm-stat nm-total"><span>נשאר</span><span class="${leftover >= 0 ? 'nm-green' : 'nm-red'}">${leftover < 0 ? '-' : ''}${fmt(leftover)}</span></div>
    </div>` : `<div class="nm-no-data">לא נרשמו הכנסות ב${monthName}</div>`;

  const el = document.createElement('div');
  el.id = 'nm-modal';
  el.innerHTML = `
    <div class="nm-backdrop" onclick="closeNewMonthModal()"></div>
    <div class="nm-box" dir="rtl">
      <div class="nm-title">✨ חודש חדש הגיע</div>
      <div class="nm-subtitle">${monthName} מאחורינו — בואי נסתכל עליו רגע לפני שממשיכים</div>
      ${statsHtml}
      <div class="nm-focus-section">
        <div class="nm-focus-q">לפני שמתחילים — מה עולה בך כשאת מסתכלת על ${monthName}?</div>
        <textarea id="nm-text" class="nm-textarea" placeholder="מה הגוף מרגיש כשאת קוראת את המספרים האלה? מה צריך להיאמר?"></textarea>
        <div class="nm-focus-hint">אין תשובה נכונה — רק מה שמגיע</div>
      </div>
      <div class="nm-focus-section" style="margin-top:18px; border-top:1px solid rgba(232,201,126,0.15); padding-top:18px;">
        <div class="nm-focus-q" style="font-size:0.88rem;">🌿 פגישה חודשית עם הכסף שלך</div>
        <div style="font-size:0.82rem; color:var(--text-faint); margin:6px 0 10px; line-height:1.7;">אם הכסף שלך היה שותפה לדרך — מה היא הייתה אומרת לך בתחילת ${MONTHS_HE[new Date().getMonth()]}?</div>
        <textarea id="nm-money-text" class="nm-textarea" placeholder="כתבי בשמו של הכסף — מה הוא רוצה שתדעי החודש?"></textarea>
      </div>
      <div class="nm-btns">
        <button class="btn btn-primary" onclick="saveAndGoToSummary()">שמרי ועברי לסיכום</button>
        <button class="btn btn-ghost" onclick="closeNewMonthModal()">אחר כך</button>
      </div>
    </div>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('nm-open'));
}

function closeNewMonthModal() {
  const el = document.getElementById('nm-modal');
  if (!el) return;
  el.classList.remove('nm-open');
  setTimeout(() => el.remove(), 300);
}

function saveAndGoToSummary() {
  const text = (document.getElementById('nm-text')?.value || '').trim();
  if (text) {
    const list = JSON.parse(localStorage.getItem('ff_month_reflections') || '[]');
    list.push({ date: new Date().toISOString(), text });
    localStorage.setItem('ff_month_reflections', JSON.stringify(list));
  }
  const moneyText = (document.getElementById('nm-money-text')?.value || '').trim();
  if (moneyText) {
    const list = JSON.parse(localStorage.getItem('ff_money_letters') || '[]');
    list.push({ date: new Date().toISOString(), text: moneyText });
    localStorage.setItem('ff_money_letters', JSON.stringify(list));
  }
  closeNewMonthModal();
  window.location.href = 'summary.html';
}

function toggleNav() {
  const links = document.getElementById('nav-links');
  const burger = document.getElementById('nav-burger');
  if (!links) return;
  links.classList.toggle('open');
  if (burger) burger.textContent = links.classList.contains('open') ? '✕' : '☰';
}

function closeNav() {
  const links = document.getElementById('nav-links');
  const burger = document.getElementById('nav-burger');
  if (links) links.classList.remove('open');
  if (burger) burger.textContent = '☰';
}
