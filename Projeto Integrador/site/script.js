/* script.js
   SPA behavior: tela única com navegação, estado do cliente e carrinho
   - Responsável por trocar telas (show/hide)
   - Gerenciar 'localState' com { clientName, phone, table, cart }
   - Renderizar itens e pedidos
*/

// ----------------- Estado local -----------------
const state = {
  clientName: '',
  phone: '',
  table: '',
  cart: {}, // itemId -> { item, qty }
  items: [   // catálogo inicial (pode ser substituído por fetch mais tarde)
    { id: 'l1', category: 'lanches', title: 'Nome do Lanche', desc: 'Descrição curta do lanche para o cliente.', price: 25.5, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCuMxoupdf0v60V25C2UbJxl5UMkZhkmBq_OU7kAAaYajZh9hYc9Q-lTvBDrjH9P5wSGQacDHFMdhEtczArCe3UHFdmfYAtYKJhZv1ilQrKFd2GDJedS-a6BfkCwYNLW_7RGBbaLJIoCDdhKbcX5JOKQaI_KU9AHBBWeMXBDhzplkDoVjLuig5kCDfEO3JHDCUzG_K89AsBlfK3ffHyN8xZxwS2gAxOb13TrUog7VDXZR1PBoqlP6BjJ1DhdoC_hU0ZVxk0ZbCKkjT9' },
    { id: 'l2', category: 'lanches', title: 'Outro Lanche Especial', desc: 'Descrição deste outro lanche muito saboroso.', price: 32.0, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBm-JIcd42YQfXtUhvcC3tbCWRpcJAmD33NnleR6wo_HryS_ZPrqnwHOP135_5ZefkXO01BTjH1q-D6yTbsyDKbTWJipitadPTvWMvzRrO2tFZk_x6QlS1WnOrlvxQRwbzGkd14PnLKVEh9fljMYB8qoCZZ_AYy6fVw1Tk5cjX1ISNaFsEF030OlPoayKAuWnvOHC_DEnjUzG4qd9l8TyGs_Y3AnEbjGzgg8Sc6kQMf5Fjc1zoKpJTGAzUyQKqflj5VHezmpS7UOmqc' },
    { id: 'l3', category: 'lanches', title: 'Lanche da Casa', desc: 'O lanche mais pedido, com ingredientes selecionados.', price: 28.9, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDynkaMaVf-0i8o0QUQODe3bBQauCAuOX-hW7If3Pirk9_TsZZ6n4HxtHdNAMyMa1CakfXPr-Q1pl-d0j6X0yqhVX33ovjrz90IeOPqWdkbhzpGHut896FW-SxvNMqjgMqokUMV8PBeuZNTAVqMOIht2dhEM1tD5O5TYP3S_Oi4vaAwFphrudoypdnvhvi2ag_Mz-OVHB0rHvzUU9ISKVyKRmfguBT-ntmkLqMoqxw1IVAIqq94Mo9Qy-B8ulLzqHrqiYsSoXyc-TdJ' },
    // example outros
    { id: 'b1', category: 'bebidas', title: 'Refrigerante 350ml', desc: 'Geladinho.', price: 7.5, img: '' },
    { id: 'p1', category: 'pratos', title: 'Prato Executivo', desc: 'Arroz, feijão e proteína.', price: 34.9, img: '' },
    { id: 's1', category: 'sobremesas', title: 'Pudim da Casa', desc: 'Doce e cremoso.', price: 12.0, img: '' },
  ]
};

// ----------------- Helpers DOM -----------------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function moneyBR(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ----------------- Screens -----------------
const SCREENS = {
  HOME: 'screen-home',
  MENU: 'screen-menu',
  ACCOUNT: 'screen-account',
  ORDERS: 'screen-orders'
};

function showScreen(screenId) {
  Object.values(SCREENS).forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === screenId) el.classList.remove('hidden');
    else el.classList.add('hidden');
  });

  // show/hide orders footer (checkout) depending on screen/orders content
  renderOrdersFooter();
}

// ----------------- Navigation bindings -----------------
function bindNav() {
  $('#nav-menu').addEventListener('click', () => showScreen(SCREENS.MENU));
  $('#nav-account').addEventListener('click', () => {
    renderAccount();
    showScreen(SCREENS.ACCOUNT);
  });
  $('#nav-orders').addEventListener('click', () => {
    renderOrders();
    showScreen(SCREENS.ORDERS);
  });
}

