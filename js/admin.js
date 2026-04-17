// ===================================================
// admin.js — Supabase Auth admin panel
// ===================================================

const CONFIGURED =
  typeof SUPABASE_URL !== 'undefined' &&
  SUPABASE_URL !== 'YOUR_SUPABASE_URL';

let sb = null;
if (CONFIGURED) {
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
}

// ---- DOM refs ----
const loginView  = document.getElementById('admin-login');
const panelView  = document.getElementById('admin-panel');
const loginForm  = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn  = document.getElementById('logout-btn');
const tableBody  = document.getElementById('supporters-tbody');
const totalEl    = document.getElementById('admin-total');
const pendingEl  = document.getElementById('admin-pending');
const approvedEl = document.getElementById('admin-approved');
const notConfigEl = document.getElementById('not-configured');

// ---- Bootstrap ----
document.addEventListener('DOMContentLoaded', async () => {
  if (!CONFIGURED) {
    if (notConfigEl) notConfigEl.style.display = 'block';
    return;
  }

  // Check existing session
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    showPanel();
  } else {
    showLogin();
  }
});

// ---- Login ----
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = loginForm.email.value.trim();
    const password = loginForm.password.value;
    const btn      = loginForm.querySelector('button[type="submit"]');

    btn.disabled    = true;
    btn.textContent = 'Signing in...';
    if (loginError) loginError.style.display = 'none';

    const { error } = await sb.auth.signInWithPassword({ email, password });

    if (error) {
      if (loginError) {
        loginError.textContent = error.message;
        loginError.style.display = 'block';
      }
      btn.disabled    = false;
      btn.textContent = 'Sign in';
      return;
    }

    showPanel();
  });
}

// ---- Logout ----
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await sb.auth.signOut();
    showLogin();
  });
}

// ---- Views ----
function showLogin() {
  if (loginView)  loginView.style.display  = 'flex';
  if (panelView)  panelView.style.display  = 'none';
}

async function showPanel() {
  if (loginView)  loginView.style.display  = 'none';
  if (panelView)  panelView.style.display  = 'block';
  await fetchSupporters();
}

// ---- Fetch all supporters (admin sees all) ----
async function fetchSupporters() {
  if (!sb || !tableBody) return;

  tableBody.innerHTML = `<tr><td colspan="6" class="admin-empty">Loading…</td></tr>`;

  const { data, error } = await sb
    .from('supporters')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    tableBody.innerHTML = `<tr><td colspan="6" class="admin-empty" style="color:red">Error: ${error.message}</td></tr>`;
    return;
  }

  if (!data || data.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" class="admin-empty">No submissions yet.</td></tr>`;
    return;
  }

  // Stats
  const total    = data.length;
  const approved = data.filter(d => d.approved).length;
  const pending  = total - approved;
  if (totalEl)    totalEl.textContent    = total;
  if (approvedEl) approvedEl.textContent = approved;
  if (pendingEl)  pendingEl.textContent  = pending;

  // Rows
  tableBody.innerHTML = '';
  data.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escHtml(row.name)}</td>
      <td class="admin-email-cell">${escHtml(row.gsd_email)}</td>
      <td class="admin-comment-cell">${row.comment ? escHtml(row.comment) : '<span style="opacity:0.4">—</span>'}</td>
      <td>
        <span class="badge ${row.approved ? 'badge-approved' : 'badge-pending'}">
          ${row.approved ? 'Approved' : 'Pending'}
        </span>
      </td>
      <td style="white-space:nowrap;font-size:0.75rem;color:#777">${formatDate(row.created_at)}</td>
      <td>
        <div class="admin-actions">
          <button
            class="btn btn-sm ${row.approved ? 'btn-unapprove' : 'btn-approve'}"
            onclick="toggleApprove('${row.id}', ${row.approved})">
            ${row.approved ? 'Hide' : 'Approve'}
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteRow('${row.id}')">
            Delete
          </button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

// ---- Actions ----
async function toggleApprove(id, current) {
  const { error } = await sb
    .from('supporters')
    .update({ approved: !current })
    .eq('id', id);

  if (!error) fetchSupporters();
  else alert('Error: ' + error.message);
}

async function deleteRow(id) {
  if (!confirm('Delete this entry permanently?')) return;
  const { error } = await sb
    .from('supporters')
    .delete()
    .eq('id', id);

  if (!error) fetchSupporters();
  else alert('Error: ' + error.message);
}

// ---- Utils ----
function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
