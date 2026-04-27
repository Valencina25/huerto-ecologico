// ===== CONFIGURACIÓN =====
var DEFAULT_PRODUCTS = [
    {"id": 1, "name": "Tomate Ecologico", "price": 3.50, "category": "Verduras", "producer": "La Quinta", "image": "tomate.jpg"},
    {"id": 2, "name": "Aguacate", "price": 4.00, "category": "Frutas", "producer": "Huerta Maria", "image": "aguacate.jpg"},
    {"id": 3, "name": "Peras", "price": 3.00, "category": "Frutas", "producer": "El Pinar", "image": "peras.jpg"},
    {"id": 4, "name": "Auricular", "price": 25.00, "category": "Varios", "producer": "Artesanos Locales", "image": "auriculare.jpg"},
    {"id": 5, "name": "Botijo", "price": 35.00, "category": "Varios", "producer": "Barro y Agua", "image": "botijo.jpg"}
];

var ADMIN_PASSWORD = "huerto2024";
var PRODUCT_IMAGES = {};

var products = [];
var cart = [];
var orders = [];
var registros = [];
var currentCategory = "todos";
var adminLoggedIn = false;
var nextProductId = 100;

// ===== CARGA DE DATOS =====
function normalizeCategories() {
    for (var i = 0; i < products.length; i++) {
        if (products[i] && products[i].category) {
            var cat = products[i].category.trim().toLowerCase();
            // Capitalizar primera letra
            products[i].category = cat.charAt(0).toUpperCase() + cat.slice(1);
        }
    }
    saveProducts();
}

function loadData() {
    try {
        var stored = localStorage.getItem("products");
        if (stored) {
            products = JSON.parse(stored);
        }
        if (!products || products.length === 0) {
            products = DEFAULT_PRODUCTS.slice();
            saveProducts();
        }
    } catch(e) {
        products = DEFAULT_PRODUCTS.slice();
    }

    normalizeCategories();

    // Cargar desde data/products.json si no hay nada en localStorage
    if (!products || products.length === 0) {
        fetch("data/products.json")
            .then(function(r) { return r.json(); })
            .then(function(data) {
                products = data;
                saveProducts();
                renderProducts(false);
                renderProducts(true);
                renderAdminProducts();
                renderCategoryFilters();
            })
            .catch(function() {});
    }

    try {
        cart = JSON.parse(localStorage.getItem("cart") || "[]");
    } catch(e) {
        cart = [];
    }

    try {
        orders = JSON.parse(localStorage.getItem("huertoOrders") || "[]");
    } catch(e) {
        orders = [];
    }

    try {
        registros = JSON.parse(localStorage.getItem("registros") || "[]");
    } catch(e) {
        registros = [];
    }

    try {
        PRODUCT_IMAGES = JSON.parse(localStorage.getItem("productImages") || "{}");
    } catch(e) {
        PRODUCT_IMAGES = {};
    }

    try {
        var savedPwd = localStorage.getItem("adminPassword");
        if (savedPwd) ADMIN_PASSWORD = savedPwd;
    } catch(e) {}

    try {
        if (localStorage.getItem("adminRemember") === "true") {
            adminLoggedIn = true;
        } else {
            adminLoggedIn = localStorage.getItem("adminLoggedIn") === "true";
        }
    } catch(e) {}

    try {
        var maxId = 0;
        for (var i = 0; i < products.length; i++) {
            if (products[i].id > maxId) maxId = products[i].id;
        }
        nextProductId = maxId + 1;
    } catch(e) {}
}

function saveProducts() {
    try { localStorage.setItem("products", JSON.stringify(products)); } catch(e) {}
}

function saveCart() {
    try { localStorage.setItem("cart", JSON.stringify(cart)); } catch(e) {}
    updateCartCount();
}

function saveOrders() {
    try { localStorage.setItem("huertoOrders", JSON.stringify(orders)); } catch(e) {}
}

function saveRegistros() {
    try { localStorage.setItem("registros", JSON.stringify(registros)); } catch(e) {}
}

