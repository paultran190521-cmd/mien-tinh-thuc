/**
 * SUNNYCARE MindWell — Main Application JS
 * Handles: Language toggle, Quote rotator, Navigation, Music UI, Toast, Crisis banner
 */

// ─── STATE ─────────────────────────────────────────────────────────────────
let currentLang = localStorage.getItem('sc_lang') || 'vi';
let currentQuoteIndex = 0;
let quoteTimer = null;
let toastQueue = [];

// ─── LANGUAGE SYSTEM ────────────────────────────────────────────────────────
function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('sc_lang', lang);
  document.documentElement.lang = lang;

  // Update all elements with data-vi / data-en attributes
  document.querySelectorAll('[data-vi]').forEach(el => {
    const text = el.getAttribute(`data-${lang}`);
    if (text) el.textContent = text;
  });

  // Update lang toggle UI
  const viBtn = document.querySelector('.lang-vi');
  const enBtn = document.querySelector('.lang-en');
  if (viBtn && enBtn) {
    viBtn.classList.toggle('active', lang === 'vi');
    enBtn.classList.toggle('active', lang === 'en');
  }

  // Refresh quote if displayed
  if (typeof PSYCHOLOGY_QUOTES !== 'undefined') {
    displayQuote(currentQuoteIndex, false);
  }

  // Dispatch event for other modules
  document.dispatchEvent(new CustomEvent('langChange', { detail: { lang } }));
}

function toggleLanguage() {
  setLanguage(currentLang === 'vi' ? 'en' : 'vi');
}

// ─── QUOTE ROTATOR ──────────────────────────────────────────────────────────
function displayQuote(index, animate = true) {
  const quoteText = document.getElementById('quoteText');
  const quoteAuthor = document.getElementById('quoteAuthor');
  const quoteContent = document.getElementById('quoteContent');
  if (!quoteText || !quoteAuthor || !PSYCHOLOGY_QUOTES) return;

  const q = PSYCHOLOGY_QUOTES[index];
  if (!q) return;

  if (animate) {
    quoteContent.classList.add('fade-out');
    setTimeout(() => {
      quoteText.textContent = `"${q[currentLang]}"`;
      quoteAuthor.textContent = `— ${q.author}`;
      quoteContent.classList.remove('fade-out');
      quoteContent.classList.add('fade-in');
      setTimeout(() => quoteContent.classList.remove('fade-in'), 600);
    }, 400);
  } else {
    quoteText.textContent = `"${q[currentLang]}"`;
    quoteAuthor.textContent = `— ${q.author}`;
  }

  // Update dots
  updateQuoteDots(index);
}

function updateQuoteDots(active) {
  const container = document.getElementById('quoteDots');
  if (!container || !PSYCHOLOGY_QUOTES) return;
  container.innerHTML = '';
  PSYCHOLOGY_QUOTES.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'quote-dot' + (i === active ? ' active' : '');
    dot.setAttribute('aria-label', `Quote ${i + 1}`);
    dot.addEventListener('click', () => { goToQuote(i); });
    container.appendChild(dot);
  });
}

function goToQuote(index) {
  clearInterval(quoteTimer);
  currentQuoteIndex = index;
  displayQuote(index);
  startQuoteRotation();
}

function startQuoteRotation() {
  quoteTimer = setInterval(() => {
    currentQuoteIndex = (currentQuoteIndex + 1) % PSYCHOLOGY_QUOTES.length;
    displayQuote(currentQuoteIndex);
  }, 9000);
}

function initQuotes() {
  if (typeof PSYCHOLOGY_QUOTES === 'undefined') return;
  currentQuoteIndex = Math.floor(Math.random() * PSYCHOLOGY_QUOTES.length);
  displayQuote(currentQuoteIndex, false);
  startQuoteRotation();
}

// ─── TOAST NOTIFICATIONS ────────────────────────────────────────────────────
function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: '💙',
    celebrate: '🎉'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-msg">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));

  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