// ----------------- Home actions -----------------
function bindHome() {
  // Simulate QR scan: fill table number with a random table (1..20)
  $('#btn-scan-qr').addEventListener('click', () => {
    const simulated = Math.floor(Math.random() * 12) + 1;
    $('#table-number').value = simulated;
    // optional visual tick
    $('#btn-scan-qr').classList.add('animate-pulse');
    setTimeout(() => $('#btn-scan-qr').classList.remove('animate-pulse'), 700);
  });

  // Confirm table -> store and go to menu (if name provided)
  $('#btn-confirm-table').addEventListener('click', () => {
    const table = $('#table-number').value.trim();
    if (!table) {
      alert('Por favor, informe o número da mesa (ou use Ler QR Code).');
      return;
    }
    state.table = table;
    // update header in menu if already in menu
    $('#hdr-table-number').textContent = `Mesa ${state.table}`;
    alert(`Mesa ${state.table} confirmada.`);
  });

  // Enter (finaliza entrada: precisa ao menos do nome e mesa)
  $('#btn-enter').addEventListener('click', () => {
    const name = $('#client-name').value.trim();
    const phone = $('#phone').value.trim();
    const table = $('#table-number').value.trim() || state.table; // prefer explicit input
    if (!table) {
      alert('Por favor, confirme o número da mesa antes de entrar.');
      return;
    }
    if (!name) {
      alert('Por favor, informe o nome do cliente.');
      return;
    }
    // set state
    state.clientName = name;
    state.phone = phone;
    state.table = table;

    // Update headers and go to menu
    $('#hdr-client-name').textContent = state.clientName;
    $('#hdr-table-number').textContent = `Mesa ${state.table}`;
    showScreen(SCREENS.MENU);
    renderItems(); // populate menu items
    updateOrderBadge();
  });
}

// ----------------- Render items (menu) -----------------
let currentFilter = null; // category filter

function renderItems() {
  const list = $('#items-list');
  list.innerHTML = '';

  // apply category filter (if any)
  const itemsToShow = state.items.filter(it => !currentFilter || it.category === currentFilter);

  itemsToShow.forEach(item => {
    const row = document.createElement('div');
    row.className = 'item-card';

    const img = document.createElement('img');
    img.className = 'item-thumb flex-shrink-0';
    img.src = item.img || 'https://via.placeholder.com/80x80?text=img';
    img.alt = item.title;

    const wrap = document.createElement('div');
    wrap.className = 'flex-grow';

    const title = document.createElement('h3');
    title.className = 'item-title';
    title.textContent = item.title;

    const desc = document.createElement('p');
    desc.className = 'item-desc mt-1';
    desc.textContent = item.desc;

    const price = document.createElement('p');
    price.className = 'item-price mt-2';
    price.textContent = moneyBR(item.price);

    wrap.appendChild(title);
    wrap.appendChild(desc);
    wrap.appendChild(price);

    const actions = document.createElement('div');
    actions.className = 'flex flex-col items-end gap-2';

    const addBtn = document.createElement('button');
    addBtn.className = 'btn-add';
    addBtn.textContent = '+';
    addBtn.title = 'Adicionar ao pedido';
    addBtn.addEventListener('click', () => addToCart(item.id));

    actions.appendChild(addBtn);

    row.appendChild(img);
    row.appendChild(wrap);
    row.appendChild(actions);

    list.appendChild(row);
  });

  // If no items, show empty message
  if (itemsToShow.length === 0) {
    list.innerHTML = `<p class="text-sm text-gray-500 dark:text-gray-400">Nenhum item nesta categoria.</p>`;
  }
}

// ----------------- Category filtering -----------------
function bindCategories() {
  document.querySelectorAll('[data-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-cat');
      // toggle filter
      currentFilter = (currentFilter === cat) ? null : cat;
      // add visual state
      document.querySelectorAll('[data-cat]').forEach(b => b.classList.remove('ring-2','ring-primary'));
      if (currentFilter) btn.classList.add('ring-2','ring-primary');
      renderItems();
    });
  });
}

// ----------------- Cart / Orders -----------------
function addToCart(itemId) {
  const item = state.items.find(i => i.id === itemId);
  if (!item) return;
  if (!state.cart[itemId]) state.cart[itemId] = { item, qty: 0 };
  state.cart[itemId].qty += 1;
  updateOrderBadge();
  // quick feedback
  const orig = event?.target;
  if (orig) {
    orig.classList.add('transform','scale-95');
    setTimeout(() => orig.classList.remove('transform','scale-95'), 160);
  }
}

function removeFromCart(itemId) {
  if (!state.cart[itemId]) return;
  delete state.cart[itemId];
  renderOrders();
  updateOrderBadge();
}

function changeQty(itemId, delta) {
  const entry = state.cart[itemId];
  if (!entry) return;
  entry.qty += delta;
  if (entry.qty <= 0) {
    delete state.cart[itemId];
  }
  renderOrders();
  updateOrderBadge();
}

function cartItemsArray() {
  return Object.values(state.cart);
}

function cartTotal() {
  return cartItemsArray().reduce((s, e) => s + (e.item.price * e.qty), 0);
}

