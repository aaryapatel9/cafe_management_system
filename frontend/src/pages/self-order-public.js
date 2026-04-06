import store from "../store.js";
import router from "../router.js";
import { showToast } from "../components/toast.js";
import { icon } from "../utils/icons.js";
import { generateUPIQR } from "../utils/qr.js";

function isPhoneDevice() {
  const userAgent = navigator.userAgent || "";
  const mobileAgent = /Android|iPhone|iPod|Mobile|Windows Phone|BlackBerry|Opera Mini/i.test(userAgent);
  const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches;
  const narrowViewport = window.innerWidth <= 820;
  return Boolean(mobileAgent || (coarsePointer && narrowViewport));
}

function kitchenMeta(status) {
  if (status === "completed") return { label: "Ready", tone: "success", detail: "The kitchen has completed your order." };
  if (status === "preparing") return { label: "Preparing", tone: "warning", detail: "The chef is preparing your items now." };
  return { label: "Queued", tone: "info", detail: "Your order is waiting in the kitchen queue." };
}

function paymentMeta(status) {
  if (status === "paid") return { label: "Paid", tone: "success", detail: "Payment has been confirmed by staff." };
  return { label: "Pending", tone: "warning", detail: "Payment is still waiting for staff confirmation." };
}

function connectionMeta(state) {
  if (state === "live") return { label: "Live", tone: "success" };
  if (state === "connecting") return { label: "Connecting", tone: "info" };
  return { label: "Offline", tone: "warning" };
}

function formatCurrency(currency, value) {
  return `${currency}${Number(value || 0).toFixed(2)}`;
}

