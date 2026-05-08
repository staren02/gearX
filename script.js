/* ============================================================
   GEARX GAMING STORE — JAVASCRIPT  (script.js)
============================================================ */

/* ============================================================
   CONFIGURATION  (editable via admin settings panel)
============================================================ */
let SHIPPING_FEE = parseFloat(localStorage.getItem("gearx_shipping")) || 5;
let ADMIN_USERNAME = localStorage.getItem("gearx_adm_user") || "admin";
let ADMIN_PASSWORD = localStorage.getItem("gearx_adm_pass") || "gearx2026";

/* ============================================================
   DEFAULT PRODUCTS
============================================================ */
const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: "ProSound X9 Headset",
    cat: "Headsets",
    price: 89.99,
    badge: "hot",
    icon: "🎧",
    desc: "Immersive surround sound with noise cancellation.",
    status: "active",
  },
  {
    id: 2,
    name: "Blaze 7 Gaming Mouse",
    cat: "Mice & KB",
    price: 54.99,
    badge: "",
    icon: "🖱️",
    desc: "16000 DPI optical sensor, 7 programmable buttons.",
    status: "active",
  },
  {
    id: 3,
    name: "VisionPro VR Headset",
    cat: "VR Gear",
    price: 299.0,
    badge: "new",
    icon: "🕶️",
    desc: "4K per-eye display with 120Hz refresh rate.",
    status: "active",
  },
  {
    id: 4,
    name: "AxisPad Elite Controller",
    cat: "Controllers",
    price: 69.99,
    badge: "",
    icon: "🎮",
    desc: "Hall-effect sticks, 12h battery, dual rumble.",
    status: "active",
  },
  {
    id: 5,
    name: "NovaMech Keyboard",
    cat: "Mice & KB",
    price: 129.99,
    badge: "new",
    icon: "⌨️",
    desc: "Tactile mechanical switches, RGB, TKL form factor.",
    status: "active",
  },
  {
    id: 6,
    name: 'Titan 27" Monitor',
    cat: "Monitors",
    price: 349.99,
    badge: "sale",
    icon: "🖥️",
    desc: "240Hz, 1ms, HDR, G-Sync compatible.",
    status: "active",
  },
];

/* ============================================================
   APP STATE
============================================================ */
let products =
  JSON.parse(localStorage.getItem("gearx_products")) || DEFAULT_PRODUCTS;
let orders = JSON.parse(localStorage.getItem("gearx_orders")) || [];
let clients = JSON.parse(localStorage.getItem("gearx_clients")) || [];
let currentUser = JSON.parse(sessionStorage.getItem("gearx_user")) || null;
let cart = [];
let nextProductId = Math.max(...products.map((p) => p.id), 0) + 1;
let currentStep = 1;
let activeCategory = "all";
let editingId = null;
let paypalRendered = false;
let toastTimer;

/* ============================================================
   PERSIST DATA
============================================================ */
function saveData() {
  localStorage.setItem("gearx_products", JSON.stringify(products));
  localStorage.setItem("gearx_orders", JSON.stringify(orders));
  localStorage.setItem("gearx_clients", JSON.stringify(clients));
}

function saveCart() {
  // Save cart against logged-in user so it persists across sessions
  if (currentUser) {
    const carts = JSON.parse(localStorage.getItem("gearx_carts") || "{}");
    carts[currentUser.email] = cart;
    localStorage.setItem("gearx_carts", JSON.stringify(carts));
  }
}

function loadUserCart() {
  if (currentUser) {
    const carts = JSON.parse(localStorage.getItem("gearx_carts") || "{}");
    cart = carts[currentUser.email] || [];
  } else {
    cart = [];
  }
}

/* ============================================================
   SCROLL REVEAL
============================================================ */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add("visible");
    });
  },
  { threshold: 0.12 },
);

document
  .querySelectorAll(".reveal, .reveal-left, .reveal-right")
  .forEach((el) => {
    revealObserver.observe(el);
  });