// ===== CONTADOR DEL CARRITO =====
function updateCartCount() {
    var count = 0;
    for (var i = 0; i < cart.length; i++) {
        count += cart[i].quantity;
    }
    var els = document.querySelectorAll(".cart-count");
    for (var c = 0; c < els.length; c++) {
        els[c].textContent = count;
    }
}

// ===== NAVEGACIÓN =====
function showSection(sectionId) {
    var sections = document.querySelectorAll(".section");
    for (var s = 0; s < sections.length; s++) {
        sections[s].classList.remove("active");
    }

    var navLinks = document.querySelectorAll(".nav a");
    for (var n = 0; n < navLinks.length; n++) {
        navLinks[n].classList.remove("active");
    }

    var section = document.getElementById(sectionId);
    if (section) section.classList.add("active");

    var navLink = document.getElementById("nav-" + sectionId);
    if (navLink) navLink.classList.add("active");

    window.scrollTo(0, 0);

    if (sectionId === "productos") {
        renderCategoryFilters();
        renderProducts(false);
    }
    if (sectionId === "home") {
        renderProducts(true);
    }
    if (sectionId === "admin") {
        showAdminContent();
    }
    if (sectionId === "carrito") {
        renderCartItems();
    }
    if (sectionId === "registro") {
        renderRegistros();
    }
}

// ===== FILTROS DE CATEGORÍA =====
function renderCategoryFilters() {
    var filtersEl = document.getElementById("category-filters");
    if (!filtersEl) return;

    var cats = {};
    for (var i = 0; i < products.length; i++) {
        if (products[i] && products[i].category) {
            cats[products[i].category] = true;
        }
    }

    var html = '<button class="btn btn-sm' + (currentCategory === "todos" ? ' active"' : '"') + ' onclick="filterByCategory(\'todos\')">Todos</button>';
    var catKeys = Object.keys(cats).sort();
    for (var c = 0; c < catKeys.length; c++) {
        var cat = catKeys[c];
        html += '<button class="btn btn-sm' + (currentCategory === cat ? ' active"' : '"') + ' onclick="filterByCategory(\'' + cat + '\')">' + cat + '</button>';
    }
    filtersEl.innerHTML = html;
}

function filterByCategory(cat) {
    currentCategory = cat;
    renderCategoryFilters();
    renderProducts(false);
}

// ===== MOSTRAR PRODUCTOS =====
function getImageSrc(imageName) {
    if (imageName && PRODUCT_IMAGES[imageName]) {
        return PRODUCT_IMAGES[imageName];
    }
    return "images/" + (imageName || "default.jpg");
}

function renderProducts(home) {
    home = home || false;
    var gridId = home ? "featured-products" : "products-grid";
    var grid = document.getElementById(gridId);
    if (!grid) return;

    var productsToShow = home ? products.slice(0, 4) : products;
    if (!home && currentCategory !== "todos") {
        productsToShow = productsToShow.filter(function(p) { return p.category === currentCategory; });
    }

    var html = "";
    for (var i = 0; i < productsToShow.length; i++) {
        var p = productsToShow[i];
        var imgSrc = getImageSrc(p.image);
        html += '<div class="product-card">' +
            '<div class="product-image">' +
            '<img src="' + imgSrc + '" alt="' + p.name + '" onerror="this.src=\'https://placehold.co/400x300/2d5a27/fff?text=' + encodeURIComponent(p.name) + '\'">' +
            '</div>' +
            '<div class="product-info">' +
            '<span class="category">' + p.category + '</span>' +
            '<h3>' + p.name + '</h3>' +
            '<p class="producer">' + p.producer + '</p>' +
            '<p class="price">' + p.price.toFixed(2) + ' €</p>' +
            '<button class="btn btn-primary" onclick="addToCart(' + p.id + ')">Añadir al carrito</button>' +
            '</div></div>';
    }
    grid.innerHTML = html;
}

