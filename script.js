/* ============================================================
   GEARX GAMING STORE — JAVASCRIPT
   script.js
   ============================================================ */

/* ============================================================
   CONFIGURATION
   Edit these values to change store settings
   ============================================================ */
const SHIPPING_FEE = 5; // Flat shipping fee in USD
const ADMIN_USERNAME = "admin"; // Admin login username
const ADMIN_PASSWORD = "gearx2026"; // Admin login password

/* ============================================================
   DEFAULT PRODUCT DATA
   These load on first visit. After that, localStorage is used.
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
    name: 'Titan 27" Gaming Monitor',
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
let cart = [];
let nextProductId = Math.max(...products.map((p) => p.id), 0) + 1;
let currentStep = 1;
let activeCategory = "all";
let editingId = null;
let paypalRendered = false;
let toastTimer;

/* ============================================================
   SAVE TO LOCAL STORAGE
   ============================================================ */
function saveData() {
  localStorage.setItem("gearx_products", JSON.stringify(products));
  localStorage.setItem("gearx_orders", JSON.stringify(orders));
}

/* ============================================================
   SCROLL REVEAL (runs on page load)
   ============================================================ */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
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
   PRODUCTS — STOREFRONT
   ============================================================ */

/** Render product cards on the storefront */
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
    <div class="prod-card reveal" style="transition-delay: ${i * 0.07}s">
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
    </div>
  `,
    )
    .join("");

  // Re-observe newly created product cards for scroll reveal
  grid.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
}

/** Filter products by category when a category card is clicked */
function filterCat(cat, event) {
  activeCategory = cat;
  document
    .querySelectorAll(".cat-card")
    .forEach((c) => c.classList.remove("selected"));
  event.currentTarget.classList.add("selected");
  renderProducts(cat);
  scrollToSection("products");
}

/* ============================================================
   CART — ADD / REMOVE / QUANTITY
   ============================================================ */

function addToCart(productId) {
  const product = products.find((p) => p.id === productId);
  if (!product) return;

  const existing = cart.find((item) => item.id === productId);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  updateCartUI();
  showToast(`${product.icon} ${product.name} added to cart!`);
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId);
  updateCartUI();
}

function changeQty(productId, delta) {
  const item = cart.find((i) => i.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(productId);
  } else {
    updateCartUI();
  }
}

function cartSubtotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function cartTotal() {
  return cartSubtotal() + (cart.length > 0 ? SHIPPING_FEE : 0);
}

function clearCart() {
  cart = [];
  updateCartUI();
}

/* ============================================================
   CART — UI UPDATE
   ============================================================ */

function updateCartUI() {
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  document.getElementById("cart-count").textContent = totalItems;

  const itemsList = document.getElementById("cart-items-list");
  const summaryEl = document.getElementById("cart-summary");
  const checkoutBtn = document.getElementById("checkout-trigger");

  // Empty cart state
  if (!cart.length) {
    itemsList.innerHTML = `
      <div class="cart-empty">
        <span class="icon">🛒</span>
        <p>Your cart is empty.</p>
      </div>`;
    summaryEl.innerHTML = "";
    checkoutBtn.disabled = true;
    return;
  }

  checkoutBtn.disabled = false;

  // Render cart items
  itemsList.innerHTML = cart
    .map(
      (item) => `
    <div class="cart-item">
      <div class="cart-item-icon">${item.icon}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
        </div>
      </div>
      <button class="cart-rm" onclick="removeFromCart(${item.id})">🗑</button>
    </div>
  `,
    )
    .join("");

  // Render price summary
  summaryEl.innerHTML = `
    <div class="cart-summary-row"><span>Subtotal</span><span>$${cartSubtotal().toFixed(2)}</span></div>
    <div class="cart-summary-row"><span>Shipping</span><span>$${SHIPPING_FEE.toFixed(2)}</span></div>
    <div class="cart-summary-row total"><span>Total</span><span>$${cartTotal().toFixed(2)}</span></div>`;
}

/* ============================================================
   CART DRAWER — OPEN / CLOSE
   ============================================================ */

function toggleCart() {
  document.getElementById("cart-overlay").classList.toggle("open");
}

function handleOverlayClick(event) {
  // Close cart if user clicks the dark overlay (not the drawer itself)
  if (event.target === document.getElementById("cart-overlay")) {
    toggleCart();
  }
}

/* ============================================================
   CHECKOUT MODAL — OPEN / CLOSE / STEP NAVIGATION
   ============================================================ */

function openCheckout() {
  if (!cart.length) return;
  toggleCart(); // close cart drawer first
  document.getElementById("checkout-modal").classList.add("open");
  goStep(1);
}

function closeCheckout() {
  document.getElementById("checkout-modal").classList.remove("open");
}

function goStep(stepNumber) {
  currentStep = stepNumber;

  // Run step-specific logic
  if (stepNumber === 2) {
    if (!validateShipping()) return; // stop if shipping is incomplete
    buildOrderReview();
  }
  if (stepNumber === 3) {
    buildPayPalSummary();
    initPayPal();
  }

  // Show only the active step panel
  document.querySelectorAll(".checkout-step").forEach((panel, index) => {
    panel.classList.toggle("active", index === stepNumber - 1);
  });

  // Update step indicator dots
  [1, 2, 3].forEach((i) => {
    const dot = document.getElementById(`sdot-${i}`);
    dot.classList.remove("active", "done");
    if (i === stepNumber) dot.classList.add("active");
    else if (i < stepNumber) dot.classList.add("done");
  });

  // Update step label text
  const stepLabels = { 1: "Shipping Details", 2: "Review Order", 3: "Payment" };
  document.getElementById("step-text-label").textContent =
    stepLabels[stepNumber] || "";
}

/* ============================================================
   CHECKOUT — SHIPPING VALIDATION & DATA
   ============================================================ */

function validateShipping() {
  const requiredFields = [
    "sh-fname",
    "sh-lname",
    "sh-phone",
    "sh-address",
    "sh-city",
    "sh-country",
  ];
  for (const fieldId of requiredFields) {
    const field = document.getElementById(fieldId);
    if (!field.value.trim()) {
      showToast("Please fill in all shipping fields.", true);
      field.focus();
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
  const shipping = getShippingDetails();
  document.getElementById("delivery-address-preview").textContent =
    `${shipping.name} · ${shipping.phone} · ${shipping.address}, ${shipping.city}, ${shipping.country}`;
  document.getElementById("order-review").innerHTML = buildOrderSummaryHTML();
}

function buildPayPalSummary() {
  document.getElementById("paypal-order-summary").innerHTML =
    buildOrderSummaryHTML();
}

/** Returns the HTML for the mini order summary shown in steps 2 and 3 */
function buildOrderSummaryHTML() {
  const itemRows = cart
    .map(
      (item) =>
        `<div class="osi-row">
       <span>${item.icon} ${item.name} × ${item.qty}</span>
       <span>$${(item.price * item.qty).toFixed(2)}</span>
     </div>`,
    )
    .join("");

  return (
    itemRows +
    `
    <div class="osi-row"><span>Shipping</span><span>$${SHIPPING_FEE.toFixed(2)}</span></div>
    <div class="osi-row bold"><span>Total</span><span>$${cartTotal().toFixed(2)}</span></div>`
  );
}

/* ============================================================
   PAYPAL INTEGRATION
   ============================================================ */

function initPayPal() {
  const container = document.getElementById("paypal-button-container");

  // Clear previous PayPal button if it was already rendered
  if (paypalRendered) {
    container.innerHTML = "";
    paypalRendered = false;
  }

  // Check if PayPal SDK loaded (requires a valid Client ID in index.html)
  if (typeof paypal === "undefined") {
    container.innerHTML =
      '<p style="color:#ff4444;font-size:13px;">PayPal not loaded. Please replace YOUR_PAYPAL_CLIENT_ID in index.html with your real Live Client ID.</p>';
    return;
  }

  paypalRendered = true;

  paypal
    .Buttons({
      style: { layout: "vertical", color: "blue", shape: "rect", label: "pay" },

      // Step 1: Create the PayPal order
      createOrder: (data, actions) => {
        return actions.order.create({
          purchase_units: [
            {
              amount: {
                value: cartTotal().toFixed(2),
                currency_code: "USD",
              },
              description: `GearX Order — ${cart.map((i) => i.name).join(", ")}`,
            },
          ],
        });
      },

      // Step 2: After customer approves payment
      onApprove: (data, actions) => {
        return actions.order.capture().then((details) => {
          const shipping = getShippingDetails();
          const orderNum = "GX-" + Date.now().toString(36).toUpperCase();

          // Save the order
          const newOrder = {
            id: orderNum,
            customer: shipping.name,
            phone: shipping.phone,
            address: `${shipping.address}, ${shipping.city}, ${shipping.country}`,
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

          orders.unshift(newOrder); // add to top of orders list
          saveData();

          // Show success screen
          document.getElementById("order-ref-display").textContent =
            `Order #${orderNum} · PayPal: ${details.id}`;
          goStep(4);
        });
      },

      // Payment failed or was cancelled
      onError: (err) => {
        showToast("Payment failed. Please try again.", true);
        console.error("PayPal error:", err);
      },
    })
    .render("#paypal-button-container");
}