function scrollToSection(id) {
  document.getElementById(id).scrollIntoView({ behavior: "smooth" });
}

/* ============================================================
   MOBILE NAV MENU
============================================================ */
function toggleMenu() {
  const links = document.getElementById("nav-links");
  const burger = document.getElementById("hamburger");
  const overlay = document.getElementById("mobile-overlay");
  const isOpen = links.classList.toggle("open");
  burger.classList.toggle("open", isOpen);
  overlay.classList.toggle("show", isOpen);
}

function closeMenu() {
  document.getElementById("nav-links").classList.remove("open");
  document.getElementById("hamburger").classList.remove("open");
  document.getElementById("mobile-overlay").classList.remove("show");
}

/* ============================================================
   ADMIN SIDEBAR TOGGLE (mobile)
============================================================ */
function toggleAdmSidebar() {
  document.getElementById("adm-sidebar").classList.toggle("open");
  document.getElementById("adm-sidebar-overlay").classList.toggle("show");
}

function closeAdmSidebar() {
  document.getElementById("adm-sidebar").classList.remove("open");
  document.getElementById("adm-sidebar-overlay").classList.remove("show");
}

/* ============================================================
   AUTH DRAWER — OPEN / CLOSE / TAB SWITCH
============================================================ */
function toggleAuthDrawer() {
  const overlay = document.getElementById("auth-overlay");
  const isOpen = overlay.classList.toggle("open");
  if (isOpen) updateAuthDrawerUI();
}

function handleAuthOverlayClick(e) {
  if (e.target === document.getElementById("auth-overlay")) toggleAuthDrawer();
}

function switchAuthTab(tab) {
  // Toggle tab buttons
  document
    .getElementById("tab-login")
    .classList.toggle("active", tab === "login");
  document
    .getElementById("tab-register")
    .classList.toggle("active", tab === "register");

  // Show correct form
  document
    .getElementById("auth-login-form")
    .classList.toggle("active", tab === "login");
  document
    .getElementById("auth-register-form")
    .classList.toggle("active", tab === "register");
  document.getElementById("auth-loggedin-form").classList.remove("active");

  // Update title
  document.getElementById("auth-drawer-title").textContent =
    tab === "login" ? "Welcome Back" : "Create Account";

  // Clear errors
  clearAuthErr("login-err");
  clearAuthErr("register-err");
}

/** Update the auth drawer based on login state */
function updateAuthDrawerUI() {
  if (currentUser) {
    // Show logged-in profile view
    document.getElementById("auth-login-form").classList.remove("active");
    document.getElementById("auth-register-form").classList.remove("active");
    document.getElementById("auth-loggedin-form").classList.add("active");
    document.getElementById("auth-drawer-title").textContent = "My Account";

    const initials = (
      currentUser.firstName[0] + currentUser.lastName[0]
    ).toUpperCase();
    document.getElementById("user-avatar").textContent = initials;
    document.getElementById("user-display-name").textContent =
      `${currentUser.firstName} ${currentUser.lastName}`;
    document.getElementById("user-display-email").textContent =
      currentUser.email;

    const userOrders = orders.filter(
      (o) => o.userEmail === currentUser.email,
    ).length;
    document.getElementById("ustat-orders").textContent = userOrders;
    document.getElementById("ustat-cart").textContent = cart.reduce(
      (s, i) => s + i.qty,
      0,
    );
  } else {
    switchAuthTab("login");
  }
}

/** Update nav button based on login state */
function updateNavAuth() {
  const btn = document.getElementById("auth-nav-btn");
  if (currentUser) {
    document.getElementById("auth-nav-label").textContent =
      `👤 ${currentUser.firstName}`;
    btn.classList.add("logged-in");
  } else {
    document.getElementById("auth-nav-label").textContent = "🔑 Login";
    btn.classList.remove("logged-in");
  }
}