// ─── MUSIC PLAYER UI ────────────────────────────────────────────────────────
function initMusicPlayer() {
  const musicToggle = document.getElementById('musicToggle');
  const musicPlayer = document.getElementById('musicPlayer');
  const musicClose = document.getElementById('musicClose');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const volumeSlider = document.getElementById('volumeSlider');
  const trackBtns = document.querySelectorAll('.track-btn');

  if (!musicToggle || !musicPlayer) return;

  // Toggle visibility
  musicToggle.addEventListener('click', () => {
    musicPlayer.classList.toggle('visible');
  });

  musicClose.addEventListener('click', () => {
    musicPlayer.classList.remove('visible');
  });

  // Play / Pause
  playPauseBtn.addEventListener('click', () => {
    const sound = window.ambientSound;
    if (!sound) return;

    if (sound.isPlaying) {
      sound.pause();
      playPauseBtn.classList.remove('playing');
      playPauseBtn.querySelector('.play-icon').classList.remove('hidden');
      playPauseBtn.querySelector('.pause-icon').classList.add('hidden');
    } else {
      sound.play(sound.currentTrack || 'rain');
      playPauseBtn.classList.add('playing');
      playPauseBtn.querySelector('.play-icon').classList.add('hidden');
      playPauseBtn.querySelector('.pause-icon').classList.remove('hidden');
    }
  });

  // Volume
  volumeSlider.addEventListener('input', (e) => {
    window.ambientSound?.setVolume(parseInt(e.target.value));
  });

  // Track select
  trackBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      trackBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const track = btn.dataset.track;
      window.ambientSound?.switchTrack(track);

      // If not playing, auto-start
      if (!window.ambientSound?.isPlaying) {
        playPauseBtn.classList.add('playing');
        playPauseBtn.querySelector('.play-icon').classList.add('hidden');
        playPauseBtn.querySelector('.pause-icon').classList.remove('hidden');
      }
    });
  });
}

// ─── NAVIGATION ─────────────────────────────────────────────────────────────
function initNav() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('navHamburger');
  const navLinks = document.getElementById('navLinks');

  // Scroll effect
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const curr = window.scrollY;
    if (curr > 50) navbar?.classList.add('scrolled');
    else navbar?.classList.remove('scrolled');
    lastScroll = curr;
  }, { passive: true });

  // Hamburger mobile menu
  hamburger?.addEventListener('click', () => {
    navLinks?.classList.toggle('open');
    hamburger.classList.toggle('active');
  });

  // Close menu on nav link click
  navLinks?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger?.classList.remove('active');
    });
  });
}

// ─── LANGUAGE TOGGLE ────────────────────────────────────────────────────────
function initLangToggle() {
  const btn = document.getElementById('langToggle');
  btn?.addEventListener('click', toggleLanguage);
  setLanguage(currentLang); // Apply saved language on load
}

// ─── CRISIS BANNER ──────────────────────────────────────────────────────────
function initCrisisBanner() {
  const banner = document.getElementById('crisisBanner');
  const closeBtn = document.getElementById('crisisClose');
  const dismissed = sessionStorage.getItem('sc_crisis_dismissed');

  if (!banner) return;
  if (dismissed) { banner.style.display = 'none'; return; }

  setTimeout(() => banner.classList.add('visible'), 3000);

  closeBtn?.addEventListener('click', () => {
    banner.classList.remove('visible');
    sessionStorage.setItem('sc_crisis_dismissed', '1');
  });
}

// ─── ENTRANCE ANIMATIONS ────────────────────────────────────────────────────
function initAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.tool-card, .feature-item, .section-header').forEach(el => {
    observer.observe(el);
  });
}

// ─── SMOOTH SCROLL ──────────────────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ─── PAGE INIT ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initLangToggle();
  initMusicPlayer();
  initCrisisBanner();
  initAnimations();
  initQuotes();

  // Welcome toast
  setTimeout(() => {
    const msg = currentLang === 'vi'
      ? '💙 Chào mừng bạn đến với SUNNYCARE'
      : '💙 Welcome to SUNNYCARE';
    showToast(msg, 'info', 5000);
  }, 1800);
});

// Export for other pages
window.SC = { showToast, setLanguage, currentLang: () => currentLang };
