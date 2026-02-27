const DEFAULT_PRODUCTS = [
    { id: 1, name: "Tomate Ecologico", price: 3.50, category: "Verduras", producer: "La Quinta", image: "tomate.jpg" },
    { id: 2, name: "Aguacate", price: 4.00, category: "Frutas", producer: "Huerta Maria", image: "aguacate.jpg" },
    { id: 3, name: "Peras", price: 3.00, category: "Frutas", producer: "El Pinar", image: "peras.jpg" },
    { id: 4, name: "Auricular", price: 25.00, category: "Varios", producer: "Artesanos Locales", image: "auriculare.jpg" },
    { id: 5, name: "Botijo", price: 35.00, category: "Varios", producer: "Barro y Agua", image: "botijo.jpg" }
];

let products = JSON.parse(localStorage.getItem("products")) || [...DEFAULT_PRODUCTS];
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveProducts() {
    localStorage.setItem("products", JSON.stringify(products));
}

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
}

function showSection(sectionId) {
    document.querySelectorAll(".section").forEach(function(s) { s.classList.remove("active"); });
    document.querySelectorAll(".nav a").forEach(function(a) { a.classList.remove("active"); });
    
    document.getElementById(sectionId).classList.add("active");
    var navLink = document.getElementById("nav-" + sectionId);
    if (navLink) navLink.classList.add("active");
    
    window.scrollTo(0, 0);
    
    if (sectionId === "productos" || sectionId === "home") renderProducts(sectionId === "home");
    if (sectionId === "carrito") renderCart();
    if (sectionId === "admin") {
        checkAdminAuth();
        renderAdminList();
    }
}

function renderProducts(home) {
    home = home || false;
    var gridId = home ? "featured-products" : "products-grid";
    var grid = document.getElementById(gridId);
    var productsToShow = home ? products.slice(0, 4) : products;
    
    var productImages = JSON.parse(localStorage.getItem("productImages") || "{}");
    
    var html = "";
    productsToShow.forEach(function(p) {
        var imgSrc = productImages[p.image] || ("images/" + p.image);
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
    });
    grid.innerHTML = html;
}

function addToCart(productId) {
    var product = products.find(function(p) { return p.id === productId; });
    if (!product) return;
    
    var existingItem = cart.find(function(item) { return item.id === productId; });
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push(Object.assign({}, product, { quantity: 1 }));
    }
    
    saveCart();
    showToast("Producto añadido al carrito");
}

function updateCartCount() {
    var count = cart.reduce(function(sum, item) { return sum + item.quantity; }, 0);
    document.querySelector(".cart-count").textContent = count;
}

function renderCart() {
    var emptyEl = document.getElementById("cart-empty");
    var contentEl = document.getElementById("cart-content");
    var itemsEl = document.getElementById("cart-items");
    var subtotalEl = document.getElementById("cart-subtotal");
    var totalEl = document.getElementById("cart-total");
    
    if (cart.length === 0) {
        emptyEl.style.display = "block";
        contentEl.style.display = "none";
        return;
    }
    
    emptyEl.style.display = "none";
    contentEl.style.display = "block";
    
    var productImages = JSON.parse(localStorage.getItem("productImages") || "{}");
    
    var html = "";
    cart.forEach(function(item) {
        var imgSrc = productImages[item.image] || ("images/" + item.image);
        html += '<div class="cart-item">' +
            '<img src="' + imgSrc + '" alt="' + item.name + '" onerror="this.src=\'https://placehold.co/80x80/2d5a27/fff?text=' + encodeURIComponent(item.name.charAt(0)) + '\'">' +
            '<div><h4>' + item.name + '</h4><p class="price">' + item.price.toFixed(2) + ' €</p></div>' +
            '<div class="cart-item-quantity">' +
            '<button class="btn-quantity" onclick="changeQuantity(' + item.id + ', -1)">-</button>' +
            '<span>' + item.quantity + '</span>' +
            '<button class="btn-quantity" onclick="changeQuantity(' + item.id + ', 1)">+</button></div>' +
            '<span>' + (item.price * item.quantity).toFixed(2) + ' €</span>' +
            '<button class="btn-remove" onclick="removeFromCart(' + item.id + ')">X</button></div>';
    });
    itemsEl.innerHTML = html;
    
    var subtotal = cart.reduce(function(sum, item) { return sum + item.price * item.quantity; }, 0);
    subtotalEl.textContent = subtotal.toFixed(2) + " €";
    totalEl.textContent = subtotal.toFixed(2) + " €";
}