function showAuthErr(elId, msg) {
  const el = document.getElementById(elId);
  el.textContent = msg;
  el.classList.add("show");
  el.style.display = "block";
}

function clearAuthErr(elId) {
  const el = document.getElementById(elId);
  el.classList.remove("show");
  el.style.display = "none";
}

/* ============================================================
   CLIENT REGISTRATION
============================================================ */
function doRegister() {
  clearAuthErr("register-err");

  const firstName = document.getElementById("reg-fname").value.trim();
  const lastName = document.getElementById("reg-lname").value.trim();
  const username = document
    .getElementById("reg-username")
    .value.trim()
    .toLowerCase();
  const email = document.getElementById("reg-email").value.trim().toLowerCase();
  const password = document.getElementById("reg-password").value;
  const confirm = document.getElementById("reg-confirm").value;

  // Validation
  if (!firstName || !lastName || !username || !email || !password) {
    return showAuthErr("register-err", "Please fill in all fields.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return showAuthErr("register-err", "Please enter a valid email address.");
  }
  if (username.length < 3) {
    return showAuthErr(
      "register-err",
      "Username must be at least 3 characters.",
    );
  }
  if (password.length < 6) {
    return showAuthErr(
      "register-err",
      "Password must be at least 6 characters.",
    );
  }
  if (password !== confirm) {
    return showAuthErr("register-err", "Passwords do not match.");
  }

  // Check duplicates
  if (clients.find((c) => c.email === email)) {
    return showAuthErr(
      "register-err",
      "An account with this email already exists.",
    );
  }
  if (clients.find((c) => c.username === username)) {
    return showAuthErr("register-err", "This username is already taken.");
  }

  // Create account
  const newClient = {
    id: Date.now(),
    firstName,
    lastName,
    username,
    email,
    password, // NOTE: in production use a backend with hashed passwords
    joined: new Date().toLocaleDateString(),
  };
  clients.push(newClient);
  saveData();

  // Auto-login after registration
  loginUser(newClient);
  showToast(`Welcome to GearX, ${firstName}! 🎮`);
  toggleAuthDrawer();
}

/* ============================================================
   CLIENT LOGIN
============================================================ */
function doClientLogin() {
  clearAuthErr("login-err");

  const identifier = document
    .getElementById("login-identifier")
    .value.trim()
    .toLowerCase();
  const password = document.getElementById("login-password").value;

  if (!identifier || !password) {
    return showAuthErr("login-err", "Please fill in all fields.");
  }

  // Match by email OR username
  const client = clients.find(
    (c) =>
      (c.email === identifier || c.username === identifier) &&
      c.password === password,
  );

  if (!client) {
    return showAuthErr("login-err", "Incorrect email/username or password.");
  }

  loginUser(client);
  showToast(`Welcome back, ${client.firstName}! 🎮`);
  toggleAuthDrawer();
}

function loginUser(client) {
  currentUser = client;
  sessionStorage.setItem("gearx_user", JSON.stringify(client));
  loadUserCart(); // restore their saved cart
  updateNavAuth();
  updateCartUI();
}

function doClientLogout() {
  saveCart(); // save cart before logging out
  currentUser = null;
  cart = [];
  sessionStorage.removeItem("gearx_user");
  updateNavAuth();
  updateCartUI();
  toggleAuthDrawer();
  showToast("You have been logged out.");
}

/* Show / hide password */
function togglePw(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === "password") {
    input.type = "text";
    btn.textContent = "🙈";
  } else {
    input.type = "password";
    btn.textContent = "👁";
  }
}

