// ===================================================
// petition.js — wall of support + petition form
// ===================================================

const SUPABASE_CONFIGURED =
  typeof SUPABASE_URL !== 'undefined' &&
  SUPABASE_URL !== 'YOUR_SUPABASE_URL';

let supabaseClient = null;

if (SUPABASE_CONFIGURED) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
}

// ---- Load and render supporters ----

async function loadSupporters() {
  const wall       = document.getElementById('supporters-wall');
  const countEl    = document.getElementById('supporter-count');
  if (!wall) return;

  // 1. Load seeded supporters from JSON
  let seeded = [];
  try {
    const res = await fetch('data/supporters.json');
    seeded = await res.json();
  } catch (e) {
    console.warn('Could not load seeded supporters:', e);
  }

  // 2. Load live supporters from Supabase
  let live = [];
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from('supporters')
      .select('name, program, comment, created_at')
      .eq('approved', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      live = data.map(d => ({
        id:      d.id,
        name:    d.name,
        program: d.program,
        comment: d.comment,
        date:    formatDate(d.created_at),
      }));
    }
  }

  // 3. Combine: live first, then seeded
  const all = [...live, ...seeded];

  // 4. Update count
  const total = all.length + (SUPABASE_CONFIGURED ? 0 : 0); // count from combined
  if (countEl) countEl.textContent = all.length;

  // Also update nav/hero counts
  document.querySelectorAll('[data-supporter-count]').forEach(el => {
    el.textContent = all.length;
  });

  // 5. Render wall
  wall.innerHTML = '';
  if (all.length === 0) {
    wall.innerHTML = '<div class="wall-loading">No supporters yet. Be the first!</div>';
    return;
  }

  all.forEach(s => {
    const card = document.createElement('div');
    card.className = 'supporter-card';
    card.innerHTML = `
      <div class="supporter-name">${escapeHtml(s.name)}</div>
      ${s.program ? `<div class="supporter-program">${escapeHtml(s.program)}</div>` : ''}
      ${s.comment ? `<div class="supporter-comment">"${escapeHtml(s.comment)}"</div>` : ''}
      <div class="supporter-date">${s.date || ''}</div>
    `;
    wall.appendChild(card);
  });
}

// ---- Handle form submission ----

async function initPetitionForm() {
  const form      = document.getElementById('petition-form');
  const feedback  = document.getElementById('petition-feedback');
  const missingNote = document.getElementById('supabase-missing');

  if (!form) return;

  // Show note if Supabase not configured
  if (!SUPABASE_CONFIGURED && missingNote) {
    missingNote.style.display = 'block';
    form.querySelectorAll('input, textarea, button[type="submit"]').forEach(el => {
      el.disabled = true;
      el.style.opacity = '0.4';
    });
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const name      = form.name.value.trim();
    const program   = form.program.value.trim();
    const email     = form.gsd_email.value.trim().toLowerCase();
    const comment   = form.comment.value.trim();

    // Validate email
    if (!email.endsWith('@gsd.harvard.edu') && !email.endsWith('@harvard.edu')) {
      showFeedback(feedback, 'error', 'Please use your GSD or Harvard email address.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing...';

    const { error } = await supabaseClient
      .from('supporters')
      .insert([{ name, program: program || null, gsd_email: email, comment: comment || null }]);

    if (error) {
      showFeedback(feedback, 'error', 'Something went wrong. Please try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign the petition';
      return;
    }

    form.reset();
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign the petition';
    showFeedback(feedback, 'success', 'Thank you for signing! Your name will appear on the wall shortly.');

    // Reload the wall to show the new entry
    setTimeout(loadSupporters, 1000);
  });
}

// ---- Utilities ----

function showFeedback(el, type, message) {
  if (!el) return;
  el.textContent   = message;
  el.className     = `form-feedback ${type}`;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 6000);
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  loadSupporters();
  initPetitionForm();
});
