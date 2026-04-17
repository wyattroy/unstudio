// ===================================================
// main.js — shared utilities for all pages
// ===================================================

// Mark active nav link
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (
      (href === 'index.html'   && (path.endsWith('/') || path.endsWith('index.html'))) ||
      (href === 'archive.html' && path.endsWith('archive.html')) ||
      (href === 'toolkit.html' && path.endsWith('toolkit.html'))
    ) {
      a.classList.add('active');
    }
  });

  // Countdown
  updateCountdown();
  setInterval(updateCountdown, 1000 * 60); // refresh every minute
});

function updateCountdown() {
  const end = typeof UNSTUDIO_END_DATE !== 'undefined'
    ? UNSTUDIO_END_DATE
    : new Date('2026-04-21T23:59:59');

  const now  = new Date();
  const diff = end - now;

  const els = document.querySelectorAll('[data-countdown]');
  if (!els.length) return;

  if (diff <= 0) {
    els.forEach(el => { el.textContent = '0'; });
    document.querySelectorAll('[data-countdown-label]').forEach(el => {
      el.textContent = 'days — it happened';
    });
    return;
  }

  const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  els.forEach(el => {
    el.textContent = days;
  });

  document.querySelectorAll('[data-countdown-label]').forEach(el => {
    el.textContent = days === 1 ? 'day left' : 'days left';
  });

  // Nav countdown chip
  const navChip = document.querySelector('.nav-countdown');
  if (navChip) {
    navChip.textContent = `closes in ${days}d ${hours}h`;
  }
}

// Animate stat bars into view
function animateBars() {
  const bars = document.querySelectorAll('.bar-fill[data-width]');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target;
        bar.style.width = bar.dataset.width + '%';
        observer.unobserve(bar);
      }
    });
  }, { threshold: 0.2 });
  bars.forEach(b => observer.observe(b));
}

document.addEventListener('DOMContentLoaded', animateBars);

// Copy text to clipboard
function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    btn.style.background = '#28a745';
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.background = '';
    }, 2000);
  });
}

// Simple lightbox for gallery
function initLightbox() {
  const lb  = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  if (!lb || !img) return;

  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
      img.src = item.querySelector('img').src;
      lb.classList.add('open');
    });
  });

  lb.addEventListener('click', e => {
    if (e.target === lb || e.target.classList.contains('lightbox-close')) {
      lb.classList.remove('open');
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') lb.classList.remove('open');
  });
}

document.addEventListener('DOMContentLoaded', initLightbox);