/* ============================================================
   PRODUCTS — STOREFRONT
============================================================ */
function renderProducts(cat = "all") {
  activeCategory = cat;
  const grid = document.getElementById("prod-grid");
  const filtered =
    cat === "all"
      ? products.filter((p) => p.status === "active")
      : products.filter((p) => p.cat === cat && p.status === "active");

  if (!filtered.length) {
    grid.innerHTML =
      '<p style="color:var(--muted);grid-column:1/-1;text-align:center;padding:40px 0;">No products in this category yet.</p>';
    return;
  }

  grid.innerHTML = filtered
    .map(
      (p, i) => `
    <div class="prod-card reveal" style="transition-delay:${i * 0.07}s">
      <div class="prod-img-wrap">
        ${p.badge ? `<span class="prod-badge-${p.badge}">${p.badge.toUpperCase()}</span>` : ""}
        ${p.icon}
      </div>
      <div class="prod-body">
        <div class="prod-cat">${p.cat}</div>
        <div class="prod-name">${p.name}</div>
        <div class="prod-desc">${p.desc}</div>
        <div class="prod-footer">
          <span class="prod-price">$${p.price.toFixed(2)}</span>
          <button class="add-cart-btn" onclick="addToCart(${p.id})" title="Add to cart">+</button>
        </div>
      </div>
    </div>`,
    )
    .join("");

  grid.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
}

function filterCat(cat, event) {
  document
    .querySelectorAll(".cat-card")
    .forEach((c) => c.classList.remove("selected"));
  event.currentTarget.classList.add("selected");
  renderProducts(cat);
  scrollToSection("products");
}

/* ============================================================
   CART
============================================================ */
function addToCart(productId) {
  if (!currentUser) {
    showToast("Please login to add items to your cart 🔑", true);
    toggleAuthDrawer();
    return;
  }
  const product = products.find((p) => p.id === productId);
  if (!product) return;
  const existing = cart.find((i) => i.id === productId);
  if (existing) existing.qty++;
  else cart.push({ ...product, qty: 1 });
  saveCart();
  updateCartUI();
  showToast(`${product.icon} ${product.name} added to cart!`);
}

function removeFromCart(productId) {
  cart = cart.filter((i) => i.id !== productId);
  saveCart();
  updateCartUI();
}

function changeQty(productId, delta) {
  const item = cart.find((i) => i.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(productId);
  else {
    saveCart();
    updateCartUI();
  }
}

function cartSubtotal() {
  return cart.reduce((s, i) => s + i.price * i.qty, 0);
}
function cartTotal() {
  return cartSubtotal() + (cart.length ? SHIPPING_FEE : 0);
}
function clearCart() {
  cart = [];
  saveCart();
  updateCartUI();
}

/* ============================================================
   CART UI
============================================================ */
function updateCartUI() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById("cart-count").textContent = count;

  const itemsList = document.getElementById("cart-items-list");
  const summaryEl = document.getElementById("cart-summary");
  const checkoutBtn = document.getElementById("checkout-trigger");

  if (!cart.length) {
    itemsList.innerHTML = `<div class="cart-empty"><span class="icon">🛒</span><p>${currentUser ? "Your cart is empty." : "Login to save your cart."}</p></div>`;
    summaryEl.innerHTML = "";
    checkoutBtn.disabled = true;
    return;
  }

  checkoutBtn.disabled = false;
  itemsList.innerHTML = cart
    .map(
      (item) => `
    <div class="cart-item">
      <div class="cart-item-icon">${item.icon}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="changeQty(${item.id},-1)">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${item.id},1)">+</button>
        </div>
      </div>
      <button class="cart-rm" onclick="removeFromCart(${item.id})">🗑</button>
    </div>`,
    )
    .join("");

  summaryEl.innerHTML = `
    <div class="cart-summary-row"><span>Subtotal</span><span>$${cartSubtotal().toFixed(2)}</span></div>
    <div class="cart-summary-row"><span>Shipping</span><span>$${SHIPPING_FEE.toFixed(2)}</span></div>
    <div class="cart-summary-row total"><span>Total</span><span>$${cartTotal().toFixed(2)}</span></div>`;
}

function toggleCart() {
  document.getElementById("cart-overlay").classList.toggle("open");
}

