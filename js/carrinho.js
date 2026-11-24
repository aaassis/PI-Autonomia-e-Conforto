/* Carrinho integrado ao catálogo compartilhado do Autonomia & Conforto.
   Usa a mesma chave e o mesmo formato de dados das páginas inicial, categorias e produto.
   Persistência demonstrativa no navegador (localStorage), sem backend ou pagamento real. */
(() => {
  "use strict";

  const CART_KEY = "autonomia-conforto-cart-v1";
  const LEGACY_CART_KEY = "autonomia_conforto_carrinho_v1";
  const FREE_SHIPPING_GOAL = 250;
  const DEMO_SHIPPING = 18.90;
  const $ = (selector, root = document) => root.querySelector(selector);
  const money = (value) => new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value) || 0);

  let cart = [];
  let cepCalculated = false;
  let couponPercent = 0;
  let couponCode = "";
  let orders = [];

  const products = () => Array.isArray(window.PRODUCTS) ? window.PRODUCTS : [];
  const productById = (id) => products().find((product) => product.id === String(id));

  function safeRead(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn("Não foi possível ler os dados locais do carrinho.", error);
      return null;
    }
  }

  function migrateLegacyCart() {
    const legacy = safeRead(LEGACY_CART_KEY);
    if (!Array.isArray(legacy) || !legacy.length) return [];
    const legacyIds = {
      1: "camiseta-velcro",
      2: "camisa-ima",
      3: "kit-talheres",
      4: "abridor-ergonomico",
      5: "apoio-alcance"
    };
    return legacy.map((item) => {
      const id = legacyIds[item.id] || String(item.id);
      const size = item.size || "";
      return {
        key: `${id}|${size}`,
        id,
        qty: Math.max(1, Math.min(10, Number(item.qty ?? item.quantidade) || 1)),
        size
      };
    }).filter((item) => productById(item.id));
  }

  function normalizeCart(items) {
    if (!Array.isArray(items)) return [];
    return items.map((item) => {
      const id = String(item.id ?? "");
      const size = String(item.size ?? "");
      const qty = Math.max(1, Math.min(10, Math.floor(Number(item.qty ?? item.quantidade) || 1)));
      return {
        key: String(item.key || `${id}|${size}`),
        id,
        qty,
        size
      };
    }).filter((item) => productById(item.id));
  }

  function readCart() {
    const stored = safeRead(CART_KEY);
    if (Array.isArray(stored)) return normalizeCart(stored);
    const migrated = migrateLegacyCart();
    if (migrated.length) {
      cart = migrated;
      saveCart();
      try { localStorage.removeItem(LEGACY_CART_KEY); } catch (_) {}
    }
    return migrated;
  }

  function saveCart() {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (error) {
      showToast("Não foi possível salvar o carrinho neste navegador.");
    }
    updateHeaderCount();
  }

  function updateHeaderCount() {
    const count = cart.reduce((total, item) => total + item.qty, 0);
    const badge = $("#header-cart-badge");
    if (badge) badge.textContent = String(count);
    document.querySelectorAll("[data-cart-count]").forEach((element) => {
      element.textContent = String(count);
    });
  }

  function showToast(message) {
    const container = $("#toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.textContent = message;
    container.appendChild(toast);
    window.setTimeout(() => toast.remove(), 2800);
  }

  function announce(message) {
    const live = $("#live-region");
    if (live) live.textContent = message;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  function addToCart(id, quantity = 1, size = "") {
    const product = productById(id);
    if (!product) {
      showToast("Não foi possível localizar este produto no catálogo.");
      return;
    }
    const safeQty = Math.max(1, Math.min(10, Math.floor(Number(quantity) || 1)));
    const safeSize = String(size || "");
    const key = `${product.id}|${safeSize}`;
    const existing = cart.find((item) => item.key === key);
    if (existing) {
      existing.qty = Math.min(10, existing.qty + safeQty);
    } else {
      cart.push({ key, id: product.id, qty: safeQty, size: safeSize });
    }
    saveCart();
    renderEverything();
    showToast(`${product.name} adicionado ao carrinho.`);
    announce(`${product.name} adicionado ao carrinho.`);
  }

  function changeQuantity(key, delta) {
    const item = cart.find((entry) => entry.key === key);
    if (!item) return;
    const next = item.qty + delta;
    if (next < 1) {
      removeItem(key);
      return;
    }
    item.qty = Math.min(10, next);
    saveCart();
    renderEverything();
  }

  function setQuantity(key, value) {
    const item = cart.find((entry) => entry.key === key);
    if (!item) return;
    const next = Math.floor(Number(value));
    if (!Number.isFinite(next) || next < 1) {
      renderCartItems();
      return;
    }
    item.qty = Math.min(10, next);
    saveCart();
    renderEverything();
  }

  function removeItem(key) {
    const item = cart.find((entry) => entry.key === key);
    const product = item ? productById(item.id) : null;
    cart = cart.filter((entry) => entry.key !== key);
    saveCart();
    renderEverything();
    if (product) showToast(`${product.name} removido do carrinho.`);
  }

  function renderCartItems() {
    const container = $("#cart-items-container");
    const emptyState = $("#empty-cart-state");
    const clearButton = $("#btn-limpar-carrinho");
    if (!container || !emptyState) return;

    if (!cart.length) {
      container.innerHTML = "";
      container.classList.add("hidden");
      emptyState.classList.remove("hidden");
      emptyState.innerHTML = `
        <div class="empty-icon" aria-hidden="true">🛒</div>
        <h2>Seu carrinho está vazio no momento</h2>
        <p>Escolha um dos produtos cadastrados abaixo para começar sua demonstração.</p>
        <div class="empty-actions">
          <a class="btn-primary" href="categorias.html">Ver catálogo completo</a>
          <a class="btn-outline" href="index.html">Voltar ao início</a>
        </div>`;
      if (clearButton) clearButton.classList.add("hidden");
      return;
    }

    container.classList.remove("hidden");
    emptyState.classList.add("hidden");
    if (clearButton) clearButton.classList.remove("hidden");

    container.innerHTML = cart.map((item) => {
      const product = productById(item.id);
      if (!product) return "";
      const id = escapeHtml(product.id);
      const key = escapeHtml(item.key);
      const name = escapeHtml(product.name);
      const category = escapeHtml(product.categoryName);
      const description = escapeHtml(product.description);
      const sizeText = item.size ? `<p class="item-desc">Tamanho: ${escapeHtml(item.size)}</p>` : "";
      return `
        <article class="cart-item-card" data-id="${id}">
          <div class="item-thumb">
            <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.alt)}">
          </div>
          <div class="item-info">
            <span class="item-category">${category}</span>
            <h3 class="item-title">${name}</h3>
            <p class="item-desc">${description}</p>
            ${sizeText}
            <span class="item-unit-price">Valor unitário: <strong>${money(product.price)}</strong></span>
          </div>
          <div class="item-controls">
            <span class="item-subtotal">${money(product.price * item.qty)}</span>
            <div class="qty-stepper" role="group" aria-label="Alterar quantidade de ${name}">
              <button type="button" class="qty-btn" data-action="diminuir" data-key="${key}" aria-label="Diminuir quantidade de ${name}">−</button>
              <input type="number" class="qty-input" min="1" max="10" value="${item.qty}" data-key="${key}" aria-label="Quantidade de ${name}">
              <button type="button" class="qty-btn" data-action="aumentar" data-key="${key}" aria-label="Aumentar quantidade de ${name}">+</button>
            </div>
            <button type="button" class="btn-remove-item" data-action="remover" data-key="${key}" aria-label="Remover ${name} do carrinho">Remover</button>
          </div>
        </article>`;
    }).join("");
  }

  function normalizeSearch(text) {
    return String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
  }

  function renderQuickProducts(searchTerm = "") {
    const grid = $("#quick-add-grid");
    if (!grid) return;
    const term = normalizeSearch(searchTerm.trim());
    const filtered = products().filter((product) =>
      normalizeSearch(`${product.name} ${product.categoryName} ${product.description}`).includes(term)
    );

    if (!filtered.length) {
      grid.innerHTML = '<p class="product-search-empty">Nenhum produto encontrado. Tente outro nome ou categoria.</p>';
      return;
    }

    grid.innerHTML = filtered.map((product) => `
      <article class="quick-card">
        <div class="quick-card-top">
          <div class="quick-card-icon"><img src="${escapeHtml(product.image)}" alt=""></div>
          <h3 class="quick-card-title">${escapeHtml(product.name)}</h3>
        </div>
        <p class="quick-card-description">${escapeHtml(product.description)}</p>
        <div class="quick-card-footer">
          <span class="quick-card-price">${money(product.price)}</span>
          <button type="button" class="btn-add-mini" data-action="adicionar-rapido" data-id="${escapeHtml(product.id)}">
            <span class="add-icon" aria-hidden="true">+</span><span>Adicionar</span>
          </button>
        </div>
      </article>`).join("");
  }

  function subtotalValue() {
    return cart.reduce((sum, item) => {
      const product = productById(item.id);
      return sum + (product ? product.price * item.qty : 0);
    }, 0);
  }

  function updateSummary() {
    const subtotal = subtotalValue();
    const unitCount = cart.reduce((sum, item) => sum + item.qty, 0);
    const hasFreeShipping = subtotal >= FREE_SHIPPING_GOAL;
    const shipping = hasFreeShipping ? 0 : (cepCalculated ? DEMO_SHIPPING : 0);
    const discount = subtotal * couponPercent;
    const total = Math.max(0, subtotal + shipping - discount);

    const textValues = {
      "summary-total-items": String(unitCount),
      "summary-subtotal": money(subtotal),
      "summary-shipping": hasFreeShipping ? "Grátis" : (cepCalculated ? money(shipping) : "A calcular"),
      "summary-discount": `− ${money(discount)}`,
      "summary-grand-total": money(total)
    };
    Object.entries(textValues).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    });

    const discountRow = $("#summary-discount-row");
    if (discountRow) discountRow.classList.toggle("hidden", couponPercent === 0 || subtotal === 0);

    const progressText = $("#shipping-progress-text");
    const progressFill = $("#shipping-progress-fill");
    const progressBar = $("#shipping-progressbar");
    const percent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_GOAL) * 100));
    if (progressFill) progressFill.style.width = `${percent}%`;
    if (progressBar) progressBar.setAttribute("aria-valuenow", String(percent));
    if (progressText) {
      if (subtotal === 0) {
        progressText.textContent = `Adicione produtos para atingir a meta demonstrativa de frete grátis (${money(FREE_SHIPPING_GOAL)}).`;
      } else if (hasFreeShipping) {
        progressText.textContent = "Você atingiu a meta demonstrativa de frete grátis.";
      } else {
        progressText.textContent = `Faltam ${money(FREE_SHIPPING_GOAL - subtotal)} para atingir a meta demonstrativa de frete grátis.`;
      }
    }

    const installments = $("#summary-installments");
    if (installments) {
      installments.textContent = subtotal > 0 ? `Simulação: até 6x de ${money(total / 6)} sem juros.` : "Adicione itens para simular as parcelas.";
    }

    const checkout = $("#btn-finalizar-compra");
    if (checkout) checkout.disabled = cart.length === 0;
  }

  function renderOrders() {
    const list = $("#order-history-list");
    if (!list) return;
    if (!orders.length) {
      list.innerHTML = '<p class="order-history-empty">Nenhum pedido demonstrativo realizado nesta sessão.</p>';
      return;
    }
    list.innerHTML = orders.map((order) => `
      <article class="order-history-card">
        <div class="order-history-card-header">
          <h3>Pedido demonstrativo #${order.number}</h3>
          <time>${escapeHtml(order.date)}</time>
        </div>
        <p>${escapeHtml(order.items)}</p>
        <strong>${escapeHtml(order.total)}</strong>
        <span class="order-history-status">Simulação concluída</span>
      </article>`).join("");
  }

  function renderEverything() {
    renderCartItems();
    updateSummary();
    updateHeaderCount();
  }

  function resetCheckoutFields() {
    const cep = $("#input-cep");
    const coupon = $("#input-cupom");
    const cepFeedback = $("#cep-feedback");
    const couponFeedback = $("#cupom-feedback");
    if (cep) cep.value = "";
    if (coupon) coupon.value = "";
    if (cepFeedback) {
      cepFeedback.textContent = "";
      cepFeedback.className = "tool-feedback";
    }
    if (couponFeedback) {
      couponFeedback.textContent = "";
      couponFeedback.className = "tool-feedback";
    }
    cepCalculated = false;
    couponPercent = 0;
    couponCode = "";
  }

  function closeCheckoutModal() {
    const modal = $("#checkout-modal");
    if (modal) modal.classList.add("hidden");
    cart = [];
    saveCart();
    resetCheckoutFields();
    renderEverything();
  }

  function handleCepInput(input) {
    const digits = input.value.replace(/\D/g, "").slice(0, 8);
    input.value = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
  }

  function calculateDemoShipping() {
    const input = $("#input-cep");
    const feedback = $("#cep-feedback");
    const digits = input ? input.value.replace(/\D/g, "") : "";
    if (!feedback) return;
    if (digits.length !== 8) {
      feedback.textContent = "Informe um CEP com 8 dígitos para a simulação.";
      feedback.className = "tool-feedback error";
      return;
    }
    cepCalculated = true;
    if (subtotalValue() >= FREE_SHIPPING_GOAL) {
      feedback.textContent = "CEP validado para a demonstração. Frete ilustrativo grátis pela meta do projeto.";
    } else {
      feedback.textContent = `Frete ilustrativo: ${money(DEMO_SHIPPING)}. Não há consulta a transportadoras.`;
    }
    feedback.className = "tool-feedback success";
    updateSummary();
  }

  function applyDemoCoupon() {
    const input = $("#input-cupom");
    const feedback = $("#cupom-feedback");
    if (!feedback) return;
    const code = input ? input.value.trim().toUpperCase() : "";
    if (!subtotalValue()) {
      feedback.textContent = "Adicione um produto antes de aplicar o cupom.";
      feedback.className = "tool-feedback error";
      return;
    }
    if (code === "CONFORTO10" || code === "AUTONOMIA10") {
      couponPercent = 0.10;
      couponCode = code;
      feedback.textContent = `Cupom demonstrativo ${code} aplicado: 10% de desconto.`;
      feedback.className = "tool-feedback success";
    } else {
      couponPercent = 0;
      couponCode = "";
      feedback.textContent = "Cupom não reconhecido. Experimente CONFORTO10.";
      feedback.className = "tool-feedback error";
    }
    updateSummary();
  }

  function openCheckoutModal() {
    if (!cart.length) return;
    const modal = $("#checkout-modal");
    const summaryBox = $("#modal-order-summary");
    const description = $("#modal-description");
    const total = $("#summary-grand-total")?.textContent || money(subtotalValue());
    const units = cart.reduce((sum, item) => sum + item.qty, 0);
    const itemDescription = cart.map((item) => {
      const product = productById(item.id);
      return product ? `${item.qty} × ${product.name}` : "";
    }).filter(Boolean).join("; ");

    orders.unshift({
      number: orders.length + 1,
      date: new Date().toLocaleString("pt-BR"),
      items: itemDescription,
      total
    });
    renderOrders();

    if (description) {
      description.textContent = "Esta é uma finalização demonstrativa. Nenhum pedido ou pagamento real será enviado.";
    }
    if (summaryBox) {
      summaryBox.innerHTML = `
        <p><strong>Quantidade de itens:</strong> ${units}</p>
        <p><strong>Produtos:</strong> ${escapeHtml(itemDescription)}</p>
        <p><strong>Total demonstrativo:</strong> ${escapeHtml(total)}</p>
        ${couponCode ? `<p><strong>Cupom:</strong> ${escapeHtml(couponCode)}</p>` : ""}
      `;
    }
    if (modal) {
      modal.classList.remove("hidden");
      $("#btn-fechar-modal")?.focus();
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    cart = readCart();
    saveCart();
    renderQuickProducts();
    renderEverything();
    renderOrders();

    $("#product-search")?.addEventListener("input", (event) => {
      renderQuickProducts(event.target.value);
    });

    $("#quick-add-grid")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action='adicionar-rapido']");
      if (button) addToCart(button.dataset.id, 1);
    });

    $("#cart-items-container")?.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;
      const key = button.dataset.key;
      if (button.dataset.action === "aumentar") changeQuantity(key, 1);
      if (button.dataset.action === "diminuir") changeQuantity(key, -1);
      if (button.dataset.action === "remover") removeItem(key);
    });

    $("#cart-items-container")?.addEventListener("change", (event) => {
      const input = event.target.closest(".qty-input");
      if (input) setQuantity(input.dataset.key, input.value);
    });

    $("#btn-limpar-carrinho")?.addEventListener("click", () => {
      if (!cart.length) return;
      if (window.confirm("Deseja remover todos os produtos do carrinho?")) {
        cart = [];
        saveCart();
        renderEverything();
        showToast("Carrinho esvaziado.");
      }
    });

    $("#input-cep")?.addEventListener("input", (event) => handleCepInput(event.target));
    $("#btn-calcular-cep")?.addEventListener("click", calculateDemoShipping);
    $("#btn-aplicar-cupom")?.addEventListener("click", applyDemoCoupon);
    $("#btn-finalizar-compra")?.addEventListener("click", openCheckoutModal);
    $("#btn-fechar-modal")?.addEventListener("click", closeCheckoutModal);

    $("#checkout-modal")?.addEventListener("click", (event) => {
      if (event.target.id === "checkout-modal") closeCheckoutModal();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !$("#checkout-modal")?.classList.contains("hidden")) {
        closeCheckoutModal();
      }
    });
  });

  // API pública para permitir integração futura com outros componentes do projeto.
  window.AutonomiaCarrinho = {
    adicionar: addToCart,
    obterItens: () => readCart().map((item) => ({ ...item }))
  };
})();