function updateOrderBadge() {
  const count = cartItemsArray().reduce((s,e) => s + e.qty, 0);
  $('#orders-badge').textContent = count;
  if (count === 0) $('#orders-badge').classList.add('hidden');
  else $('#orders-badge').classList.remove('hidden');
}

// ----------------- Render orders page -----------------
function renderOrders() {
  const container = $('#orders-container');
  const empty = $('#orders-empty');
  const footer = $('#orders-footer');

  container.innerHTML = '';
  const arr = cartItemsArray();
  if (arr.length === 0) {
    empty.style.display = 'block';
    footer.classList.add('hidden');
  } else {
    empty.style.display = 'none';
    footer.classList.remove('hidden');
    arr.forEach(entry => {
      const row = document.createElement('div');
      row.className = 'order-row';

      const left = document.createElement('div');
      left.className = 'flex items-center gap-3';

      const img = document.createElement('img');
      img.src = entry.item.img || 'https://via.placeholder.com/64';
      img.className = 'w-14 h-14 rounded-md object-cover flex-shrink-0';

      const info = document.createElement('div');
      info.innerHTML = `<div class="font-semibold">${entry.item.title}</div><div class="text-sm text-gray-500">${entry.item.desc}</div>`;

      left.appendChild(img);
      left.appendChild(info);

      const right = document.createElement('div');
      right.className = 'flex flex-col items-end gap-2';

      const qtyRow = document.createElement('div');
      qtyRow.className = 'flex items-center gap-2';

      const btnMinus = document.createElement('button');
      btnMinus.className = 'px-2 py-1 bg-slate-200 rounded';
      btnMinus.textContent = '-';
      btnMinus.addEventListener('click', () => changeQty(entry.item.id, -1));

      const qty = document.createElement('span');
      qty.textContent = entry.qty;

      const btnPlus = document.createElement('button');
      btnPlus.className = 'px-2 py-1 bg-slate-200 rounded';
      btnPlus.textContent = '+';
      btnPlus.addEventListener('click', () => changeQty(entry.item.id, +1));

      qtyRow.appendChild(btnMinus);
      qtyRow.appendChild(qty);
      qtyRow.appendChild(btnPlus);

      const price = document.createElement('div');
      price.className = 'font-bold text-primary';
      price.textContent = moneyBR(entry.item.price * entry.qty);

      const btnRemove = document.createElement('button');
      btnRemove.className = 'text-xs text-red-500 mt-1';
      btnRemove.textContent = 'Remover';
      btnRemove.addEventListener('click', () => removeFromCart(entry.item.id));

      right.appendChild(qtyRow);
      right.appendChild(price);
      right.appendChild(btnRemove);

      row.appendChild(left);
      row.appendChild(right);

      container.appendChild(row);
    });
  }

  // update totals in footer
  $('#orders-total').textContent = moneyBR(cartTotal());
  // show/hide footer checkout area
  if (arr.length > 0) {
    $('#orders-footer').classList.remove('hidden');
    $('#orders-footer').style.display = 'block';
  } else {
    $('#orders-footer').classList.add('hidden');
  }
}

// ----------------- Orders footer helpers -----------------
function renderOrdersFooter() {
  // footer visible only on orders screen and if there are items
  const isOrdersScreen = !document.getElementById(SCREENS.ORDERS).classList.contains('hidden');
  const arr = cartItemsArray();
  const footer = $('#orders-footer');
  if (isOrdersScreen && arr.length > 0) {
    footer.classList.remove('hidden');
  } else {
    footer.classList.add('hidden');
  }
}

// Order actions (clear / finish)
function bindOrdersActions() {
  $('#btn-clear-orders').addEventListener('click', () => {
    if (!confirm('Limpar todos os itens do pedido?')) return;
    state.cart = {};
    renderOrders();
    updateOrderBadge();
  });

  $('#btn-finish-order').addEventListener('click', () => {
    // Since no backend: simulate sending
    if (cartItemsArray().length === 0) {
      alert('Nenhum item no pedido.');
      return;
    }
    const total = moneyBR(cartTotal());
    alert(`Pedido enviado!\nTotal: ${total}\n(Mensagem simulada — sem backend)`);
    // clear cart after "send"
    state.cart = {};
    renderOrders();
    updateOrderBadge();
    showScreen(SCREENS.MENU);
  });
}

// ----------------- Account render (placeholder) -----------------
function renderAccount() {
  $('#acct-table').textContent = state.table || '—';
  $('#acct-name').textContent = state.clientName || '—';
  $('#acct-phone').textContent = state.phone || '—';
}

// ----------------- Init app -----------------
function init() {
  bindNav();
  bindHome();
  bindCategories();
  bindOrdersActions();

  // initial screen
  showScreen(SCREENS.HOME);

  // ensure badge hidden if zero
  updateOrderBadge();
}

// Run init on DOM ready
document.addEventListener('DOMContentLoaded', init);