function handleOverlayClick(e) {
  if (e.target === document.getElementById("cart-overlay")) toggleCart();
}

/* ============================================================
   CHECKOUT
============================================================ */
function openCheckout() {
  if (!cart.length) return;
  toggleCart();
  // Pre-fill shipping with user's name if logged in
  if (currentUser) {
    document.getElementById("sh-fname").value = currentUser.firstName;
    document.getElementById("sh-lname").value = currentUser.lastName;
  }
  document.getElementById("checkout-modal").classList.add("open");
  goStep(1);
}

function closeCheckout() {
  document.getElementById("checkout-modal").classList.remove("open");
}

function goStep(n) {
  currentStep = n;
  if (n === 2) {
    if (!validateShipping()) return;
    buildOrderReview();
  }
  if (n === 3) {
    buildPayPalSummary();
    initPayPal();
  }

  document.querySelectorAll(".checkout-step").forEach((p, i) => {
    p.classList.toggle("active", i === n - 1);
  });
  [1, 2, 3].forEach((i) => {
    const dot = document.getElementById(`sdot-${i}`);
    dot.classList.remove("active", "done");
    if (i === n) dot.classList.add("active");
    else if (i < n) dot.classList.add("done");
  });
  const labels = { 1: "Shipping Details", 2: "Review Order", 3: "Payment" };
  document.getElementById("step-text-label").textContent = labels[n] || "";
}

function validateShipping() {
  const fields = [
    "sh-fname",
    "sh-lname",
    "sh-phone",
    "sh-address",
    "sh-city",
    "sh-country",
  ];
  for (const id of fields) {
    if (!document.getElementById(id).value.trim()) {
      showToast("Please fill in all shipping fields.", true);
      document.getElementById(id).focus();
      return false;
    }
  }
  return true;
}

function getShippingDetails() {
  return {
    name: `${document.getElementById("sh-fname").value.trim()} ${document.getElementById("sh-lname").value.trim()}`,
    phone: document.getElementById("sh-phone").value.trim(),
    address: document.getElementById("sh-address").value.trim(),
    city: document.getElementById("sh-city").value.trim(),
    country: document.getElementById("sh-country").value.trim(),
  };
}

function buildOrderReview() {
  const sh = getShippingDetails();
  document.getElementById("delivery-address-preview").textContent =
    `${sh.name} · ${sh.phone} · ${sh.address}, ${sh.city}, ${sh.country}`;
  document.getElementById("order-review").innerHTML = buildOrderSummaryHTML();
}

function buildPayPalSummary() {
  document.getElementById("paypal-order-summary").innerHTML =
    buildOrderSummaryHTML();
}

function buildOrderSummaryHTML() {
  return (
    cart
      .map(
        (i) =>
          `<div class="osi-row"><span>${i.icon} ${i.name} × ${i.qty}</span><span>$${(i.price * i.qty).toFixed(2)}</span></div>`,
      )
      .join("") +
    `
    <div class="osi-row"><span>Shipping</span><span>$${SHIPPING_FEE.toFixed(2)}</span></div>
    <div class="osi-row bold"><span>Total</span><span>$${cartTotal().toFixed(2)}</span></div>`
  );
}

