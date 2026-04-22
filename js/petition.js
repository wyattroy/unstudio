// ===================================================
// petition.js — quote wall + reaction form
// ===================================================

const SUPABASE_CONFIGURED =
  typeof SUPABASE_URL !== 'undefined' &&
  SUPABASE_URL !== 'YOUR_SUPABASE_URL';

let supabaseClient = null;

if (SUPABASE_CONFIGURED) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
}

const PAPER_EMAIL = 'petition@gsd.harvard.edu';

// ---- Load and render supporters ----

async function loadSupporters() {
  const wall         = document.getElementById('supporters-wall');
  const nameList     = document.getElementById('supporters-name-list');
  const paperCountEl = document.getElementById('paper-petition-count');
  if (!wall) return;

  // 1. Load seeded supporters from JSON (legacy; may be empty)
  let seeded = [];
  try {
    const res = await fetch('data/supporters.json');
    seeded = await res.json();
  } catch (e) {}

  // 2. Load all approved live entries from Supabase
  let live = [];
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from('supporters')
      .select('name, program, comment, gsd_email, created_at')
      .eq('approved', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      live = data.map(d => ({
        name:    d.name,
        program: d.program,
        comment: d.comment,
        email:   d.gsd_email,
        date:    formatDate(d.created_at),
      }));
    }
  }

  // 3. Split into categories
  const paper           = live.filter(d => d.email === PAPER_EMAIL);
  const online          = live.filter(d => d.email !== PAPER_EMAIL);
  const withComments    = online.filter(d => d.comment && d.comment.trim());
  const withoutComments = online.filter(d => !d.comment || !d.comment.trim());
  const seededVoices    = seeded.filter(s => s.comment && s.comment.trim());

  // 4. Total count = every approved entry (online + paper + seeded)
  const totalCount = live.length + seeded.length;
  document.querySelectorAll('[data-supporter-count]').forEach(el => {
    el.textContent = totalCount;
  });

  // 5. Render voices wall — only entries with comments
  wall.innerHTML = '';
  const allVoices = [...withComments, ...seededVoices];
  if (allVoices.length === 0) {
    wall.innerHTML = '<div class="wall-loading">No reactions yet. Be the first!</div>';
  } else {
    allVoices.forEach(s => {
      const card = document.createElement('div');
      card.className = 'supporter-card';
      card.innerHTML = `
        <div class="supporter-comment">"${escapeHtml(s.comment)}"</div>
        <div class="supporter-name">${escapeHtml(s.name)}</div>
        ${s.program ? `<div class="supporter-program">${escapeHtml(s.program)}</div>` : ''}
      `;
      wall.appendChild(card);
    });
  }

  // 6. Render supporters name list — entries with no comment
  if (nameList) {
    nameList.innerHTML = '';
    if (withoutComments.length === 0) {
      nameList.innerHTML = '<p style="opacity:0.4;font-size:0.875rem">None yet.</p>';
    } else {
      withoutComments.forEach(s => {
        const item = document.createElement('div');
        item.className = 'supporter-name-item';
        item.innerHTML = `
          <span class="supporter-name-item__name">${escapeHtml(s.name)}</span>
          ${s.program ? `<span class="supporter-name-item__program"> · ${escapeHtml(s.program)}</span>` : ''}
        `;
        nameList.appendChild(item);
      });
    }
  }

  // 7. Paper petition count
  if (paperCountEl) {
    paperCountEl.textContent = paper.length;
  }
}

// ---- Handle form submission ----

async function initPetitionForm() {
  const form        = document.getElementById('petition-form');
  const feedback    = document.getElementById('petition-feedback');
  const missingNote = document.getElementById('supabase-missing');

  if (!form) return;

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

    if (!email.endsWith('@gsd.harvard.edu') && !email.endsWith('@harvard.edu')) {
      showFeedback(feedback, 'error', 'Please use your GSD or Harvard email address.');
      return;
    }

    submitBtn.disabled    = true;
    submitBtn.textContent = 'Submitting…';

    // Insert with approved: false — requires admin review before going public
    const { error } = await supabaseClient
      .from('supporters')
      .insert([{ name, program: program || null, gsd_email: email, comment: comment || null, approved: false }]);

    if (error) {
      showFeedback(feedback, 'error', 'Something went wrong. Please try again.');
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Add your voice';
      return;
    }

    // Notify admin — fire-and-forget (activate by clicking the link in the first email formsubmit.co sends)
    fetch('https://formsubmit.co/ajax/wyatt_roy@gsd.harvard.edu', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        _subject:  'New unstudio voice awaiting approval',
        _template: 'table',
        Name:      name,
        Program:   program || '—',
        Comment:   comment || '(no comment)',
      }),
    }).catch(() => {}); // non-blocking

    form.reset();
    submitBtn.disabled    = false;
    submitBtn.textContent = 'Add your voice';
    showFeedback(feedback, 'success', 'Thank you — your voice has been submitted and will appear once reviewed.');
  });
}

// ---- Utilities ----

function showFeedback(el, type, message) {
  if (!el) return;
  el.textContent   = message;
  el.className     = `form-feedback ${type}`;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 8000);
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
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  loadSupporters();
  initPetitionForm();
});