// ===== CARRITO =====
function addToCart(productId) {
    var product = null;
    for (var i = 0; i < products.length; i++) {
        if (products[i].id === productId) {
            product = products[i];
            break;
        }
    }
    if (!product) return;

    var existing = null;
    for (var j = 0; j < cart.length; j++) {
        if (cart[j].id === productId) {
            existing = cart[j];
            break;
        }
    }
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({"id": product.id, "name": product.name, "price": product.price, "producer": product.producer, "image": product.image, "quantity": 1});
    }
    saveCart();
    showToast("Producto añadido");
}

function removeFromCart(productId) {
    cart = cart.filter(function(item) { return item.id !== productId; });
    saveCart();
    renderCartItems();
}

function updateCartItemQuantity(productId, delta) {
    for (var i = 0; i < cart.length; i++) {
        if (cart[i].id === productId) {
            cart[i].quantity += delta;
            if (cart[i].quantity <= 0) {
                removeFromCart(productId);
                return;
            }
            break;
        }
    }
    saveCart();
    renderCartItems();
}

function renderCartItems() {
    var emptyEl = document.getElementById("cart-empty");
    var contentEl = document.getElementById("cart-content");
    var itemsEl = document.getElementById("cart-items");
    if (!emptyEl || !contentEl) return;

    if (cart.length === 0) {
        emptyEl.style.display = "block";
        contentEl.style.display = "none";
        return;
    }

    emptyEl.style.display = "none";
    contentEl.style.display = "block";

    var html = "";
    var subtotal = 0;
    for (var i = 0; i < cart.length; i++) {
        var item = cart[i];
        var itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        var imgSrc = getImageSrc(item.image);
        html += '<div class="cart-item">' +
            '<img src="' + imgSrc + '" alt="' + item.name + '" onerror="this.src=\'https://placehold.co/100x100/2d5a27/fff?text=' + encodeURIComponent(item.name) + '\'">' +
            '<div class="cart-item-info">' +
            '<h4>' + item.name + '</h4>' +
            '<p>' + item.producer + '</p>' +
            '<div class="cart-item-controls">' +
            '<button onclick="updateCartItemQuantity(' + item.id + ', -1)">-</button>' +
            '<span>' + item.quantity + '</span>' +
            '<button onclick="updateCartItemQuantity(' + item.id + ', 1)">+</button>' +
            '</div>' +
            '</div>' +
            '<div class="cart-item-price">' +
            '<p>' + itemTotal.toFixed(2) + ' €</p>' +
            '<button class="btn btn-danger btn-sm" onclick="removeFromCart(' + item.id + ')">Eliminar</button>' +
            '</div></div>';
    }
    if (itemsEl) itemsEl.innerHTML = html;

    var subtotalEl = document.getElementById("cart-subtotal");
    var totalEl = document.getElementById("cart-total");
    if (subtotalEl) subtotalEl.textContent = subtotal.toFixed(2) + " €";
    if (totalEl) totalEl.textContent = subtotal.toFixed(2) + " €";
}

function clearCart() {
    cart = [];
    saveCart();
    renderCartItems();
}

function checkout() {
    if (cart.length === 0) return;
    openCheckoutModal();
}

function openCheckoutModal() {
    var modal = document.getElementById("checkout-modal");
    if (modal) modal.style.display = "flex";
}

function closeCheckoutModal() {
    var modal = document.getElementById("checkout-modal");
    if (modal) modal.style.display = "none";
}

function confirmOrder(customerData) {
    var total = 0;
    for (var i = 0; i < cart.length; i++) {
        total += cart[i].price * cart[i].quantity;
    }

    var order = {
        "id": Date.now(),
        "date": new Date().toLocaleString("es-ES"),
        "items": cart.slice(),
        "total": total,
        "status": "Pendiente",
        "customer": customerData
    };

    orders.push(order);
    saveOrders();

    cart = [];
    saveCart();

    renderCartItems();
    closeCheckoutModal();

    showToast("Pedido realizado con éxito");
    setTimeout(function() { showSection("home"); }, 1500);
}

// ===== ADMIN =====
function showAdminContent() {
    var loginEl = document.getElementById("admin-login");
    var contentEl = document.getElementById("admin-content");
    if (!loginEl || !contentEl) return;

    if (adminLoggedIn) {
        loginEl.style.display = "none";
        contentEl.style.display = "block";
        renderAdminProducts();
        renderAdminOrders();
    } else {
        loginEl.style.display = "block";
        contentEl.style.display = "none";
    }
}