/* ============================================================
   PAYPAL
============================================================ */
function initPayPal() {
  const container = document.getElementById("paypal-button-container");
  if (paypalRendered) {
    container.innerHTML = "";
    paypalRendered = false;
  }

  if (typeof paypal === "undefined") {
    container.innerHTML =
      '<p style="color:#ff4444;font-size:13px;">PayPal not loaded. Replace YOUR_PAYPAL_CLIENT_ID in index.html with your real Live Client ID.</p>';
    return;
  }
  paypalRendered = true;

  paypal
    .Buttons({
      style: { layout: "vertical", color: "blue", shape: "rect", label: "pay" },
      createOrder: (data, actions) =>
        actions.order.create({
          purchase_units: [
            {
              amount: { value: cartTotal().toFixed(2), currency_code: "USD" },
              description: `GearX Order`,
            },
          ],
        }),
      onApprove: (data, actions) =>
        actions.order.capture().then((details) => {
          const sh = getShippingDetails();
          const orderNum = "GX-" + Date.now().toString(36).toUpperCase();
          const newOrder = {
            id: orderNum,
            userEmail: currentUser ? currentUser.email : "guest",
            customer: sh.name,
            phone: sh.phone,
            address: `${sh.address}, ${sh.city}, ${sh.country}`,
            items: cart.map((i) => ({
              name: i.name,
              qty: i.qty,
              price: i.price,
            })),
            total: cartTotal(),
            date: new Date().toLocaleDateString(),
            paypalId: details.id,
            status: "Paid",
          };
          orders.unshift(newOrder);
          saveData();
          document.getElementById("order-ref-display").textContent =
            `Order #${orderNum} · PayPal: ${details.id}`;
          goStep(4);
        }),
      onError: (err) => {
        showToast("Payment failed. Please try again.", true);
        console.error("PayPal error:", err);
      },
    })
    .render("#paypal-button-container");
}

/* ============================================================
   ADMIN LOGIN / LOGOUT
============================================================ */
function openAdminLogin(e) {
  e.preventDefault();
  document.getElementById("login-modal").classList.add("open");
  document.getElementById("login-err").style.display = "none";
  document.getElementById("adm-user").value = "";
  document.getElementById("adm-pass").value = "";
}

function closeAdminLogin() {
  document.getElementById("login-modal").classList.remove("open");
}

function doLogin() {
  const u = document.getElementById("adm-user").value.trim();
  const p = document.getElementById("adm-pass").value;
  if (u === ADMIN_USERNAME && p === ADMIN_PASSWORD) {
    closeAdminLogin();
    document.getElementById("store-page").style.display = "none";
    document.getElementById("admin-page").classList.add("active");
    document.getElementById("adm-date").textContent =
      new Date().toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    // Populate settings fields with current values
    document.getElementById("set-username").value = ADMIN_USERNAME;
    document.getElementById("set-shipping").value = SHIPPING_FEE;
    refreshAdminData();
  } else {
    document.getElementById("login-err").style.display = "block";
  }
}

function logoutAdmin() {
  document.getElementById("admin-page").classList.remove("active");
  document.getElementById("store-page").style.display = "";
}

/* ============================================================
   ADMIN — SECTION SWITCHER
============================================================ */
function showAdmSection(name, el) {
  document
    .querySelectorAll(".adm-section")
    .forEach((s) => s.classList.remove("active"));
  document
    .querySelectorAll(".adm-menu a")
    .forEach((a) => a.classList.remove("active"));
  document.getElementById(`adm-${name}`).classList.add("active");
  el.classList.add("active");
  closeAdmSidebar(); // close sidebar on mobile after nav
}

/* ============================================================
   ADMIN — REFRESH DATA
============================================================ */
function refreshAdminData() {
  document.getElementById("stat-prods").textContent = products.length;
  document.getElementById("stat-orders").textContent = orders.length;
  document.getElementById("stat-clients").textContent = clients.length;
  const rev = orders.reduce((s, o) => s + o.total, 0);
  document.getElementById("stat-rev").textContent = "$" + rev.toFixed(2);
  renderAdmTable();
  renderOrdersTable();
  renderClientsTable();
  renderRecentOrders();
}

function renderAdmTable() {
  const q = (document.getElementById("prod-search")?.value || "").toLowerCase();
  const filtered = products.filter(
    (p) => p.name.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q),
  );
  document.getElementById("prod-count-label").textContent = filtered.length;
  document.getElementById("adm-prod-tbody").innerHTML = filtered
    .map(
      (p) => `
    <tr>
      <td class="tbl-icon">${p.icon}</td>
      <td><strong>${p.name}</strong></td>
      <td>${p.cat}</td>
      <td>$${p.price.toFixed(2)}</td>
      <td><span class="badge-${p.status}">${p.status.charAt(0).toUpperCase() + p.status.slice(1)}</span></td>
      <td><span class="tbl-edit" onclick="openProdModal(${p.id})">Edit</span><span class="tbl-del" onclick="deleteProduct(${p.id})">Delete</span></td>
    </tr>`,
    )
    .join("");
}

