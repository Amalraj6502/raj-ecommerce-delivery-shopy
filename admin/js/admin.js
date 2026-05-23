// ─── Admin Auth Helpers ───────────────────────────────────────────────────────
function getToken() { return localStorage.getItem('shopx_token'); }
function getUser()  { try { return JSON.parse(localStorage.getItem('shopx_user')); } catch { return null; } }
function clearAuth(){ localStorage.removeItem('shopx_token'); localStorage.removeItem('shopx_user'); }

function requireAdmin() {
  const token = getToken();
  const user = getUser();
  if (!token || !user || !user.is_admin) {
    location.href = '/admin/login.html';
    return false;
  }
  return true;
}

function adminLogout() {
  clearAuth();
  location.href = '/admin/login.html';
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function showToast(msg, type = 'success', duration = 3500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// ─── API helper ───────────────────────────────────────────────────────────────
async function api(path, options = {}) {
  const res = await fetch('/api' + path, {
    ...options,
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      ...(options.headers || {})
    }
  });
  if (res.status === 401 || res.status === 403) { clearAuth(); location.href = '/admin/login.html'; }
  return res;
}

// ─── Set active nav ───────────────────────────────────────────────────────────
function setActiveNav() {
  const path = location.pathname;
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('href') && path.includes(el.getAttribute('href')));
  });
}

// ─── Render admin info ────────────────────────────────────────────────────────
function renderAdminInfo() {
  const user = getUser();
  const nameEl = document.getElementById('adminName');
  const roleEl = document.getElementById('adminRole');
  if (nameEl && user) nameEl.textContent = user.name;
  if (roleEl) roleEl.textContent = 'Administrator';
}

document.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  renderAdminInfo();
});
