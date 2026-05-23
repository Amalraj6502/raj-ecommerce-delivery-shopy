const API = '';

// ── Auth helpers ──────────────────────────────────────────────────────────────
function getToken() { return localStorage.getItem('shopx_token'); }
function getUser()  { 
  try { return JSON.parse(localStorage.getItem('shopx_user')); } catch { return null; } 
}
function setAuth(token, user) {
  localStorage.setItem('shopx_token', token);
  localStorage.setItem('shopx_user', JSON.stringify(user));
}
function clearAuth() {
  localStorage.removeItem('shopx_token');
  localStorage.removeItem('shopx_user');
}

function logout() {
  clearAuth();
  showToast('Logged out successfully', 'success');
  setTimeout(() => location.href = '/', 800);
}

function updateNavAuth() {
  const user = getUser();
  const authBtn    = document.getElementById('authBtn');
  const logoutBtn  = document.getElementById('logoutBtn');
  const navOrders  = document.getElementById('nav-orders');
  const mobOrders  = document.getElementById('mobOrders');
  const mobLogin   = document.getElementById('mobLogin');

  if (user) {
    if (authBtn)   authBtn.style.display   = 'none';
    if (logoutBtn) logoutBtn.style.display = 'flex';
    if (navOrders) navOrders.style.display = 'block';
    if (mobOrders) mobOrders.style.display = 'block';
    if (mobLogin)  mobLogin.style.display  = 'none';
    if (logoutBtn) logoutBtn.innerHTML = `<i class="fa fa-user"></i> ${user.name.split(' ')[0]}`;
  } else {
    if (authBtn)   authBtn.style.display   = 'flex';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (navOrders) navOrders.style.display = 'none';
    if (mobOrders) mobOrders.style.display = 'none';
    if (mobLogin)  mobLogin.style.display  = 'block';
  }
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg, type = 'success', duration = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const icon = type === 'success' ? '✅' : '❌';
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideOut .3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Init
document.addEventListener('DOMContentLoaded', updateNavAuth);