function renderOrdersTable() {
  document.getElementById("orders-count-label").textContent = orders.length;
  document.getElementById("adm-orders-tbody").innerHTML = orders.length
    ? orders
        .map(
          (o) => `
      <tr>
        <td><strong>${o.id}</strong></td>
        <td>${o.customer}<br><small style="color:#888">${o.phone}</small></td>
        <td>${o.items.map((i) => `${i.name} ×${i.qty}`).join("<br>")}</td>
        <td>$${o.total.toFixed(2)}</td>
        <td>${o.address.split(",").slice(-2).join(",")}</td>
        <td>${o.date}</td>
        <td><span class="badge-active">${o.status}</span></td>
      </tr>`,
        )
        .join("")
    : '<tr><td colspan="7" style="text-align:center;color:#888;padding:24px;">No orders yet.</td></tr>';
}

function renderClientsTable() {
  document.getElementById("clients-count-label").textContent = clients.length;
  document.getElementById("adm-clients-tbody").innerHTML = clients.length
    ? clients
        .map((c) => {
          const userOrderCount = orders.filter(
            (o) => o.userEmail === c.email,
          ).length;
          return `
          <tr>
            <td><strong>${c.firstName} ${c.lastName}</strong></td>
            <td>${c.username}</td>
            <td>${c.email}</td>
            <td>${c.joined}</td>
            <td>${userOrderCount}</td>
          </tr>`;
        })
        .join("")
    : '<tr><td colspan="5" style="text-align:center;color:#888;padding:24px;">No clients registered yet.</td></tr>';
}

function renderRecentOrders() {
  const el = document.getElementById("adm-recent-orders");
  if (!orders.length) {
    el.innerHTML =
      '<p style="text-align:center;padding:20px;color:#888;">No orders yet.</p>';
    return;
  }
  el.innerHTML = `
    <div class="table-scroll">
      <table class="adm-table">
        <thead><tr><th>Order #</th><th>Customer</th><th>Total</th><th>Date</th><th>Status</th></tr></thead>
        <tbody>${orders
          .slice(0, 5)
          .map(
            (o) => `
          <tr>
            <td>${o.id}</td><td>${o.customer}</td>
            <td>$${o.total.toFixed(2)}</td><td>${o.date}</td>
            <td><span class="badge-active">${o.status}</span></td>
          </tr>`,
          )
          .join("")}
        </tbody>
      </table>
    </div>`;
}

/* ============================================================
   ADMIN — PRODUCT CRUD
============================================================ */
function openProdModal(id = null) {
  editingId = id;
  document.getElementById("prod-modal").classList.add("open");
  if (id) {
    const p = products.find((x) => x.id === id);
    document.getElementById("pm-title").textContent = "Edit Product";
    document.getElementById("pm-id").value = p.id;
    document.getElementById("pm-name").value = p.name;
    document.getElementById("pm-cat").value = p.cat;
    document.getElementById("pm-price").value = p.price;
    document.getElementById("pm-badge").value = p.badge;
    document.getElementById("pm-icon").value = p.icon;
    document.getElementById("pm-desc").value = p.desc;
    document.getElementById("pm-status").value = p.status;
  } else {
    document.getElementById("pm-title").textContent = "Add Product";
    ["pm-id", "pm-name", "pm-price", "pm-icon", "pm-desc"].forEach(
      (fid) => (document.getElementById(fid).value = ""),
    );
    document.getElementById("pm-cat").value = "Controllers";
    document.getElementById("pm-badge").value = "";
    document.getElementById("pm-status").value = "active";
  }
}

