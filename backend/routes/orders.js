const express = require('express');
const db = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

async function nextOrderId() {
  const all = await db.orders.find({});
  return all.length ? Math.max(...all.map(o => o.id)) + 1 : 1;
}
async function nextItemId() {
  const all = await db.items.find({});
  return all.length ? Math.max(...all.map(i => i.id)) + 1 : 1;
}

// Place order
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { items, shipping, payment_method } = req.body;
    if (!items || !items.length) return res.status(400).json({ error: 'No items' });

    let total = 0;
    const validatedItems = [];
    for (const item of items) {
      const product = await db.products.findOne({ id: item.product_id });
      if (!product) return res.status(400).json({ error: `Product ${item.product_id} not found` });
      if (product.stock < item.quantity) return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      total += product.price * item.quantity;
      validatedItems.push({ ...item, price: product.price, product });
    }

    const orderId = await nextOrderId();
    const order = { id: orderId, user_id: req.user.id, total, status: 'Pending', shipping_name: shipping.name, shipping_address: shipping.address, shipping_city: shipping.city, shipping_phone: shipping.phone, payment_method: payment_method||'COD', created_at: new Date().toISOString() };
    await db.orders.insert(order);

    let itemId = await nextItemId();
    for (const item of validatedItems) {
      await db.items.insert({ id: itemId++, order_id: orderId, product_id: item.product_id, quantity: item.quantity, price: item.price, name: item.product.name, image: item.product.image });
      await db.products.update({ id: item.product_id }, { $set: { stock: item.product.stock - item.quantity } });
    }

    res.json({ success: true, order });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// User's orders
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const orders = await db.orders.find({ user_id: req.user.id }).sort({ created_at: -1 });
    const result = await Promise.all(orders.map(async o => {
      const items = await db.items.find({ order_id: o.id });
      return { ...o, items, item_count: items.length };
    }));
    res.json(result);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// All orders (admin)
router.get('/admin/all', adminMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    let query = status ? { status } : {};
    const orders = await db.orders.find(query).sort({ created_at: -1 });
    const users = await db.users.find({});
    const result = await Promise.all(orders.map(async o => {
      const user = users.find(u => u.id === o.user_id) || {};
      const items = await db.items.find({ order_id: o.id });
      return { ...o, user_name: user.name||'Unknown', user_email: user.email||'', items, item_count: items.length };
    }));
    res.json(result);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Update order status (admin)
router.patch('/:id/status', adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['Pending','Processing','Shipped','Delivered','Cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    await db.orders.update({ id: parseInt(req.params.id) }, { $set: { status } });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Admin stats
router.get('/admin/stats', adminMiddleware, async (req, res) => {
  try {
    const [allOrders, allUsers, allProducts] = await Promise.all([
      db.orders.find({}),
      db.users.find({}),
      db.products.find({})
    ]);
    const totalOrders = allOrders.length;
    const totalRevenue = allOrders.filter(o => o.status !== 'Cancelled').reduce((s,o) => s + o.total, 0);
    const totalUsers = allUsers.filter(u => !u.is_admin).length;
    const totalProducts = allProducts.length;
    const recentOrders = allOrders.sort((a,b) => new Date(b.created_at)-new Date(a.created_at)).slice(0,5);
    const users = allUsers;
    const recentWithUser = recentOrders.map(o => { const u = users.find(u => u.id === o.user_id)||{}; return { ...o, user_name: u.name||'Unknown' }; });
    const statusMap = {};
    allOrders.forEach(o => { statusMap[o.status] = (statusMap[o.status]||0) + 1; });
    const statusBreakdown = Object.entries(statusMap).map(([status,count]) => ({ status, count }));
    res.json({ totalOrders, totalRevenue, totalUsers, totalProducts, recentOrders: recentWithUser, statusBreakdown });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