export async function renderSelfOrderPublic(token, query = {}) {
  const app = document.getElementById("app");
  const currency = store.get("settings")?.currency || "₹";
  const upiId = String(query?.upi || "").trim();
  const savedOrderKey = `self_order_active_${token}`;
  let socket = null;
  let reconnectTimer = null;
  let shouldReconnect = true;

  const cleanupSocket = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (socket) {
      const current = socket;
      socket = null;
      current.onopen = null;
      current.onmessage = null;
      current.onerror = null;
      current.onclose = null;
      current.close();
    }
  };

  window.addEventListener("hashchange", () => {
    shouldReconnect = false;
    cleanupSocket();
  }, { once: true });

  if (!isPhoneDevice()) {
    app.innerHTML = `
      <div class="payment-layout" style="padding:var(--space-lg)">
        <div class="card" style="width:min(520px, calc(100vw - 32px));text-align:center">
          <div class="empty-state" style="padding:var(--space-2xl)">
            <div class="empty-state-icon">${icon("mobile", "", "Open on phone")}</div>
            <div class="empty-state-text">This ordering page is designed for mobile phones only.</div>
            <p style="color:var(--color-text-muted);font-size:var(--fs-sm);margin:0">
              Scan the QR code using a phone to browse the menu and place the order.
            </p>
          </div>
        </div>
      </div>
    `;
    return;
  }

  app.innerHTML = `
    <div class="payment-layout">
      <div class="card" style="width:min(960px, calc(100vw - 32px));text-align:center">
        <div class="empty-state" style="padding:var(--space-2xl)">
          <div class="empty-state-icon">${icon("qr", "", "Loading self order")}</div>
          <div class="empty-state-text">Loading self-order menu...</div>
        </div>
      </div>
    </div>
  `;

  try {
    const tokenData = await store.fetchSelfOrderToken(token);
    let cartItems = [];
    let submittedOrder = null;
    let socketState = "connecting";
    let showThankYou = false;

    const readSavedOrder = () => {
      try {
        const raw = localStorage.getItem(savedOrderKey);
        if (!raw) return null;
        const saved = JSON.parse(raw);
        return saved?.id ? saved : null;
      } catch {
        return null;
      }
    };

    const saveActiveOrder = (order) => {
      const orderId = order?.id || order?.order_id;
      if (!orderId) return;
      localStorage.setItem(savedOrderKey, JSON.stringify({
        id: orderId,
        orderNumber: order.order_number || order.orderNumber || "",
      }));
    };

    const clearActiveOrder = () => {
      localStorage.removeItem(savedOrderKey);
    };

    const connectToOrder = (orderId) => {
      cleanupSocket();
      socketState = "connecting";
      render();

      const wsBase = store.getWebSocketBase();
      socket = new WebSocket(`${wsBase}/ws/self-order/${encodeURIComponent(orderId)}?token=${encodeURIComponent(token)}`);

      socket.onopen = () => {
        socketState = "live";
        render();
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.order?.id) {
            submittedOrder = payload.order;
            saveActiveOrder(submittedOrder);
            render();
          }
        } catch {
          // Ignore malformed live payloads.
        }
      };

      socket.onerror = () => {
        socketState = "offline";
        render();
      };

      socket.onclose = () => {
        socket = null;
        socketState = "offline";
        render();
        if (!shouldReconnect || !submittedOrder?.id) return;
        reconnectTimer = setTimeout(async () => {
          try {
            submittedOrder = await store.fetchSelfOrderOrder(submittedOrder.id, token);
            saveActiveOrder(submittedOrder);
          } catch {
            // Keep the last known state if refresh fails.
          }
          if (shouldReconnect && submittedOrder?.id) connectToOrder(submittedOrder.id);
        }, 2500);
      };
    };

    const renderTracker = () => {
      const kitchen = kitchenMeta(submittedOrder?.kitchen_status);
      const payment = paymentMeta(submittedOrder?.payment_status);
      const connection = connectionMeta(socketState);
      const grandTotal = Number(submittedOrder?.grand_total ?? submittedOrder?.total ?? 0);
      const items = submittedOrder?.items || [];
      const paymentAvailable = Boolean(upiId) && payment.label !== "Paid";

      app.innerHTML = `
        <div class="payment-layout mobile-order-shell" style="justify-content:flex-start;padding:12px">
          <div class="card mobile-order-card mobile-tracker-card" style="width:min(100%, 480px);margin:0 auto">
            <div class="mobile-tracker-hero">
              <div class="mobile-tracker-orb"></div>
              <div class="mobile-tracker-head">
                <span class="mobile-live-pill mobile-live-pill-${connection.tone}">
                  ${icon("session", "", "Live updates")}
                  <span>${connection.label} updates</span>
                </span>
                <span class="mobile-live-pill mobile-live-pill-neutral">Order ${submittedOrder.order_number}</span>
              </div>
              <div class="mobile-tracker-title-wrap">
                <h1 class="mobile-tracker-title">Your order is being tracked live</h1>
                <p class="mobile-tracker-subtitle">Table ${tokenData.table?.table_number || ""} • ${tokenData.branch_name || "Restaurant Branch"}</p>
              </div>
              <div class="mobile-tracker-total">${formatCurrency(currency, grandTotal)}</div>
            </div>

            <div class="mobile-status-grid">
              <div class="mobile-status-card mobile-status-card-${kitchen.tone}">
                <div class="mobile-status-label">${icon("kitchen", "", "Kitchen status")}Kitchen</div>
                <div class="mobile-status-value">${kitchen.label}</div>
                <div class="mobile-status-detail">${kitchen.detail}</div>
              </div>
              <div class="mobile-status-card mobile-status-card-${payment.tone}">
                <div class="mobile-status-label">${icon("wallet", "", "Payment status")}Payment</div>
                <div class="mobile-status-value">${payment.label}</div>
                <div class="mobile-status-detail">${payment.detail}</div>
              </div>
            </div>

            <div class="mobile-path-section">
              <div class="mobile-summary-header" style="margin-bottom:10px">
                <h3>Order status</h3>
                <span class="badge badge-info">${kitchen.label}</span>
              </div>
              <div class="mobile-progress-strip">
              <div class="mobile-progress-step ${submittedOrder?.kitchen_status ? "active" : ""}">
                <span class="mobile-progress-dot"></span>
                <span>Placed</span>
              </div>
              <div class="mobile-progress-step ${submittedOrder?.kitchen_status === "preparing" || submittedOrder?.kitchen_status === "completed" ? "active" : ""}">
                <span class="mobile-progress-dot"></span>
                <span>Preparing</span>
              </div>
              <div class="mobile-progress-step ${submittedOrder?.kitchen_status === "completed" ? "active" : ""}">
                <span class="mobile-progress-dot"></span>
                <span>Ready</span>
              </div>
              </div>
            </div>
            </div>

            <div class="mobile-summary-card">
              <div class="mobile-summary-header">
                <h3>Your items</h3>
                <span class="badge badge-info">${items.length} line${items.length === 1 ? "" : "s"}</span>
              </div>
              <div class="mobile-summary-list">
                ${items.map((item) => `
                  <div class="mobile-summary-item">
                    <div>
                      <div class="mobile-summary-name">${item.name}</div>
                      ${item.variant_label ? `<div class="mobile-summary-meta">${item.variant_label}</div>` : ""}
                    </div>
                    <div class="mobile-summary-right">
                      <span class="mobile-summary-qty">x${item.quantity}</span>
                      <span class="mobile-summary-price">${formatCurrency(currency, item.total_price)}</span>
                    </div>
                  </div>
                `).join("")}
              </div>
              <div class="mobile-summary-totals">
                <div class="cart-summary-row"><span class="label">Subtotal</span><span>${formatCurrency(currency, submittedOrder.subtotal)}</span></div>
                <div class="cart-summary-row"><span class="label">Tax</span><span>${formatCurrency(currency, submittedOrder.tax_total)}</span></div>
                <div class="cart-summary-row total"><span>Total</span><span>${formatCurrency(currency, grandTotal)}</span></div>
              </div>
            </div>

            ${paymentAvailable ? `
              <div class="mobile-payment-card">
                <div class="mobile-summary-header">
                  <h3>Pay now</h3>
                  <span class="badge badge-warning">Awaiting confirmation</span>
                </div>
                <p class="mobile-payment-copy">Scan the UPI QR below. The page will update automatically once staff confirms the payment.</p>
                <div class="qr-payment-screen" style="margin-top:var(--space-md)">
                  <div class="qr-canvas-wrapper">
                    <canvas id="self-order-upi-qr"></canvas>
                  </div>
                  <div class="qr-amount">UPI ID: ${upiId}</div>
                  <button class="btn btn-primary btn-block" id="self-order-paid-btn" type="button" style="margin-top:var(--space-md)">I Have Paid</button>
                </div>
              </div>
            ` : ""}

            <div class="mobile-footer-actions">
              <button class="btn btn-secondary btn-block" id="self-order-again-btn" type="button">Order Again</button>
              <button class="btn btn-ghost btn-block" id="self-order-done-btn" type="button">${submittedOrder?.payment_status === "paid" && submittedOrder?.kitchen_status === "completed" ? "Done" : "Close"}</button>
            </div>
          </div>
        </div>
      `;

      const qrCanvas = document.getElementById("self-order-upi-qr");
      if (paymentAvailable && qrCanvas) {
        generateUPIQR(qrCanvas, {
          upiId,
          amount: grandTotal,
          payeeName: tokenData.branch_name || "POS Cafe",
        }).catch(() => showToast("Failed to generate payment QR", "error"));
      }

      document.getElementById("self-order-paid-btn")?.addEventListener("click", () => {
        showToast("Payment marked as sent. Waiting for staff confirmation.", "success");
      });

      document.getElementById("self-order-again-btn")?.addEventListener("click", () => {
        shouldReconnect = false;
        cleanupSocket();
        clearActiveOrder();
        submittedOrder = null;
        cartItems = [];
        socketState = "connecting";
        render();
      });

      document.getElementById("self-order-done-btn")?.addEventListener("click", () => {
        shouldReconnect = false;
        cleanupSocket();
        clearActiveOrder();
        showThankYou = true;
        submittedOrder = null;
        render();
      });
    };

    const renderThankYou = () => {
      app.innerHTML = `
        <div class="payment-layout mobile-order-shell" style="justify-content:center;padding:12px">
          <div class="card mobile-order-card mobile-tracker-card" style="width:min(100%, 480px);margin:0 auto;text-align:center">
            <div class="mobile-tracker-hero" style="padding-bottom:28px">
              <div class="mobile-tracker-orb"></div>
              <div class="mobile-tracker-title-wrap" style="margin-top:12px">
                <span class="mobile-live-pill mobile-live-pill-success" style="margin:0 auto 14px auto">
                  ${icon("check", "", "Thank you")}
                  <span>Order completed</span>
                </span>
                <h1 class="mobile-tracker-title">Thank you for your order</h1>
                <p class="mobile-tracker-subtitle">
                  We hope you enjoyed your experience at ${tokenData.branch_name || "our restaurant"}.
                </p>
              </div>
            </div>
          </div>
        </div>
      `;
    };

    const renderMenu = () => {
      const products = tokenData.products || [];
      const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
      const tax = cartItems.reduce((sum, item) => sum + ((item.price * item.qty * (item.tax || 0)) / 100), 0);
      const total = subtotal + tax;

      app.innerHTML = `
        <div class="payment-layout mobile-order-shell" style="justify-content:flex-start;padding:12px">
          <div class="card mobile-order-card" style="width:min(100%, 480px);margin:0 auto">
            <div class="mobile-menu-hero">
              <div class="mobile-menu-eyebrow">Phone ordering</div>
              <h1 class="mobile-menu-title">Order from your table</h1>
              <p class="mobile-menu-subtitle">Browse the live menu for Table ${tokenData.table?.table_number || ""}. Your order will go straight to the kitchen.</p>
              <div class="mobile-menu-meta">
                <span class="mobile-live-pill mobile-live-pill-neutral">${icon("branch", "", "Branch")} ${tokenData.branch_name || "Restaurant Branch"}</span>
                <span class="mobile-live-pill mobile-live-pill-success">${icon("mobile", "", "Mobile ordering")} Mobile menu</span>
              </div>
            </div>

            <div class="mobile-product-grid">
              ${products.map((product) => `
                <button class="order-product-card mobile-product-card" data-product-id="${product.id}" type="button">
                  <div class="order-product-emoji">${icon("products", "", product.name)}</div>
                  <div class="order-product-name">${product.name}</div>
                  <div class="mobile-product-meta">${product.description || "Freshly prepared"}</div>
                  <div class="order-product-price">${formatCurrency(currency, product.price)}</div>
                </button>
              `).join("")}
            </div>

            <div class="mobile-cart-panel">
              <div class="mobile-summary-header">
                <h3>Your order</h3>
                <span class="badge ${cartItems.length ? "badge-success" : "badge-info"}">${cartItems.length} item${cartItems.length === 1 ? "" : "s"}</span>
              </div>

              <div id="public-self-order-cart">
                ${cartItems.length === 0 ? `
                  <div class="empty-state mobile-inline-empty">
                    <div class="empty-state-icon">${icon("table", "", "Add items")}</div>
                    <div class="empty-state-text">Tap any menu item to add it to your order.</div>
                  </div>
                ` : `
                  <div class="mobile-summary-list">
                    ${cartItems.map((item, index) => `
                      <div class="mobile-summary-item">
                        <div>
                          <div class="mobile-summary-name">${item.name}</div>
                          <div class="mobile-summary-meta">${formatCurrency(currency, item.price)} each</div>
                        </div>
                        <div class="mobile-summary-right">
                          <div class="mobile-qty-controls">
                            <button class="cart-qty-btn public-dec" data-index="${index}" type="button">${icon("minus", "", "Decrease quantity")}</button>
                            <span class="cart-qty-value">${item.qty}</span>
                            <button class="cart-qty-btn public-inc" data-index="${index}" type="button">+</button>
                          </div>
                          <button class="cart-item-remove public-remove" data-index="${index}" type="button">${icon("trash", "", "Remove item")}</button>
                        </div>
                      </div>
                    `).join("")}
                  </div>
                `}
              </div>

              <div class="mobile-summary-totals">
                <div class="cart-summary-row"><span class="label">Subtotal</span><span>${formatCurrency(currency, subtotal)}</span></div>
                <div class="cart-summary-row"><span class="label">Tax</span><span>${formatCurrency(currency, tax)}</span></div>
                <div class="cart-summary-row total"><span>Total</span><span>${formatCurrency(currency, total)}</span></div>
              </div>

              <button class="btn btn-primary btn-block" id="public-submit-order" type="button" ${cartItems.length === 0 ? "disabled" : ""}>
                Place Order
              </button>
            </div>
          </div>
        </div>
      `;

      app.querySelectorAll("[data-product-id]").forEach((button) => {
        button.addEventListener("click", () => {
          const product = products.find((entry) => String(entry.id) === String(button.dataset.productId));
          if (!product) return;
          const existing = cartItems.find((item) => String(item.productId) === String(product.id));
          if (existing) {
            existing.qty += 1;
          } else {
            cartItems.push({
              productId: product.id,
              name: product.name,
              price: Number(product.price),
              qty: 1,
              tax: Number(product.tax || 0),
            });
          }
          render();
        });
      });

      app.querySelectorAll(".public-inc").forEach((button) => {
        button.addEventListener("click", () => {
          const item = cartItems[Number(button.dataset.index)];
          if (!item) return;
          item.qty += 1;
          render();
        });
      });

      app.querySelectorAll(".public-dec").forEach((button) => {
        button.addEventListener("click", () => {
          const index = Number(button.dataset.index);
          const item = cartItems[index];
          if (!item) return;
          item.qty -= 1;
          if (item.qty <= 0) cartItems.splice(index, 1);
          render();
        });
      });

      app.querySelectorAll(".public-remove").forEach((button) => {
        button.addEventListener("click", () => {
          cartItems.splice(Number(button.dataset.index), 1);
          render();
        });
      });

      document.getElementById("public-submit-order")?.addEventListener("click", async () => {
        try {
          const response = await store.submitSelfOrder(token, cartItems);
          showToast(`Order ${response.order_number} sent to kitchen`, "success");
          submittedOrder = response;
          saveActiveOrder(response);
          cartItems = [];
          connectToOrder(response.id || response.order_id);
          render();
        } catch (error) {
          showToast(error.message, "error");
        }
      });
    };

    const render = () => {
      if (showThankYou) renderThankYou();
      else if (submittedOrder) renderTracker();
      else renderMenu();
    };

    const savedOrder = readSavedOrder();
    if (savedOrder?.id) {
      try {
        submittedOrder = await store.fetchSelfOrderOrder(savedOrder.id, token);
        saveActiveOrder(submittedOrder);
        connectToOrder(submittedOrder.id || submittedOrder.order_id);
      } catch {
        clearActiveOrder();
        submittedOrder = null;
      }
    }

    render();
  } catch (error) {
    cleanupSocket();
    app.innerHTML = `
      <div class="payment-layout">
        <div class="card" style="width:min(640px, calc(100vw - 32px));text-align:center">
          <div class="empty-state" style="padding:var(--space-2xl)">
            <div class="empty-state-icon">${icon("alert", "", "Token unavailable")}</div>
            <div class="empty-state-text">${error.message || "This self-order link is no longer available."}</div>
            <button class="btn btn-ghost" id="back-login" type="button">Back</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById("back-login")?.addEventListener("click", () => router.navigate("/login"));
  }
}
