/* cart.js - Carrello locale + pagina carrello + invio ordine su WhatsApp */

const WA_PHONE = "393791395387"; // +39 379 139 5387
const STORAGE_KEY = "marielu_cart_v1";

function loadCart() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  updateBadges();
  renderCartPage(); // se siamo su carrello.html aggiorna vista
}

function addToCart(name, price = "") {
  const cart = loadCart();
  const found = cart.find(i => i.name === name && i.price === price);
  if (found) found.qty += 1;
  else cart.push({ name, price, qty: 1 });
  saveCart(cart);
  toast(`Aggiunto: ${name}`);
}

function decFromCart(name, price = "") {
  const cart = loadCart();
  const idx = cart.findIndex(i => i.name === name && i.price === price);
  if (idx < 0) return;
  cart[idx].qty -= 1;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  saveCart(cart);
}

function removeItem(name, price = "") {
  const cart = loadCart().filter(i => !(i.name === name && i.price === price));
  saveCart(cart);
}

function clearCart() {
  localStorage.removeItem(STORAGE_KEY);
  updateBadges();
  renderCartPage();
  toast("Carrello svuotato");
}

function cartCount() {
  return loadCart().reduce((sum, i) => sum + (i.qty || 0), 0);
}

function buildWhatsAppText() {
  const cart = loadCart();
  if (!cart.length) return "Ciao! Vorrei informazioni sui vostri prodotti. 😊";

  const lines = [];
  lines.push("Ciao! Vorrei ordinare:");
  cart.forEach(i => {
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
  const cart = loadCart();
  if (!cart.length) {
    toast("Il carrello è vuoto");
    return;
  }
  const text = encodeURIComponent(buildWhatsAppText());
  window.open(`https://wa.me/${WA_PHONE}?text=${text}`, "_blank");
}

/* ===== UI ===== */

function updateBadges() {
  document.querySelectorAll("[data-cart-badge]").forEach(b => {
    b.textContent = cartCount();
  });
}

function renderCartPage() {
  const list = document.querySelector("[data-cart-page-list]");
  const summary = document.querySelector("[data-cart-summary]");
  if (!list) return; // non siamo su carrello.html

  const cart = loadCart();
  if (!cart.length) {
    list.innerHTML = `<p style="margin:0;color:#666">Il carrello è vuoto.</p>`;
    if (summary) summary.textContent = "0 articoli";
    return;
  }

  list.innerHTML = cart.map(i => `
    <div class="cart-row">
      <div class="cart-row__name">
        ${escapeHtml(i.name)}
        ${i.price ? `<span class="cart-row__price">${escapeHtml(i.price)}</span>` : ""}
      </div>
      <div class="cart-row__qty">
        <button class="cart-mini-btn" data-dec data-name="${escapeAttr(i.name)}" data-price="${escapeAttr(i.price)}">−</button>
        <span>${i.qty}</span>
        <button class="cart-mini-btn" data-inc data-name="${escapeAttr(i.name)}" data-price="${escapeAttr(i.price)}">+</button>
        <button class="cart-mini-btn" title="Rimuovi" data-del data-name="${escapeAttr(i.name)}" data-price="${escapeAttr(i.price)}">×</button>
      </div>
    </div>
  `).join("");

  if (summary) summary.textContent = `${cartCount()} articoli`;

  list.querySelectorAll("[data-inc]").forEach(btn => {
    btn.addEventListener("click", () => addToCart(btn.dataset.name, btn.dataset.price));
  });
  list.querySelectorAll("[data-dec]").forEach(btn => {
    btn.addEventListener("click", () => decFromCart(btn.dataset.name, btn.dataset.price));
  });
  list.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", () => removeItem(btn.dataset.name, btn.dataset.price));
  });
}

function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add("show"), 10);
  setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 250); }, 1500);
}

function escapeHtml(s="") {
  return String(s).replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]));
}
function escapeAttr(s="") { return escapeHtml(s).replace(/"/g, "&quot;"); }

/* Auto-bind per bottoni Aggiungi (su tutte le pagine) */
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-add]");
  if (!btn) return;
  e.preventDefault();
  addToCart(btn.getAttribute("data-name") || "Prodotto", btn.getAttribute("data-price") || "");
});

document.addEventListener("DOMContentLoaded", () => {
  updateBadges();
  renderCartPage();
});
document.addEventListener("click", (e) => {
  const link = e.target.closest("nav li.has-dropdown .dropdown a");
  if (!link) return;

  const li = link.closest("li.has-dropdown");
  if (!li) return;

  li.classList.remove("open");
});