function renderAdminProducts() {
    var tbody = document.getElementById("admin-list");
    if (!tbody) return;

    var html = "";
    for (var i = 0; i < products.length; i++) {
        var p = products[i];
        html += '<tr>' +
            '<td>' + p.id + '</td>' +
            '<td>' + p.name + '</td>' +
            '<td>' + p.category + '</td>' +
            '<td>' + p.price.toFixed(2) + ' €</td>' +
            '<td>' +
            '<button class="btn btn-sm" onclick="editProduct(' + p.id + ')">Editar</button> ' +
            '<button class="btn btn-sm btn-danger" onclick="deleteProduct(' + p.id + ')">Eliminar</button>' +
            '</td></tr>';
    }
    tbody.innerHTML = html;
}

function renderAdminOrders() {
    var tbody = document.getElementById("admin-orders");
    var noOrdersEl = document.getElementById("no-orders");
    if (!tbody) return;

    if (orders.length === 0) {
        tbody.innerHTML = "";
        if (noOrdersEl) noOrdersEl.style.display = "block";
        return;
    }

    if (noOrdersEl) noOrdersEl.style.display = "none";

    var html = "";
    for (var i = 0; i < orders.length; i++) {
        var o = orders[i];
        var itemsStr = "";
        for (var j = 0; j < o.items.length; j++) {
            itemsStr += o.items[j].name + " x" + o.items[j].quantity + ", ";
        }
        itemsStr = itemsStr.replace(/, $/, "");

        var customerInfo = "";
        if (o.customer) {
            customerInfo = "<strong>" + (o.customer.name || "") + "</strong><br>";
            customerInfo += "📞 " + (o.customer.phone || "") + "<br>";
            if (o.customer.email) customerInfo += "✉️ " + o.customer.email + "<br>";
            if (o.customer.address) customerInfo += "📍 " + o.customer.address + "<br>";
            if (o.customer.notes) customerInfo += "<small>" + o.customer.notes + "</small>";
        }

        html += '<tr>' +
            '<td>' + o.date + '</td>' +
            '<td>' + customerInfo + '</td>' +
            '<td>' + itemsStr + '</td>' +
            '<td>' + o.total.toFixed(2) + ' €</td>' +
            '<td><button class="btn btn-sm btn-danger" onclick="deleteOrder(' + o.id + ')">Eliminar</button></td>' +
            '</tr>';
    }
    tbody.innerHTML = html;
}

function deleteOrder(orderId) {
    orders = orders.filter(function(o) { return o.id !== orderId; });
    saveOrders();
    renderAdminOrders();
}

function editProduct(id) {
    var product = null;
    for (var i = 0; i < products.length; i++) {
        if (products[i].id === id) {
            product = products[i];
            break;
        }
    }
    if (!product) return;

    document.getElementById("product-id").value = product.id;
    document.getElementById("prod-name").value = product.name;
    document.getElementById("prod-price").value = product.price;
    document.getElementById("prod-category").value = product.category;
    document.getElementById("prod-producer").value = product.producer;
    document.getElementById("prod-image-name").value = product.image || "";
}

function deleteProduct(id) {
    if (!confirm("¿Eliminar este producto?")) return;
    products = products.filter(function(p) { return p.id !== id; });
    saveProducts();
    renderAdminProducts();
    renderProducts(false);
}

function resetProducts() {
    if (!confirm("¿Resetear todos los productos a los valores por defecto?")) return;
    products = DEFAULT_PRODUCTS.slice();
    saveProducts();
    renderAdminProducts();
    renderProducts(false);
}