function changeQuantity(productId, delta) {
    var item = cart.find(function(i) { return i.id === productId; });
    if (!item) return;
    
    item.quantity += delta;
    if (item.quantity <= 0) {
        cart = cart.filter(function(i) { return i.id !== productId; });
    }
    
    saveCart();
    renderCart();
}

function removeFromCart(productId) {
    cart = cart.filter(function(i) { return i.id !== productId; });
    saveCart();
    renderCart();
}

function clearCart() {
    cart = [];
    saveCart();
    renderCart();
    showToast("Carrito vaciado");
}

function renderAdminList() {
    var tbody = document.getElementById("admin-list");
    var html = "";
    products.forEach(function(p) {
        html += "<tr><td>" + p.id + "</td><td>" + p.name + "</td><td>" + p.category + "</td><td>" + p.price.toFixed(2) + " €</td><td>" +
            '<button class="btn btn-sm" onclick="editProduct(' + p.id + ')">Editar</button> ' +
            '<button class="btn btn-sm btn-danger" onclick="deleteProduct(' + p.id + ')">Eliminar</button></td></tr>';
    });
    tbody.innerHTML = html;
}

function editProduct(productId) {
    var product = products.find(function(p) { return p.id === productId; });
    if (!product) return;
    
    document.getElementById("product-id").value = product.id;
    document.getElementById("prod-name").value = product.name;
    document.getElementById("prod-price").value = product.price;
    document.getElementById("prod-category").value = product.category;
    document.getElementById("prod-producer").value = product.producer;
    document.getElementById("prod-image-name").value = product.image;
}

function deleteProduct(productId) {
    if (!confirm("¿Eliminar este producto?")) return;
    products = products.filter(function(p) { return p.id !== productId; });
    saveProducts();
    renderAdminList();
    showToast("Producto eliminado");
}

function handleProductForm(e) {
    e.preventDefault();
    
    var id = document.getElementById("product-id").value;
    var name = document.getElementById("prod-name").value;
    var price = parseFloat(document.getElementById("prod-price").value);
    var category = document.getElementById("prod-category").value;
    var producer = document.getElementById("prod-producer").value;
    var fileInput = document.getElementById("prod-image");
    var imageNameInput = document.getElementById("prod-image-name").value;
    
    var imageName = imageNameInput || "tomate.jpg";
    var hasNewImage = fileInput && fileInput.files && fileInput.files[0];
    
    function saveProductWithImage(imageData) {
        if (imageData) {
            var productImages = JSON.parse(localStorage.getItem("productImages") || "{}");
            productImages[imageName] = imageData;
            localStorage.setItem("productImages", JSON.stringify(productImages));
        }
        
        if (id) {
            var product = products.find(function(p) { return p.id === parseInt(id); });
            if (product) {
                product.name = name;
                product.price = price;
                product.category = category;
                product.producer = producer;
                if (imageNameInput || hasNewImage) {
                    product.image = imageName;
                }
            }
        } else {
            var newId = products.length > 0 ? Math.max.apply(Math, products.map(function(p) { return p.id; })) + 1 : 1;
            products.push({ id: newId, name: name, price: price, category: category, producer: producer, image: imageName });
        }
        
        saveProducts();
        document.getElementById("product-form").reset();
        document.getElementById("product-id").value = "";
        renderAdminList();
        renderProducts(false);
        showToast("Producto guardado");
    }
    
    if (hasNewImage) {
        var file = fileInput.files[0];
        var reader = new FileReader();
        reader.onload = function(event) {
            saveProductWithImage(event.target.result);
        };
        reader.readAsDataURL(file);
    } else {
        saveProductWithImage(null);
    }
}

function resetProducts() {
    if (!confirm("¿Restablecer productos a los valores por defecto?")) return;
    products = DEFAULT_PRODUCTS.slice();
    saveProducts();
    renderAdminList();
    showToast("Productos restablecidos");
}

