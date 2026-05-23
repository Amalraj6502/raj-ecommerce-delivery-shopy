const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Init DB first
require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Serve Uploaded Images ────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// ─── Static placeholder image ─────────────────────────────────────────────────
// If no image, serve a generated placeholder
app.get('/uploads/placeholder.jpg', (req, res) => {
  res.redirect('https://placehold.co/400x400/1a1a2e/8b5cf6?text=ShopX');
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ─── Serve Frontend ───────────────────────────────────────────────────────────
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// ─── Serve Admin Panel ────────────────────────────────────────────────────────
const adminPath = path.join(__dirname, '../admin');
app.use('/admin', express.static(adminPath));

// ─── SPA Fallbacks ────────────────────────────────────────────────────────────
app.get('/admin/*', (req, res) => {
  const file = path.join(adminPath, 'login.html');
  if (fs.existsSync(file)) res.sendFile(file);
  else res.status(404).send('Admin panel not found');
});

app.get('*', (req, res) => {
  const file = path.join(frontendPath, 'index.html');
  if (fs.existsSync(file)) res.sendFile(file);
  else res.status(404).send('Frontend not found');
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║         🛒 ShopX Server Running         ║');
  console.log('╠════════════════════════════════════════╣');
  console.log(`║  🌐 Shop:   http://localhost:${PORT}       ║`);
  console.log(`║  🔧 Admin:  http://localhost:${PORT}/admin  ║`);
  console.log('║                                        ║');
  console.log('║  Admin Login:                          ║');
  console.log('║    Email:    admin@shopx.com           ║');
  console.log('║    Password: Admin@123                 ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');
});