function closeProdModal() {
  document.getElementById("prod-modal").classList.remove("open");
}

function saveProduct() {
  const name = document.getElementById("pm-name").value.trim();
  const price = parseFloat(document.getElementById("pm-price").value);
  const icon = document.getElementById("pm-icon").value.trim();
  if (!name || !price || !icon) {
    showToast("Please fill in name, price and icon.", true);
    return;
  }

  const data = {
    name,
    price,
    cat: document.getElementById("pm-cat").value,
    badge: document.getElementById("pm-badge").value,
    icon,
    desc: document.getElementById("pm-desc").value.trim(),
    status: document.getElementById("pm-status").value,
  };

  if (editingId) {
    const idx = products.findIndex((p) => p.id === editingId);
    products[idx] = { ...products[idx], ...data };
    showToast("Product updated!");
  } else {
    products.push({ id: nextProductId++, ...data });
    showToast("Product added!");
  }

  saveData();
  closeProdModal();
  renderProducts(activeCategory);
  refreshAdminData();
}

function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;
  products = products.filter((p) => p.id !== id);
  saveData();
  renderProducts(activeCategory);
  refreshAdminData();
  showToast("Product deleted.");
}

/* ============================================================
   ADMIN — CHANGE CREDENTIALS
============================================================ */
function saveAdminCredentials() {
  const newUsername = document.getElementById("set-username").value.trim();
  const currentPass = document.getElementById("set-current-pass").value;
  const newPass = document.getElementById("set-new-pass").value;
  const confirmPass = document.getElementById("set-confirm-pass").value;
  const errEl = document.getElementById("settings-err");
  const okEl = document.getElementById("settings-ok");

  errEl.style.display = "none";
  okEl.style.display = "none";

  // Verify current password
  if (currentPass !== ADMIN_PASSWORD) {
    errEl.textContent = "Current password is incorrect.";
    errEl.style.display = "block";
    return;
  }

  if (!newUsername) {
    errEl.textContent = "Username cannot be empty.";
    errEl.style.display = "block";
    return;
  }

  // If changing password, validate it
  if (newPass) {
    if (newPass.length < 6) {
      errEl.textContent = "New password must be at least 6 characters.";
      errEl.style.display = "block";
      return;
    }
    if (newPass !== confirmPass) {
      errEl.textContent = "New passwords do not match.";
      errEl.style.display = "block";
      return;
    }
    ADMIN_PASSWORD = newPass;
    localStorage.setItem("gearx_adm_pass", ADMIN_PASSWORD);
  }

  ADMIN_USERNAME = newUsername;
  localStorage.setItem("gearx_adm_user", ADMIN_USERNAME);

  // Clear password fields
  document.getElementById("set-current-pass").value = "";
  document.getElementById("set-new-pass").value = "";
  document.getElementById("set-confirm-pass").value = "";

  okEl.textContent = "✅ Credentials updated successfully!";
  okEl.style.display = "block";
  showToast("Admin credentials saved!");
}

/* ============================================================
   ADMIN — STORE SETTINGS
============================================================ */
function saveStoreSettings() {
  const name = document.getElementById("set-store-name").value.trim();
  const shipping = parseFloat(document.getElementById("set-shipping").value);

  if (!name) {
    showToast("Store name cannot be empty.", true);
    return;
  }
  if (isNaN(shipping) || shipping < 0) {
    showToast("Invalid shipping fee.", true);
    return;
  }

  SHIPPING_FEE = shipping;
  localStorage.setItem("gearx_shipping", SHIPPING_FEE);
  updateCartUI();
  showToast("Store settings saved!");
}

/* ============================================================
   TOAST
============================================================ */
function showToast(msg, isError = false) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "show" + (isError ? " error" : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.className = ""), 3000);
}

/* ============================================================
   INIT
============================================================ */
loadUserCart();
renderProducts();
updateCartUI();
updateNavAuth();
