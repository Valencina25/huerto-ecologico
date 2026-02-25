// =============================
// RENDER PRODUCTOS
// =============================
function renderProductos() {
  const container = document.getElementById('products-grid');
  if (!container) return;
  
  container.innerHTML = productos.map(p => `
    <article class="product-card">
      <div class="product-image">
        <img src="${p.imagen}" alt="${p.nombre}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22><rect fill=%22%23f0f0f0%22 width=%22200%22 height=%22200%22/><text x=%22100%22 y=%22110%22 text-anchor=%22middle%22 fill=%22%23999%22 font-size=%2214%22>Sin imagen</text></svg>'">
      </div>
      <div class="product-info">
        <span class="category">${p.categoria}</span>
        <h3>${p.nombre}</h3>
        <p class="producer">🌿 ${p.productor}</p>
        <p class="price">${parseFloat(p.precio).toFixed(2)} €</p>
        <button class="btn-primary" onclick="addToCart(${p.id})">Añadir al Carrito</button>
      </div>
    </article>
  `).join('');
}

function renderDestacados() {
  const container = document.getElementById('featured-products');
  if (!container) return;
  
  const destacados = productos.slice(0, 4);
  container.innerHTML = destacados.map(p => `
    <article class="product-card">
      <div class="product-image">
        <img src="${p.imagen}" alt="${p.nombre}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22><rect fill=%22%23f0f0f0%22 width=%22200%22 height=%22200%22/><text x=%22100%22 y=%22110%22 text-anchor=%22middle%22 fill=%22%23999%22 font-size=%2214%22>Sin imagen</text></svg>'">
      </div>
      <div class="product-info">
        <span class="category">${p.categoria}</span>
        <h3>${p.nombre}</h3>
        <p class="price">${parseFloat(p.precio).toFixed(2)} €</p>
      </div>
    </article>
  `).join('');
}

function addToCart(id) {
  const producto = productos.find(p => p.id === id);
  if (producto) {
    addToCarrito(producto);
    updateCartCount();
    showToast(`✅ ${producto.nombre} añadido al carrito`);
  }
}

// =============================
// RENDER CARRITO
// =============================
function renderCarrito() {
  const empty = document.getElementById('cart-empty');
  const content = document.getElementById('cart-content');
  const itemsContainer = document.getElementById('cart-items');
  
  if (!empty || !content) return;
  
  if (carrito.length === 0) {
    empty.style.display = 'block';
    content.style.display = 'none';
    return;
  }
  
  empty.style.display = 'none';
  content.style.display = 'block';
  
  itemsContainer.innerHTML = carrito.map(item => `
    <div class="cart-item">
      <img src="${item.imagen}" alt="${item.nombre}">
      <div>
        <h4>${item.nombre}</h4>
        <p style="color: #666; font-size: 0.9rem;">${parseFloat(item.precio).toFixed(2)} €</p>
      </div>
      <div class="cart-item-quantity">
        <button class="btn-quantity" onclick="updateCartItem(${item.id}, ${item.cantidad - 1})">-</button>
        <span>${item.cantidad}</span>
        <button class="btn-quantity" onclick="updateCartItem(${item.id}, ${item.cantidad + 1})">+</button>
      </div>
      <p style="font-weight: bold; color: var(--color-primary);">${(item.precio * item.cantidad).toFixed(2)} €</p>
      <button class="btn-remove" onclick="removeCartItem(${item.id})">🗑️</button>
    </div>
  `).join('');
  
  const total = carrito.reduce((acc, item) => acc + (parseFloat(item.precio) * item.cantidad), 0);
  document.getElementById('cart-subtotal').textContent = total.toFixed(2) + ' €';
  document.getElementById('cart-total').textContent = total.toFixed(2) + ' €';
}

function updateCartItem(id, cantidad) {
  if (cantidad < 1) {
    removeCartItem(id);
  } else {
    updateCantidadCarrito(id, cantidad);
    renderCarrito();
  }
}

function removeCartItem(id) {
  removeFromCarrito(id);
  renderCarrito();
  updateCartCount();
}

function updateCartCount() {
  const countEl = document.querySelector('.cart-count');
  if (countEl) {
    const total = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    countEl.textContent = total;
  }
}

