// ── Cart State ────────────────────────────────────────────────────────────────
let cart = JSON.parse(localStorage.getItem('shopx_cart') || '[]');

function saveCart() { localStorage.setItem('shopx_cart', JSON.stringify(cart)); }

function addToCart(product, quantity = 1) {
  const existing = cart.find(i => i.id === product.id);
  if (existing) { existing.quantity += quantity; }
  else { cart.push({ ...product, quantity }); }
  saveCart();
  updateCartUI();
  showToast(`${product.name} added to cart!`, 'success');
  // Animate badge
  const badge = document.getElementById('cartBadge');
  if (badge) { badge.style.transform = 'scale(1.5)'; setTimeout(() => badge.style.transform = '', 300); }
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  updateCartUI();
}

function updateQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.quantity = Math.max(1, item.quantity + delta);
  saveCart();
  updateCartUI();
}

function getCartTotal() {
  return cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

function getCartCount() {
  return cart.reduce((sum, i) => sum + i.quantity, 0);
}

function updateCartUI() {
  const badge = document.getElementById('cartBadge');
  const itemsEl = document.getElementById('cartItems');
  const footerEl = document.getElementById('cartFooter');
  const totalEl = document.getElementById('cartTotal');

  if (badge) badge.textContent = getCartCount();

  if (!itemsEl) return;

  if (cart.length === 0) {
    itemsEl.innerHTML = `<div class="cart-empty"><span class="icon">🛒</span><p>Your cart is empty</p><a href="/#products" class="btn btn-primary" style="margin-top:1rem" onclick="closeCart()">Start Shopping</a></div>`;
    if (footerEl) footerEl.style.display = 'none';
    return;
  }

  if (footerEl) footerEl.style.display = 'block';
  if (totalEl) totalEl.textContent = `₹${getCartTotal().toLocaleString('en-IN')}`;

  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-img">
        <img src="/uploads/${item.image}" alt="${item.name}" onerror="this.parentElement.textContent='🛍️'">
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">₹${(item.price * item.quantity).toLocaleString('en-IN')}</div>
        <div class="qty-controls">
          <button class="qty-btn" onclick="updateQty(${item.id}, -1)"><i class="fa fa-minus"></i></button>
          <span class="qty-num">${item.quantity}</span>
          <button class="qty-btn" onclick="updateQty(${item.id}, 1)"><i class="fa fa-plus"></i></button>
        </div>
      </div>
      <button class="remove-item" onclick="removeFromCart(${item.id})"><i class="fa fa-trash"></i></button>
    </div>
  `).join('');
}

function openCart() {
  document.getElementById('cartOverlay')?.classList.add('open');
  document.getElementById('cartSidebar')?.classList.add('open');
  updateCartUI();
}
function closeCart() {
  document.getElementById('cartOverlay')?.classList.remove('open');
  document.getElementById('cartSidebar')?.classList.remove('open');
}

function openCheckout() {
  if (!getToken()) {
    showToast('Please login to place an order', 'error');
    setTimeout(() => location.href = '/login.html', 1000);
    return;
  }
  if (cart.length === 0) { showToast('Your cart is empty', 'error'); return; }
  closeCart();
  document.getElementById('checkoutModal')?.classList.add('open');
  const user = getUser();
  if (user && document.getElementById('shipName')) document.getElementById('shipName').value = user.name || '';
}
function closeCheckout() { document.getElementById('checkoutModal')?.classList.remove('open'); }

async function placeOrder() {
  const name    = document.getElementById('shipName')?.value.trim();
  const phone   = document.getElementById('shipPhone')?.value.trim();
  const address = document.getElementById('shipAddress')?.value.trim();
  const city    = document.getElementById('shipCity')?.value.trim();
  const method  = document.getElementById('payMethod')?.value;

  if (!name || !phone || !address || !city) { showToast('Please fill all fields', 'error'); return; }

  const btn = document.querySelector('#checkoutModal .btn-primary');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Placing...'; }

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
      body: JSON.stringify({
        items: cart.map(i => ({ product_id: i.id, quantity: i.quantity })),
        shipping: { name, phone, address, city },
        payment_method: method
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Order failed');

    cart = [];
    saveCart();
    updateCartUI();
    closeCheckout();
    showToast('🎉 Order placed successfully!', 'success', 5000);
    setTimeout(() => location.href = '/orders.html', 1500);
  } catch (err) {
    showToast(err.message, 'error');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa fa-check"></i> Place Order'; }
  }
}

// Init cart badge on load
document.addEventListener('DOMContentLoaded', () => {
  const badge = document.getElementById('cartBadge');
  if (badge) badge.textContent = getCartCount();
});
