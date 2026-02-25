const ADMIN_PASSWORD = "huerto2024";

const PRODUCTOS_DEFAULT = [
  { id: 1, nombre: "Miel Cruda de Azahar", categoria: "alimentacion", precio: 15.50, imagen: "images/aguacate.jpg", productor: "Apicultura Los Alcores" },
  { id: 2, nombre: "Aceite de Oliva Virgen Extra", categoria: "alimentacion", precio: 18.90, imagen: "images/aguacate.jpg", productor: "Almazara El Viso" },
  { id: 3, nombre: "Crema Hidratante Aloe Vera", categoria: "cosmetica", precio: 12.30, imagen: "images/aguacate.jpg", productor: "Cosmética Natural Sevilla" },
  { id: 4, nombre: "Jabón Artesanal de Lavanda", categoria: "cosmetica", precio: 6.50, imagen: "images/aguacate.jpg", productor: "Jabonería La Alpujarra" },
  { id: 5, nombre: "Cerámica Decorativa Andaluza", categoria: "artesania", precio: 22.90, imagen: "images/aguacate.jpg", productor: "Taller Alfarería Triana" },
  { id: 6, nombre: "Mantel de Lino Natural", categoria: "textil", precio: 19.50, imagen: "images/aguacate.jpg", productor: "Textiles Artesanos del Sur" },
  { id: 7, nombre: "Cesta de Mimbre Natural", categoria: "artesania", precio: 14.90, imagen: "images/aguacate.jpg", productor: "Cestería Tradicional" },
  { id: 8, nombre: "Vela de Cera de Abeja", categoria: "decoracion", precio: 8.90, imagen: "images/aguacate.jpg", productor: "Elaboración Propia" }
];

let productos = [];
let carrito = [];

function initData() {
  const stored = localStorage.getItem('huerto_productos');
  productos = stored ? JSON.parse(stored) : [...PRODUCTOS_DEFAULT];
  
  if (!stored) {
    localStorage.setItem('huerto_productos', JSON.stringify(productos));
  }
  
  carrito = JSON.parse(localStorage.getItem('huerto_carrito')) || [];
}

function saveProductos() {
  localStorage.setItem('huerto_productos', JSON.stringify(productos));
}

function saveCarrito() {
  localStorage.setItem('huerto_carrito', JSON.stringify(carrito));
}

function addProducto(producto) {
  producto.id = Date.now();
  if (producto.imagen && !producto.imagen.startsWith('http') && !producto.imagen.startsWith('data:')) {
    producto.imagen = 'images/' + producto.imagen;
  }
  productos.push(producto);
  saveProductos();
}

function updateProducto(id, data) {
  const index = productos.findIndex(p => p.id === id);
  if (index !== -1) {
    productos[index] = { ...productos[index], ...data };
    saveProductos();
  }
}

function removeProducto(id) {
  productos = productos.filter(p => p.id !== id);
  saveProductos();
}

function resetProductos() {
  productos = [...PRODUCTOS_DEFAULT];
  saveProductos();
}

function addToCarrito(producto) {
  const existing = carrito.find(item => item.id === producto.id);
  if (existing) {
    existing.cantidad++;
  } else {
    carrito.push({ ...producto, cantidad: 1 });
  }
  saveCarrito();
}

function removeFromCarrito(id) {
  carrito = carrito.filter(item => item.id !== id);
  saveCarrito();
}

function updateCantidadCarrito(id, cantidad) {
  const item = carrito.find(i => i.id === id);
  if (item) {
    item.cantidad = Math.max(1, cantidad);
    saveCarrito();
  }
}

function clearCarrito() {
  carrito = [];
  saveCarrito();
}

initData();

window.productos = productos;
window.carrito = carrito;
window.addProducto = addProducto;
window.updateProducto = updateProducto;
window.removeProducto = removeProducto;
window.resetProductos = resetProductos;
window.addToCarrito = addToCarrito;
window.removeFromCarrito = removeFromCarrito;
window.updateCantidadCarrito = updateCantidadCarrito;
window.clearCarrito = clearCarrito;
window.ADMIN_PASSWORD = ADMIN_PASSWORD;