// =============================
// PANEL ADMIN
// =============================
function renderAdminList() {
  const container = document.getElementById('admin-list');
  if (!container) return;
  
  container.innerHTML = productos.map(p => `
    <tr>
      <td>${p.id}</td>
      <td>${p.nombre}</td>
      <td>${p.categoria}</td>
      <td>${parseFloat(p.precio).toFixed(2)} €</td>
      <td>
        <button class="btn btn-primary btn-sm" onclick="editProducto(${p.id})">Editar</button>
        <button class="btn btn-danger btn-sm" onclick="deleteProducto(${p.id})">Eliminar</button>
      </td>
    </tr>
  `).join('');
}

function editProducto(id) {
  const p = productos.find(prod => prod.id === id);
  if (!p) return;
  
  document.getElementById('product-id').value = p.id;
  document.getElementById('prod-name').value = p.nombre;
  document.getElementById('prod-price').value = p.precio;
  document.getElementById('prod-category').value = p.categoria;
  document.getElementById('prod-producer').value = p.productor;
  document.getElementById('prod-image').value = p.imagen.replace('images/', '');
}

function deleteProducto(id) {
  if (confirm('¿Eliminar producto?')) {
    removeProducto(id);
    refreshAll();
    showToast('Producto eliminado');
  }
}

function refreshAll() {
  renderProductos();
  renderDestacados();
  renderAdminList();
}

// =============================
// TOAST
// =============================
function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// =============================
// NAVEGACIÓN
// =============================
function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav a').forEach(a => a.classList.remove('active'));
  
  const target = document.getElementById(sectionId);
  if (target) target.classList.add('active');
  
  const navLink = document.querySelector(`.nav a[onclick="showSection('${sectionId}')"]`);
  if (navLink) navLink.classList.add('active');
  
  window.scrollTo(0, 0);
  
  if (sectionId === 'carrito') renderCarrito();
  
  if (sectionId === 'admin') {
    const pwd = prompt('Introduce contraseña de admin:');
    if (pwd !== ADMIN_PASSWORD) {
      alert('Contraseña incorrecta');
      showSection('home');
      return;
    }
    renderAdminList();
  }
}

// =============================
// INICIALIZAR
// =============================
document.addEventListener('DOMContentLoaded', () => {
  // Formulario productos admin
  const productForm = document.getElementById('product-form');
  if (productForm) {
    productForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('product-id').value;
      const producto = {
        nombre: document.getElementById('prod-name').value,
        precio: parseFloat(document.getElementById('prod-price').value),
        categoria: document.getElementById('prod-category').value,
        productor: document.getElementById('prod-producer').value,
        imagen: document.getElementById('prod-image').value
      };
      
      if (id) {
        updateProducto(parseInt(id), producto);
        showToast('Producto actualizado');
      } else {
        addProducto(producto);
        showToast('Producto añadido');
      }
      
      productForm.reset();
      document.getElementById('product-id').value = '';
      refreshAll();
    });
  }
  
  // Reset productos
  const btnReset = document.getElementById('btn-reset');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (confirm('¿Resetear todos los productos?')) {
        resetProductos();
        refreshAll();
        showToast('Productos reseteados');
      }
    });
  }
  
  // Vaciar carrito
  const btnClearCart = document.getElementById('btn-clear-cart');
  if (btnClearCart) {
    btnClearCart.addEventListener('click', () => {
      if (confirm('¿Vaciar carrito?')) {
        clearCarrito();
        renderCarrito();
        updateCartCount();
      }
    });
  }
  
  // Checkout
  const checkoutBtn = document.querySelector('.checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (carrito.length === 0) return;
      alert('¡Gracias por tu compra!');
      clearCarrito();
      renderCarrito();
      updateCartCount();
    });
  }
  
  // Inicializar vistas
  renderProductos();
  renderDestacados();
  renderCarrito();
  updateCartCount();
});

window.showSection = showSection;
window.addToCart = addToCart;
window.renderProductos = renderProductos;
window.renderDestacados = renderDestacados;
window.renderCarrito = renderCarrito;
window.updateCartCount = updateCartCount;
window.renderAdminList = renderAdminList;
window.editProducto = editProducto;
window.deleteProducto = deleteProducto;
window.updateCartItem = updateCartItem;
window.removeCartItem = removeCartItem;
window.showToast = showToast;