/* ============================================================
   ADMIN — LOGIN / LOGOUT
   ============================================================ */

function openAdminLogin(event) {
  event.preventDefault();
  document.getElementById("login-modal").classList.add("open");
  document.getElementById("login-err").style.display = "none";
  document.getElementById("adm-user").value = "";
  document.getElementById("adm-pass").value = "";
}

function closeAdminLogin() {
  document.getElementById("login-modal").classList.remove("open");
}

function doLogin() {
  const username = document.getElementById("adm-user").value.trim();
  const password = document.getElementById("adm-pass").value;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    closeAdminLogin();
    document.getElementById("store-page").style.display = "none";
    document.getElementById("admin-page").classList.add("active");
    document.getElementById("adm-date").textContent =
      new Date().toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
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
   ADMIN — SECTION SWITCHER (Dashboard / Products / Orders)
   ============================================================ */

function showAdmSection(sectionName, clickedLink) {
  // Hide all sections
  document
    .querySelectorAll(".adm-section")
    .forEach((s) => s.classList.remove("active"));
  // Remove active from all menu links
  document
    .querySelectorAll(".adm-menu a")
    .forEach((a) => a.classList.remove("active"));

  // Show selected section and mark link as active
  document.getElementById(`adm-${sectionName}`).classList.add("active");
  clickedLink.classList.add("active");
}

/* ============================================================
   ADMIN — DATA REFRESH (stats, tables)
   ============================================================ */

function refreshAdminData() {
  // Update stat cards
  document.getElementById("stat-prods").textContent = products.length;
  document.getElementById("stat-orders").textContent = orders.length;

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  document.getElementById("stat-rev").textContent =
    "$" + totalRevenue.toFixed(2);

  renderAdmTable();
  renderOrdersTable();
  renderRecentOrders();
}

/** Render the products table in the admin panel */
function renderAdmTable() {
  const searchQuery = (
    document.getElementById("prod-search")?.value || ""
  ).toLowerCase();
  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery) ||
      p.cat.toLowerCase().includes(searchQuery),
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
      <td>
        <span class="tbl-edit" onclick="openProdModal(${p.id})">Edit</span>
        <span class="tbl-del"  onclick="deleteProduct(${p.id})">Delete</span>
      </td>
    </tr>
  `,
    )
    .join("");
}

/** Render the orders table in the admin panel */
function renderOrdersTable() {
  document.getElementById("orders-count-label").textContent = orders.length;

  if (!orders.length) {
    document.getElementById("adm-orders-tbody").innerHTML =
      '<tr><td colspan="7" style="text-align:center;color:#888;padding:24px;">No orders yet.</td></tr>';
    return;
  }

  document.getElementById("adm-orders-tbody").innerHTML = orders
    .map(
      (order) => `
    <tr>
      <td><strong>${order.id}</strong></td>
      <td>${order.customer}<br><small style="color:#888">${order.phone}</small></td>
      <td>${order.items.map((i) => `${i.name} ×${i.qty}`).join("<br>")}</td>
      <td>$${order.total.toFixed(2)}</td>
      <td>${order.address.split(",").slice(-2).join(",")}</td>
      <td>${order.date}</td>
      <td><span class="badge-active">${order.status}</span></td>
    </tr>
  `,
    )
    .join("");
}

/** Render recent orders in the dashboard overview */
function renderRecentOrders() {
  const container = document.getElementById("adm-recent-orders");

  if (!orders.length) {
    container.innerHTML =
      '<p style="text-align:center;padding:20px;color:#888;">No orders yet.</p>';
    return;
  }

  container.innerHTML = `
    <table class="adm-table">
      <thead>
        <tr><th>Order #</th><th>Customer</th><th>Total</th><th>Date</th><th>Status</th></tr>
      </thead>
      <tbody>
        ${orders
          .slice(0, 5)
          .map(
            (o) => `
          <tr>
            <td>${o.id}</td>
            <td>${o.customer}</td>
            <td>$${o.total.toFixed(2)}</td>
            <td>${o.date}</td>
            <td><span class="badge-active">${o.status}</span></td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>`;
}

/* ============================================================
   ADMIN — PRODUCT CRUD (Create, Read, Update, Delete)
   ============================================================ */

/** Open modal for adding a new product or editing an existing one */
function openProdModal(productId = null) {
  editingId = productId;
  document.getElementById("prod-modal").classList.add("open");

  if (productId) {
    // EDIT MODE — populate form with existing product data
    const product = products.find((p) => p.id === productId);
    document.getElementById("pm-title").textContent = "Edit Product";
    document.getElementById("pm-id").value = product.id;
    document.getElementById("pm-name").value = product.name;
    document.getElementById("pm-cat").value = product.cat;
    document.getElementById("pm-price").value = product.price;
    document.getElementById("pm-badge").value = product.badge;
    document.getElementById("pm-icon").value = product.icon;
    document.getElementById("pm-desc").value = product.desc;
    document.getElementById("pm-status").value = product.status;
  } else {
    // ADD MODE — clear the form
    document.getElementById("pm-title").textContent = "Add Product";
    ["pm-id", "pm-name", "pm-price", "pm-icon", "pm-desc"].forEach((id) => {
      document.getElementById(id).value = "";
    });
    document.getElementById("pm-cat").value = "Controllers";
    document.getElementById("pm-badge").value = "";
    document.getElementById("pm-status").value = "active";
  }
}

function closeProdModal() {
  document.getElementById("prod-modal").classList.remove("open");
}

/** Save product — handles both add and edit */
function saveProduct() {
  const name = document.getElementById("pm-name").value.trim();
  const price = parseFloat(document.getElementById("pm-price").value);
  const icon = document.getElementById("pm-icon").value.trim();

  // Basic validation
  if (!name || !price || !icon) {
    showToast("Please fill in name, price and icon.", true);
    return;
  }

  const productData = {
    name,
    price,
    cat: document.getElementById("pm-cat").value,
    badge: document.getElementById("pm-badge").value,
    icon,
    desc: document.getElementById("pm-desc").value.trim(),
    status: document.getElementById("pm-status").value,
  };

  if (editingId) {
    // Update existing product
    const index = products.findIndex((p) => p.id === editingId);
    products[index] = { ...products[index], ...productData };
    showToast("Product updated!");
  } else {
    // Add new product
    products.push({ id: nextProductId++, ...productData });
    showToast("Product added!");
  }

  saveData();
  closeProdModal();
  renderProducts(activeCategory); // refresh storefront
  refreshAdminData(); // refresh admin tables
}

/** Delete a product after confirmation */
function deleteProduct(productId) {
  if (!confirm("Are you sure you want to delete this product?")) return;

  products = products.filter((p) => p.id !== productId);
  saveData();
  renderProducts(activeCategory);
  refreshAdminData();
  showToast("Product deleted.");
}

/* ============================================================
   TOAST NOTIFICATION
   ============================================================ */

function showToast(message, isError = false) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = "show" + (isError ? " error" : "");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.className = "";
  }, 3000);
}

/* ============================================================
   INITIALISE ON PAGE LOAD
   ============================================================ */
renderProducts(); // show products on storefront
updateCartUI(); // set cart count to 0
