let allProducts = [];
let selectedCategory = null;

// ── Scroll effects ────────────────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
  revealElements();
});

function revealElements() {
  document.querySelectorAll('.reveal').forEach(el => {
    if (el.getBoundingClientRect().top < window.innerHeight - 80) el.classList.add('visible');
  });
}

// ── Particles ─────────────────────────────────────────────────────────────────
function createParticles() {
  for (let i = 0; i < 15; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 8 + 4;
    p.style.cssText = `
      width:${size}px;height:${size}px;
      left:${Math.random()*100}vw;
      background:${['#7c3aed','#a855f7','#ec4899','#f59e0b'][Math.floor(Math.random()*4)]};
      animation-duration:${Math.random()*20+15}s;
      animation-delay:${Math.random()*15}s;
    `;
    document.body.appendChild(p);
  }
}

// ── Categories ────────────────────────────────────────────────────────────────
async function loadCategories() {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;
  try {
    const res = await fetch('/api/products/meta/categories');
    const cats = await res.json();
    grid.innerHTML = `
      <a class="cat-card active" onclick="filterByCategory(null, this)" href="#">
        <span class="cat-icon">🛍️</span>
        <div class="cat-name">All</div>
      </a>
      ${cats.map(c => `
        <a class="cat-card" onclick="filterByCategory(${c.id}, this)" href="#">
          <span class="cat-icon">${c.icon}</span>
          <div class="cat-name">${c.name}</div>
        </a>
      `).join('')}
    `;
  } catch(e) { console.error(e); }
}

function filterByCategory(id, el) {
  event.preventDefault();
  selectedCategory = id;
  document.querySelectorAll('.cat-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderProducts();
}

// ── Products ──────────────────────────────────────────────────────────────────
async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    allProducts = await res.json();
    renderProducts();
  } catch(e) { console.error(e); }
}

function filterProducts() {
  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
  let filtered = allProducts;
  if (selectedCategory) filtered = filtered.filter(p => p.category_id === selectedCategory);
  if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search) || p.description?.toLowerCase().includes(search));

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:4rem;color:var(--text2)"><div style="font-size:3rem">🔍</div><p style="margin-top:1rem">No products found</p></div>`;
    return;
  }

  grid.innerHTML = filtered.map((p, i) => {
    const discount = p.original_price ? Math.round((1 - p.price / p.original_price) * 100) : 0;
    const imgSrc = `/uploads/${p.image}`;
    const stars = '★'.repeat(Math.round(p.rating)) + '☆'.repeat(5 - Math.round(p.rating));
    return `
      <div class="product-card reveal" style="animation-delay:${i * 0.05}s" onclick="viewProduct(${p.id})">
        <div class="product-img">
          <img src="${imgSrc}" alt="${p.name}" onerror="this.parentElement.innerHTML='<div style=font-size:4rem;display:flex;align-items:center;justify-content:center;height:100%>🛍️</div>'">
        </div>
        <div class="product-body">
          <div class="product-cat">${p.category_name || 'General'}</div>
          <div class="product-name">${p.name}</div>
          <div class="product-desc">${p.description || ''}</div>
          <div class="rating">
            <span class="stars">${stars}</span>
            <span class="rating-count">(${p.review_count})</span>
          </div>
          <div class="price-row">
            <div>
              <span class="price">₹${p.price.toLocaleString('en-IN')}</span>
              ${p.original_price ? `<span class="original-price">₹${p.original_price.toLocaleString('en-IN')}</span>` : ''}
              ${discount > 0 ? `<span class="discount-badge">${discount}% OFF</span>` : ''}
            </div>
          </div>
          <button class="add-to-cart" onclick="event.stopPropagation();addToCart({id:${p.id},name:'${p.name.replace(/'/g,"\\'")}',price:${p.price},image:'${p.image}'})">
            <i class="fa fa-cart-plus"></i> Add to Cart
          </button>
        </div>
      </div>
    `;
  }).join('');
  revealElements();
}

function viewProduct(id) { location.href = `/product.html?id=${id}`; }

// ── Mobile menu ───────────────────────────────────────────────────────────────
function toggleMobile() { document.getElementById('mobileMenu').classList.toggle('open'); }
function closeMobile()  { document.getElementById('mobileMenu').classList.remove('open'); }

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  createParticles();
  loadCategories();
  loadProducts();
  revealElements();
});
