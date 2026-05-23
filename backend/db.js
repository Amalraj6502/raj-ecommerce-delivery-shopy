const Datastore = require('nedb-promises');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbDir = path.join(__dirname, 'data');
require('fs').mkdirSync(dbDir, { recursive: true });

const db = {
  users:    Datastore.create({ filename: path.join(dbDir, 'users.db'),    autoload: true }),
  cats:     Datastore.create({ filename: path.join(dbDir, 'cats.db'),     autoload: true }),
  products: Datastore.create({ filename: path.join(dbDir, 'products.db'), autoload: true }),
  orders:   Datastore.create({ filename: path.join(dbDir, 'orders.db'),   autoload: true }),
  items:    Datastore.create({ filename: path.join(dbDir, 'items.db'),    autoload: true }),
};

// Auto-increment helper using a simple counter file
let _counters = {};
async function nextId(col) {
  const all = await db[col].find({});
  const ids = all.map(d => d.id || 0);
  return ids.length ? Math.max(...ids) + 1 : 1;
}

async function seed() {
  // Admin
  const admin = await db.users.findOne({ email: 'admin@shopx.com' });
  if (!admin) {
    const hash = bcrypt.hashSync('Admin@123', 10);
    await db.users.insert({ id: 1, name: 'ShopX Admin', email: 'admin@shopx.com', password: hash, is_admin: 1, created_at: new Date().toISOString() });
    console.log('✅ Admin seeded: admin@shopx.com / Admin@123');
  }

  // Categories
  const catCount = await db.cats.count({});
  if (catCount === 0) {
    const cats = [
      { id:1, name:'Electronics', icon:'💻' },
      { id:2, name:'Fashion',     icon:'👗' },
      { id:3, name:'Home & Living',icon:'🏠'},
      { id:4, name:'Sports',      icon:'⚽' },
      { id:5, name:'Beauty',      icon:'💄' },
      { id:6, name:'Books',       icon:'📚' },
    ];
    await db.cats.insert(cats);
  }

  // Products
  const prodCount = await db.products.count({});
  if (prodCount === 0) {
    const now = new Date().toISOString();
    await db.products.insert([
      { id:1,  name:'Wireless Headphones Pro', description:'Premium noise-cancelling wireless headphones with 30hr battery life and crystal clear sound.', price:2999, original_price:4999, category_id:1, image:'headphones.jpg', stock:50, rating:4.8, review_count:234, is_featured:1, created_at:now },
      { id:2,  name:'Smart Watch Ultra',        description:'Advanced fitness tracker with GPS, heart rate monitor, and 7-day battery life.',              price:5499, original_price:7999, category_id:1, image:'smartwatch.jpg', stock:30, rating:4.6, review_count:189, is_featured:1, created_at:now },
      { id:3,  name:'Designer Leather Jacket',  description:'Premium genuine leather jacket with modern slim-fit design. Available in sizes S-XXL.',        price:3499, original_price:5499, category_id:2, image:'jacket.jpg',     stock:20, rating:4.7, review_count:95,  is_featured:1, created_at:now },
      { id:4,  name:'Running Shoes Air Max',    description:'Lightweight performance running shoes with responsive cushioning technology.',                 price:1899, original_price:2999, category_id:4, image:'shoes.jpg',      stock:75, rating:4.5, review_count:312, is_featured:1, created_at:now },
      { id:5,  name:'Minimalist Desk Lamp',     description:'Elegant LED desk lamp with 5 color temperatures and touch dimmer control.',                   price:899,  original_price:1499, category_id:3, image:'lamp.jpg',       stock:60, rating:4.4, review_count:78,  is_featured:0, created_at:now },
      { id:6,  name:'Yoga Mat Premium',         description:'Eco-friendly non-slip yoga mat with alignment lines, 6mm thick.',                             price:599,  original_price:999,  category_id:4, image:'yogamat.jpg',    stock:100,rating:4.6, review_count:156, is_featured:0, created_at:now },
      { id:7,  name:'Luxury Perfume Set',       description:'Exclusive collection of 3 signature fragrances in elegant gift packaging.',                   price:2199, original_price:3499, category_id:5, image:'perfume.jpg',    stock:40, rating:4.9, review_count:67,  is_featured:0, created_at:now },
      { id:8,  name:'Bluetooth Speaker',        description:'360° surround sound, waterproof IPX7, 20-hour playtime. Perfect for outdoors.',               price:1599, original_price:2499, category_id:1, image:'speaker.jpg',    stock:45, rating:4.7, review_count:203, is_featured:0, created_at:now },
    ]);
    console.log('✅ Products seeded');
  }
}

seed().catch(console.error);
module.exports = db;
