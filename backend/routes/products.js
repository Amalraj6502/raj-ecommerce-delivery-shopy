const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { adminMiddleware } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random()*1e9) + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 5*1024*1024 } });

async function nextProductId() {
  const all = await db.products.find({});
  return all.length ? Math.max(...all.map(p => p.id)) + 1 : 1;
}

async function enrichWithCategory(products) {
  const cats = await db.cats.find({});
  return products.map(p => {
    const cat = cats.find(c => c.id === p.category_id);
    return { ...p, category_name: cat?.name || null, category_icon: cat?.icon || null };
  });
}

// Get all products
router.get('/', async (req, res) => {
  try {
    const { search, featured } = req.query;
    let query = {};
    if (featured === '1') query.is_featured = 1;
    let products = await db.products.find(query).sort({ created_at: -1 });
    if (search) {
      const s = search.toLowerCase();
      products = products.filter(p => p.name.toLowerCase().includes(s) || (p.description||'').toLowerCase().includes(s));
    }
    if (req.query.category) {
      const cid = parseInt(req.query.category);
      products = products.filter(p => p.category_id === cid);
    }
    if (req.query.limit) products = products.slice(0, parseInt(req.query.limit));
    res.json(await enrichWithCategory(products));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ⚠️ IMPORTANT: /meta/categories MUST be before /:id to avoid Express treating 'meta' as an id
// Get categories
router.get('/meta/categories', async (req, res) => {
  try { res.json(await db.cats.find({}).sort({ id: 1 })); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const product = await db.products.findOne({ id });
    if (!product) return res.status(404).json({ error: 'Not found' });
    const [enriched] = await enrichWithCategory([product]);
    res.json(enriched);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Create product (admin)
router.post('/', adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, original_price, category_id, stock, is_featured } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Name and price required' });
    const image = req.file ? req.file.filename : 'placeholder.jpg';
    const id = await nextProductId();
    const product = { id, name, description: description||'', price: parseFloat(price), original_price: parseFloat(original_price)||null, category_id: parseInt(category_id)||null, image, stock: parseInt(stock)||100, rating: 4.5, review_count: 0, is_featured: is_featured==='1'?1:0, created_at: new Date().toISOString() };
    await db.products.insert(product);
    const [enriched] = await enrichWithCategory([product]);
    res.json(enriched);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Update product (admin)
router.put('/:id', adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await db.products.findOne({ id });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const { name, description, price, original_price, category_id, stock, is_featured } = req.body;
    const image = req.file ? req.file.filename : existing.image;
    const updated = { ...existing, name: name||existing.name, description: description??existing.description, price: parseFloat(price)||existing.price, original_price: parseFloat(original_price)||existing.original_price, category_id: parseInt(category_id)||existing.category_id, image, stock: parseInt(stock)??existing.stock, is_featured: is_featured==='1'?1:0 };
    await db.products.update({ id }, { $set: updated });
    const [enriched] = await enrichWithCategory([updated]);
    res.json(enriched);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Delete product (admin)
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await db.products.findOne({ id });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    await db.products.remove({ id }, {});
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