function showToast(message) {
    var existing = document.querySelector(".toast");
    if (existing) existing.remove();
    
    var toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(function() { toast.remove(); }, 3000);
}

function checkAdminAuth() {
    var isLoggedIn = localStorage.getItem("adminLoggedIn") === "true";
    var loginEl = document.getElementById("admin-login");
    var contentEl = document.getElementById("admin-content");
    
    if (isLoggedIn) {
        loginEl.style.display = "none";
        contentEl.style.display = "block";
    } else {
        loginEl.style.display = "block";
        contentEl.style.display = "none";
    }
}

function handleLoginForm(e) {
    e.preventDefault();
    var password = document.getElementById("admin-password").value;
    var rememberMe = document.getElementById("remember-me").checked;
    var storedPassword = localStorage.getItem("adminPassword");
    var loginError = document.getElementById("login-error");
    
    if (!storedPassword) {
        if (password === "huerto2024") {
            if (rememberMe) {
                localStorage.setItem("adminPassword", password);
            }
            localStorage.setItem("adminLoggedIn", "true");
            checkAdminAuth();
            showToast("Sesion iniciada");
        } else {
            loginError.style.display = "block";
        }
    } else if (password === storedPassword) {
        localStorage.setItem("adminLoggedIn", "true");
        checkAdminAuth();
        showToast("Sesion iniciada");
    } else {
        loginError.style.display = "block";
    }
}

function handlePasswordForm(e) {
    e.preventDefault();
    var newPass = document.getElementById("new-password").value;
    var confirmPass = document.getElementById("confirm-password").value;
    
    if (newPass !== confirmPass) {
        showToast("Las contraseñas no coinciden");
        return;
    }
    
    localStorage.setItem("adminPassword", newPass);
    showToast("Contraseña actualizada");
    document.getElementById("password-form").reset();
}

function logout() {
    localStorage.setItem("adminLoggedIn", "false");
    checkAdminAuth();
    showToast("Sesion cerrada");
}

function exportData() {
    var data = {
        products: products,
        productImages: JSON.parse(localStorage.getItem("productImages") || "{}")
    };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "huerto-backup-" + new Date().toISOString().split("T")[0] + ".json";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Backup exportado");
}

function importData(e) {
    var file = e.target.files[0];
    if (!file) return;
    
    var reader = new FileReader();
    reader.onload = function(event) {
        try {
            var data = JSON.parse(event.target.result);
            if (data.products) {
                products = data.products;
                saveProducts();
            }
            if (data.productImages) {
                localStorage.setItem("productImages", JSON.stringify(data.productImages));
            }
            renderProducts(false);
            renderAdminList();
            showToast("Datos importados");
        } catch(err) {
            showToast("Error al importar");
        }
    };
    reader.readAsText(file);
    e.target.value = "";
}

function handleContactForm(e) {
    e.preventDefault();
    showToast("Mensaje enviado (simulacion)");
    e.target.reset();
}

document.addEventListener("DOMContentLoaded", function() {
    updateCartCount();
    checkAdminAuth();
    
    document.getElementById("product-form").addEventListener("submit", handleProductForm);
    document.getElementById("contact-form").addEventListener("submit", handleContactForm);
    document.getElementById("btn-clear-cart").addEventListener("click", clearCart);
    document.getElementById("btn-reset").addEventListener("click", resetProducts);
    document.getElementById("login-form").addEventListener("submit", handleLoginForm);
    document.getElementById("password-form").addEventListener("submit", handlePasswordForm);
    document.getElementById("btn-logout").addEventListener("click", logout);
    document.getElementById("btn-export").addEventListener("click", exportData);
    document.getElementById("btn-import").addEventListener("click", function() {
        document.getElementById("import-file").click();
    });
    document.getElementById("import-file").addEventListener("change", importData);
    
    document.querySelector(".checkout-btn").addEventListener("click", function() {
        if (cart.length === 0) {
            showToast("El carrito esta vacio");
            return;
        }
        showToast("Pedido realizado con exito");
        cart = [];
        saveCart();
        renderCart();
    });
    
    showSection("home");
});
