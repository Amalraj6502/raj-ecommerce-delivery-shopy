const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

async function nextUserId() {
  const all = await db.users.find({});
  return all.length ? Math.max(...all.map(u => u.id)) + 1 : 1;
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
    const existing = await db.users.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already exists' });
    const id = await nextUserId();
    const hash = bcrypt.hashSync(password, 10);
    await db.users.insert({ id, name, email, password: hash, is_admin: 0, created_at: new Date().toISOString() });
    const token = jwt.sign({ id, name, email, is_admin: 0 }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id, name, email, is_admin: 0 } });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await db.users.findOne({ email });
    if (!user || !bcrypt.compareSync(password, user.password))
      return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, is_admin: user.is_admin }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, is_admin: user.is_admin } });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Get profile
router.get('/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try { res.json(jwt.verify(token, JWT_SECRET)); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
});

// Get all users (admin)
router.get('/users', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.is_admin) return res.status(403).json({ error: 'Admin only' });
    const users = await db.users.find({}).sort({ created_at: -1 });
    res.json(users.map(u => ({ id: u.id, name: u.name, email: u.email, is_admin: u.is_admin, created_at: u.created_at })));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
