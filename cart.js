/* cart.js - Carrello locale + invio ordine su WhatsApp (no pagamenti) */

const WA_PHONE = "393791395387"; // +39 379 139 5387 (senza + e senza spazi)
const STORAGE_KEY = "marielu_cart_v1";

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  updateCartUI();
}

function addToCart(name, price = "") {
  const cart = loadCart();
  const found = cart.find((i) => i.name === name && i.price === price);
  if (found) found.qty += 1;
  else cart.push({ name, price, qty: 1 });
  saveCart(cart);
  toast(`Aggiunto: ${name}`);
}

function removeFromCart(name, price = "") {
  const cart = loadCart();
  const idx = cart.findIndex((i) => i.name === name && i.price === price);
  if (idx >= 0) {
    cart[idx].qty -= 1;
    if (cart[idx].qty <= 0) cart.splice(idx, 1);
    saveCart(cart);
  }
}

function clearCart() {
  localStorage.removeItem(STORAGE_KEY);
  updateCartUI();
  toast("Carrello svuotato");
}

function cartCount() {
  return loadCart().reduce((sum, i) => sum + (i.qty || 0), 0);
}

function buildWhatsAppText() {
  const cart = loadCart();

  if (!cart.length) {
    return "Ciao! Vorrei informazioni sui vostri prodotti. 😊";
  }

  const lines = [];
  lines.push("Ciao! Vorrei ordinare:");
  cart.forEach((i) => {
    const p = i.price ? ` (${i.price})` : "";
    lines.push(`- ${i.name}${p} x${i.qty}`);
  });
  lines.push("");
  lines.push("Ritiro/Consegna: ______");
  lines.push("Nome: ______");
  lines.push("Grazie!");
  return lines.join("\n");
}

function sendToWhatsApp() {
  const text = encodeURIComponent(buildWhatsAppText());
  const url = `https://wa.me/${WA_PHONE}?text=${text}`;
  window.open(url, "_blank");
}

function updateCartUI() {
  const badge = document.querySelector("[data-cart-badge]");
  if (badge) badge.textContent = cartCount();

  const list = document.querySelector("[data-cart-list]");
  if (!list) return;

  const cart = loadCart();
  if (!cart.length) {
    list.innerHTML = `<p style="margin:0;color:#666">Carrello vuoto.</p>`;
    return;
  }

  list.innerHTML = cart
    .map(
      (i) => `
      <div class="cart-row">
        <div class="cart-row__name">
          ${escapeHtml(i.name)}
          ${i.price ? `<span class="cart-row__price">${escapeHtml(i.price)}</span>` : ""}
        </div>
        <div class="cart-row__qty">
          <button class="cart-mini-btn" data-cart-dec data-name="${escapeAttr(i.name)}" data-price="${escapeAttr(i.price)}">−</button>
          <span>${i.qty}</span>
          <button class="cart-mini-btn" data-cart-inc data-name="${escapeAttr(i.name)}" data-price="${escapeAttr(i.price)}">+</button>
        </div>
      </div>
    `
    )
    .join("");

  list.querySelectorAll("[data-cart-inc]").forEach((btn) => {
    btn.addEventListener("click", () =>
      addToCart(btn.dataset.name, btn.dataset.price)
    );
  });

  list.querySelectorAll("[data-cart-dec]").forEach((btn) => {
    btn.addEventListener("click", () =>
      removeFromCart(btn.dataset.name, btn.dataset.price)
    );
  });
}

function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add("show"), 10);
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 300);
  }, 1700);
}

function escapeHtml(s = "") {
  return String(s).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[m]));
}

function escapeAttr(s = "") {
  return escapeHtml(s).replace(/"/g, "&quot;");
}

/* Auto-bind: qualunque elemento con data-add aggiunge al carrello */
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-add]");
  if (!btn) return;
  e.preventDefault();
  const name = btn.getAttribute("data-name") || "Prodotto";
  const price = btn.getAttribute("data-price") || "";
  addToCart(name, price);
});

document.addEventListener("DOMContentLoaded", updateCartUI);