// ===== REGISTRO (LABORES DEL HUERTO) =====
function renderRegistros() {
    var tbody = document.getElementById("registro-tbody");
    var vacioEl = document.getElementById("registro-vacio");
    if (!tbody) return;

    if (registros.length === 0) {
        tbody.innerHTML = "";
        if (vacioEl) vacioEl.style.display = "block";
        return;
    }

    if (vacioEl) vacioEl.style.display = "none";

    var html = "";
    for (var i = 0; i < registros.length; i++) {
        var r = registros[i];
        var fotoHtml = r.foto ? '<img src="' + r.foto + '" alt="foto" style="max-width:60px;max-height:60px;border-radius:4px;">' : "-";
        html += '<tr>' +
            '<td>' + (r.fecha || "") + '</td>' +
            '<td>' + (r.tipo || "") + '</td>' +
            '<td>' + (r.lugar || "") + '</td>' +
            '<td>' + (r.producto || "") + '</td>' +
            '<td>' + (r.temp || "-") + '</td>' +
            '<td>' + (r.desc || "") + '</td>' +
            '<td>' + fotoHtml + '</td>' +
            '<td>' + (r.precio ? r.precio + " €" : "-") + '</td>' +
            '<td><button class="btn btn-sm btn-danger" onclick="deleteRegistro(' + i + ')">Eliminar</button></td>' +
            '</tr>';
    }
    tbody.innerHTML = html;
    renderResumen();
}

function deleteRegistro(index) {
    registros.splice(index, 1);
    saveRegistros();
    renderRegistros();
}

function renderResumen() {
    var grid = document.getElementById("resumen-grid");
    if (!grid) return;

    var resumen = {};
    for (var i = 0; i < registros.length; i++) {
        var r = registros[i];
        if (r.fecha) {
            var month = r.fecha.substring(0, 7);
            if (!resumen[month]) resumen[month] = {"count": 0, "total": 0};
            resumen[month].count++;
            resumen[month].total += parseFloat(r.precio || 0);
        }
    }

    var html = "";
    var months = Object.keys(resumen).sort().reverse();
    for (var m = 0; m < months.length; m++) {
        var month = months[m];
        html += '<div class="resumen-card">' +
            '<h4>' + month + '</h4>' +
            '<p>' + resumen[month].count + ' labores</p>' +
            '<p class="price">' + resumen[month].total.toFixed(2) + ' €</p>' +
            '</div>';
    }
    grid.innerHTML = html;
}

// ===== TOAST =====
function showToast(msg) {
    var existing = document.querySelector(".toast");
    if (existing) existing.remove();

    var toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = msg;
    document.body.appendChild(toast);

    setTimeout(function() { toast.remove(); }, 3000);
}

// ===== EXPORT / IMPORT =====
function exportData() {
    var data = {
        "products": products,
        "images": PRODUCT_IMAGES,
        "orders": orders,
        "registros": registros
    };
    var blob = new Blob([JSON.stringify(data, null, 2)], {"type": "application/json"});
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "huerto-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    URL.revokeObjectURL(url);
}

function importData(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var data = JSON.parse(e.target.result);
            if (data.products) {
                products = data.products;
                saveProducts();
            }
            if (data.images) {
                PRODUCT_IMAGES = data.images;
                localStorage.setItem("productImages", JSON.stringify(PRODUCT_IMAGES));
            }
            if (data.orders) {
                orders = data.orders;
                saveOrders();
            }
            if (data.registros) {
                registros = data.registros;
                saveRegistros();
            }
            renderAdminProducts();
            renderProducts(false);
            renderAdminOrders();
            showToast("Datos importados correctamente");
        } catch(err) {
            alert("Error al importar: " + err.message);
        }
    };
    reader.readAsText(file);
}

// ===== INICIALIZACIÓN =====
document.addEventListener("DOMContentLoaded", function() {
    loadData();
    updateCartCount();
    renderCategoryFilters();
    showSection("home");

    // Login form
    var loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", function(e) {
            e.preventDefault();
            var pwd = document.getElementById("admin-password").value;
            var remember = document.getElementById("remember-me");
            if (pwd === ADMIN_PASSWORD) {
                adminLoggedIn = true;
                try { localStorage.setItem("adminLoggedIn", "true"); } catch(e) {}
                if (remember && remember.checked) {
                    try { localStorage.setItem("adminRemember", "true"); } catch(e) {}
                }
                showAdminContent();
                showToast("Sesión iniciada");
            } else {
                var errEl = document.getElementById("login-error");
                if (errEl) errEl.style.display = "block";
            }
        });
    }

    // Logout
    var logoutBtn = document.getElementById("btn-logout");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function() {
            adminLoggedIn = false;
            try { localStorage.setItem("adminLoggedIn", "false"); localStorage.removeItem("adminRemember"); } catch(e) {}
            showAdminContent();
        });
    }

    // Product form
    var productForm = document.getElementById("product-form");
    if (productForm) {
        productForm.addEventListener("submit", function(e) {
            e.preventDefault();
            var idInput = document.getElementById("product-id").value;
            var name = document.getElementById("prod-name").value;
            var price = parseFloat(document.getElementById("prod-price").value);
            var category = document.getElementById("prod-category").value.trim();
            var producer = document.getElementById("prod-producer").value;
            var imageName = document.getElementById("prod-image-name").value;

            // Normalizar categoría
            category = category.trim().toLowerCase();
            category = category.charAt(0).toUpperCase() + category.slice(1);

            if (idInput) {
                // Edit existing
                for (var i = 0; i < products.length; i++) {
                    if (products[i].id === parseInt(idInput)) {
                        products[i].name = name;
                        products[i].price = price;
                        products[i].category = category;
                        products[i].producer = producer;
                        if (imageName) products[i].image = imageName;
                        break;
                    }
                }
            } else {
                // New product
                var newId = nextProductId++;
                var newProd = {"id": newId, "name": name, "price": price, "category": category, "producer": producer, "image": imageName || "default.jpg"};
                products.push(newProd);
            }
            saveProducts();
            renderCategoryFilters();
            renderAdminProducts();
            renderProducts(false);
            productForm.reset();
            document.getElementById("product-id").value = "";
            showToast("Producto guardado");
        });
    }

    // Reset products
    var resetBtn = document.getElementById("btn-reset-products");
    if (resetBtn) {
        resetBtn.addEventListener("click", resetProducts);
    }

    // Clear cart
    var clearCartBtn = document.getElementById("btn-clear-cart");
    if (clearCartBtn) {
        clearCartBtn.addEventListener("click", clearCart);
    }

    // Checkout button opens modal
    var checkoutBtn = document.querySelector(".checkout-btn");
    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", function(e) {
            e.preventDefault();
            openCheckoutModal();
        });
    }

    // Checkout form submit
    var checkoutForm = document.getElementById("checkout-form");
    if (checkoutForm) {
        checkoutForm.addEventListener("submit", function(e) {
            e.preventDefault();
            var customerData = {
                "name": document.getElementById("customer-name").value,
                "phone": document.getElementById("customer-phone").value,
                "email": document.getElementById("customer-email").value,
                "address": document.getElementById("customer-address").value,
                "notes": document.getElementById("customer-notes").value
            };
            confirmOrder(customerData);
            checkoutForm.reset();
        });
    }

    // Close modal on outside click
    var modal = document.getElementById("checkout-modal");
    if (modal) {
        modal.addEventListener("click", function(e) {
            if (e.target === modal) closeCheckoutModal();
        });
    }

    // Registro form
    var registroForm = document.getElementById("registro-form");
    if (registroForm) {
        registroForm.addEventListener("submit", function(e) {
            e.preventDefault();
            var fecha = document.getElementById("reg-fecha").value;
            var temp = document.getElementById("reg-temp").value;
            var tipo = document.getElementById("reg-tipo").value;
            var lugar = document.getElementById("reg-lugar").value;
            var producto = document.getElementById("reg-producto").value;
            var desc = document.getElementById("reg-desc").value;
            var precio = document.getElementById("reg-precio").value;
            var cantidad = document.getElementById("reg-cantidad").value;
            var fotoInput = document.getElementById("reg-foto");

            var entry = {
                "fecha": fecha, "temp": temp, "tipo": tipo, "lugar": lugar,
                "producto": producto, "desc": desc, "precio": precio, "cantidad": cantidad
            };

            if (fotoInput && fotoInput.files && fotoInput.files[0]) {
                var reader = new FileReader();
                reader.onload = function(ev) {
                    entry.foto = ev.target.result;
                    registros.push(entry);
                    saveRegistros();
                    renderRegistros();
                    registroForm.reset();
                    showToast("Entrada guardada");
                };
                reader.readAsDataURL(fotoInput.files[0]);
            } else {
                registros.push(entry);
                saveRegistros();
                renderRegistros();
                registroForm.reset();
                showToast("Entrada guardada");
            }
        });
    }

    // Filtros registro
    var filtrarBtn = document.getElementById("btn-filtrar");
    if (filtrarBtn) {
        filtrarBtn.addEventListener("click", function() {
            var tipoFiltro = document.getElementById("filtro-tipo").value;
            var fechaFiltro = document.getElementById("filtro-fecha").value;
            var tbody = document.getElementById("registro-tbody");
            if (!tbody) return;

            var filtered = registros;
            if (tipoFiltro) {
                filtered = filtered.filter(function(r) { return r.tipo === tipoFiltro; });
            }
            if (fechaFiltro) {
                filtered = filtered.filter(function(r) { return r.fecha && r.fecha.startsWith(fechaFiltro); });
            }

            var html = "";
            for (var i = 0; i < filtered.length; i++) {
                var r = filtered[i];
                var fotoHtml = r.foto ? '<img src="' + r.foto + '" alt="foto" style="max-width:60px;max-height:60px;border-radius:4px;">' : "-";
                html += '<tr>' +
                    '<td>' + (r.fecha || "") + '</td>' +
                    '<td>' + (r.tipo || "") + '</td>' +
                    '<td>' + (r.lugar || "") + '</td>' +
                    '<td>' + (r.producto || "") + '</td>' +
                    '<td>' + (r.temp || "-") + '</td>' +
                    '<td>' + (r.desc || "") + '</td>' +
                    '<td>' + fotoHtml + '</td>' +
                    '<td>' + (r.precio ? r.precio + " €" : "-") + '</td>' +
                    '<td><button class="btn btn-sm btn-danger" onclick="deleteRegistro(' + registros.indexOf(r) + ')">Eliminar</button></td>' +
                    '</tr>';
            }
            tbody.innerHTML = html;
        });
    }

    var limpiarFiltrosBtn = document.getElementById("btn-limpiar-filtros");
    if (limpiarFiltrosBtn) {
        limpiarFiltrosBtn.addEventListener("click", function() {
            document.getElementById("filtro-tipo").value = "";
            document.getElementById("filtro-fecha").value = "";
            renderRegistros();
        });
    }

    // Export
    var exportBtn = document.getElementById("btn-export");
    if (exportBtn) {
        exportBtn.addEventListener("click", exportData);
    }

    // Import
    var importBtn = document.getElementById("btn-import");
    var importFile = document.getElementById("import-file");
    if (importBtn && importFile) {
        importBtn.addEventListener("click", function() {
            if (importFile.files && importFile.files[0]) {
                importData(importFile.files[0]);
            } else {
                alert("Selecciona un archivo JSON primero");
            }
        });
    }

    // Cambiar contraseña
    var passwordForm = document.getElementById("password-form");
    if (passwordForm) {
        passwordForm.addEventListener("submit", function(e) {
            e.preventDefault();
            var newPwd = document.getElementById("new-password").value;
            var confirmPwd = document.getElementById("confirm-password").value;
            if (newPwd !== confirmPwd) {
                alert("Las contraseñas no coinciden");
                return;
            }
            ADMIN_PASSWORD = newPwd;
            try { localStorage.setItem("adminPassword", newPwd); } catch(e) {}
            passwordForm.reset();
            showToast("Contraseña cambiada");
        });
    }

    // Contact form
    var contactForm = document.getElementById("contact-form");
    if (contactForm) {
        contactForm.addEventListener("submit", function(e) {
            e.preventDefault();
            showToast("Mensaje enviado (simulado)");
            contactForm.reset();
        });
    }

    console.log("App inicializada. Productos:", products.length, "Categorías:", products.map(function(p) { return p.category; }));
});
