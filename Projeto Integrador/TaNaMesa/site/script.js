/* script.js - Versão final e corrigida com fluxo de pagamento do cliente */

// ----------------- Estado da Sessão Atual -----------------
const session = {
  tableId: null,
};

// ----------------- Constantes e Helpers -----------------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const TABLES_KEY = 'tanamesa_tables';
const COMPLETED_ORDERS_KEY = 'tanamesa_completed_orders';
const TOTAL_TABLES = 10;
const moneyBR = (value) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// --- Funções de Gerenciamento de Estado (localStorage) ---
const saveTables = (tables) => localStorage.setItem(TABLES_KEY, JSON.stringify(tables));
const getCompletedOrders = () => JSON.parse(localStorage.getItem(COMPLETED_ORDERS_KEY) || '[]');
const saveCompletedOrders = (orders) => localStorage.setItem(COMPLETED_ORDERS_KEY, JSON.stringify(orders));

const initializeTables = () => {
  const tablesJSON = localStorage.getItem(TABLES_KEY);
  if (!tablesJSON) {
    // Inicialização pela primeira vez
    const initialTables = {};
    for (let i = 1; i <= TOTAL_TABLES; i++) initialTables[i] = { status: 'available', order: null };
    saveTables(initialTables);
    return initialTables;
  }
  try {
    // Tenta ler os dados existentes
    return JSON.parse(tablesJSON);
  } catch (e) {
    // Dados corrompidos, reseta para o estado inicial
    console.error("Falha ao ler as mesas do localStorage. Resetando o estado.", e);
    const initialTables = {};
    for (let i = 1; i <= TOTAL_TABLES; i++) initialTables[i] = { status: 'available', order: null };
    saveTables(initialTables);
    return initialTables;
  }
};
const getTables = () => initializeTables();


// ----------------- Telas (Screens) -----------------
const SCREENS = { HOME: 'screen-home', MENU: 'screen-menu', ACCOUNT: 'screen-account', ORDERS: 'screen-orders' };

function showScreen(screenId) {
  const appFooter = $('#app-footer');
  Object.values(SCREENS).forEach(id => {
    $(`#${id}`).classList.toggle('hidden', id !== screenId);
  });
  // Lógica explícita para visibilidade do rodapé
  if (appFooter) {
    if (screenId === SCREENS.HOME) {
      appFooter.classList.add('hidden');
    } else {
      appFooter.classList.remove('hidden');
    }
  }
  
  if (screenId === SCREENS.HOME) renderAvailableTables();
  if (screenId === SCREENS.ACCOUNT) renderAccount();
  
  renderOrdersFooter();
  updateOrderBadge();
}

// ----------------- Navegação -----------------
function bindNav() {
  $('#nav-menu').addEventListener('click', () => showScreen(SCREENS.MENU));
  $('#nav-account').addEventListener('click', () => showScreen(SCREENS.ACCOUNT));
  $('#nav-orders').addEventListener('click', () => {
    renderOrders();
    showScreen(SCREENS.ORDERS);
  });
}

// ----------------- Lógica da Tela Inicial -----------------
function renderAvailableTables() {
  const tables = getTables();
  const selector = $('#table-selector');
  selector.innerHTML = '';
  const availableTables = Object.entries(tables).filter(([, data]) => data.status === 'available');

  if (availableTables.length === 0) {
    selector.innerHTML = '<option disabled>Nenhuma mesa disponível no momento</option>';
    $('#btn-enter').disabled = true;
  } else {
    $('#btn-enter').disabled = false;
    availableTables.forEach(([tableId]) => {
      selector.appendChild(new Option(`Mesa ${tableId}`, tableId));
    });
  }
}

function bindHome() {
  $('#btn-enter').addEventListener('click', () => {
    const clientName = $('#client-name').value.trim();
    const tableId = $('#table-selector').value;
    if (!tableId || !clientName) {
      alert('Por favor, selecione uma mesa e informe seu nome.');
      return;
    }
    const tables = getTables();
    tables[tableId].status = 'occupied';
    tables[tableId].order = {
      clientName: clientName,
      phone: $('#phone').value.trim(),
      items: [],
      total: 0,
      timestamp: new Date().toISOString()
    };
    saveTables(tables);
    session.tableId = tableId;
    
    $('#hdr-client-name').textContent = clientName;
    $('#hdr-table-number').textContent = `Mesa ${tableId}`;
    showScreen(SCREENS.MENU);
    renderItems();
  });
}

// ----------------- Lógica do Cardápio (Menu) -----------------
const catalog = [
    { id: 'l1', category: 'lanches', title: 'Nome do Lanche', desc: 'Descrição curta do lanche para o cliente.', price: 25.5, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCuMxoupdf0v60V25C2UbJxl5UMkZhkmBq_OU7kAAaYajZh9hYc9Q-lTvBDrjH9P5wSGQacDHFMdhEtczArCe3UHFdmfYAtYKJhZv1ilQrKFd2GDJedS-a6BfkCwYNLW_7RGBbaLJIoCDdhKbcX5JOKQaI_KU9AHBBWeMXBDhzplkDoVjLuig5kCDfEO3JHDCUzG_K89AsBlfK3ffHyN8xZxwS2gAxOb13TrUog7VDXZR1PBoqlP6BjJ1DhdoC_hU0ZVxk0ZbCKkjT9' },
    { id: 'l2', category: 'lanches', title: 'Outro Lanche Especial', desc: 'Descrição deste outro lanche muito saboroso.', price: 32.0, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBm-JIcd42YQfXtUhvcC3tbCWRpcJAmD33NnleR6wo_HryS_ZPrqnwHOP135_5ZefkXO01BTjH1q-D6yTbsyDKbTWJipitadPTvWMvzRrO2tFZk_x6QlS1WnOrlvxQRwbzGkd14PnLKVEh9fljMYB8qoCZZ_AYy6fVw1Tk5cjX1ISNaFsEF030OlPoayKAuWnvOHC_DEnjUzG4qd9l8TyGs_Y3AnEbjGzgg8Sc6kQMf5Fjc1zoKpJTGAzUyQKqflj5VHezmpS7UOmqc' },
    { id: 'l3', category: 'lanches', title: 'Lanche da Casa', desc: 'O lanche mais pedido, com ingredientes selecionados.', price: 28.9, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDynkaMaVf-0i8o0QUQODe3bBQauCAuOX-hW7If3Pirk9_TsZZ6n4HxtHdNAMyMa1CakfXPr-Q1pl-d0j6X0yqhVX33ovjrz90IeOPqWdkbhzpGHut896FW-SxvNMqjgMqokUMV8PBeuZNTAVqMOIht2dhEM1tD5O5TYP3S_Oi4vaAwFphrudoypdnvhvi2ag_Mz-OVHB0rHvzUU9ISKVyKRmfguBT-ntmkLqMoqxw1IVAIqq94Mo9Qy-B8ulLzqHrqiYsSoXyc-TdJ' },
    { id: 'b1', category: 'bebidas', title: 'Refrigerante 350ml', desc: 'Geladinho.', price: 7.5, img: '' },
    { id: 'p1', category: 'pratos', title: 'Prato Executivo', desc: 'Arroz, feijão e proteína.', price: 34.9, img: '' },
    { id: 's1', category: 'sobremesas', title: 'Pudim da Casa', desc: 'Doce e cremoso.', price: 12.0, img: 'assets/pudim.jpg' },
];
let currentFilter = null;

function renderItems() {
    const list = $('#items-list');
    list.innerHTML = '';
    catalog.filter(it => !currentFilter || it.category === currentFilter).forEach(item => {
        const row = document.createElement('div');
        row.className = 'item-card';
        row.innerHTML = `<img class="item-thumb flex-shrink-0" src="${item.img || 'https://via.placeholder.com/80x80?text=img'}" alt="${item.title}"><div class="flex-grow"><h3 class="item-title">${item.title}</h3><p class="item-desc mt-1">${item.desc}</p><p class="item-price mt-2">${moneyBR(item.price)}</p></div><div class="flex flex-col items-end gap-2"><button title="Adicionar ao pedido" class="btn-add">+</button></div>`;
        row.querySelector('.btn-add').addEventListener('click', () => addToCart(item.id));
        list.appendChild(row);
    });
}

function bindCategories() {
  $$('[data-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = (currentFilter === btn.dataset.cat) ? null : btn.dataset.cat;
      $$('[data-cat]').forEach(b => b.classList.remove('ring-2', 'ring-primary'));
      if (currentFilter) btn.classList.add('ring-2', 'ring-primary');
      renderItems();
    });
  });
}

// ----------------- Lógica de Pedidos (Cart) -----------------
function updateOrder(updateCallback) {
  if (!session.tableId) return;
  const tables = getTables();
  const order = tables[session.tableId].order;
  if (order) {
    updateCallback(order);
    order.total = order.items.reduce((sum, e) => sum + (e.item.price * e.qty), 0);
    saveTables(tables);
  }
  renderOrders();
  updateOrderBadge();
}

const addToCart = (itemId) => {
  const item = catalog.find(i => i.id === itemId);
  if (!item) return;
  updateOrder(order => {
    let entry = order.items.find(e => e.item.id === itemId);
    if (entry) entry.qty += 1;
    else order.items.push({ item: item, qty: 1 });
  });
};
const changeQty = (itemId, delta) => updateOrder(order => {
  let entry = order.items.find(e => e.item.id === itemId);
  if (entry) {
    entry.qty += delta;
    if (entry.qty <= 0) order.items = order.items.filter(e => e.item.id !== itemId);
  }
});
const removeFromCart = (itemId) => updateOrder(order => {
    order.items = order.items.filter(e => e.item.id !== itemId);
});
const clearCart = () => {
  if (!confirm('Limpar todos os itens do pedido?')) return;
  updateOrder(order => order.items = []);
};

function getOrderItems() {
  if (!session.tableId) return [];
  const tables = getTables();
  return tables[session.tableId]?.order?.items || [];
}

function getOrderTotal() {
  if (!session.tableId) return 0;
  const tables = getTables();
  return tables[session.tableId]?.order?.total || 0;
}

function updateOrderBadge() {
  const count = getOrderItems().reduce((sum, e) => sum + e.qty, 0);
  $('#orders-badge').textContent = count;
  $('#orders-badge').classList.toggle('hidden', count === 0);
}

// ----------------- Renderização e Ações das Telas -----------------
function renderOrders() {
  const container = $('#orders-container');
  const empty = $('#orders-empty');
  container.innerHTML = '';
  const items = getOrderItems();
  empty.style.display = items.length === 0 ? 'block' : 'none';
  items.forEach(entry => {
    const row = document.createElement('div');
    row.className = 'order-row';
    row.innerHTML = `<div class="flex items-center gap-3"><img src="${entry.item.img || 'https://via.placeholder.com/64'}" class="w-14 h-14 rounded-md object-cover flex-shrink-0"><div><div class="font-semibold">${entry.item.title}</div><div class="text-sm text-gray-500">${entry.item.desc}</div></div></div><div class="flex flex-col items-end gap-2"><div class="flex items-center gap-2"><button class="px-2 py-1 bg-slate-200 rounded btn-minus">-</button><span>${entry.qty}</span><button class="px-2 py-1 bg-slate-200 rounded btn-plus">+</button></div><div class="font-bold text-primary">${moneyBR(entry.item.price * entry.qty)}</div><button class="text-xs text-red-500 mt-1 btn-remove">Remover</button></div>`;
    row.querySelector('.btn-minus').addEventListener('click', () => changeQty(entry.item.id, -1));
    row.querySelector('.btn-plus').addEventListener('click', () => changeQty(entry.item.id, 1));
    row.querySelector('.btn-remove').addEventListener('click', () => removeFromCart(entry.item.id));
    container.appendChild(row);
  });
  $('#orders-total').textContent = moneyBR(getOrderTotal());
  renderOrdersFooter();
}

function renderOrdersFooter() {
  $('#orders-footer')?.classList.toggle('hidden', $('#screen-orders').classList.contains('hidden') || getOrderItems().length === 0);
}

function bindOrdersActions() {
  $('#btn-clear-orders').addEventListener('click', clearCart);
  $('#btn-go-to-payment').addEventListener('click', () => showScreen(SCREENS.ACCOUNT));
}

function renderAccount() {
  if (!session.tableId) return;
  const tables = getTables();
  const order = tables[session.tableId].order;
  if (!order) return;

  $('#acct-table').textContent = session.tableId;
  $('#acct-name').textContent = order.clientName;
  $('#acct-total').textContent = moneyBR(order.total);
  
  const summaryContainer = $('#acct-order-summary');
  summaryContainer.innerHTML = '';
  order.items.forEach(entry => {
    const itemEl = document.createElement('div');
    itemEl.className = 'flex justify-between text-sm';
    itemEl.innerHTML = `<span>${entry.qty}x ${entry.item.title}</span><span class="font-mono">${moneyBR(entry.item.price * entry.qty)}</span>`;
    summaryContainer.appendChild(itemEl);
  });
}

function bindAccountActions() {
    $('#btn-pay-now').addEventListener('click', async () => {
        if (getOrderItems().length === 0) {
            alert("Não há itens na conta para pagar.");
            return;
        }
        if (!confirm(`Simular pagamento de ${moneyBR(getOrderTotal())}?`)) return;

        const tables = getTables();
        const completedOrders = getCompletedOrders();

        const orderToComplete = tables[session.tableId].order;
        const orderItems = getOrderItems();

        // monta payload para o back-end (endpoint /finalizar)
        const payload = {
            mesa: String(session.tableId),
            cliente: orderToComplete.clientName || '',
            telefone: orderToComplete.phone || '',
            total: getOrderTotal().toFixed(2),
            itens: JSON.stringify(orderItems)
        };

        const qs = new URLSearchParams(payload).toString();

        try {
            const resp = await fetch(`/finalizar?${qs}`);
            if (!resp.ok) {
                console.error('Falha ao salvar pedido no banco:', await resp.text());
            }
        } catch (e) {
            console.error('Erro ao chamar /finalizar', e);
            // não bloqueia o fluxo do usuário
        }

        // fluxo atual de finalização (localStorage + admin)
        completedOrders.push({
            ...orderToComplete,
            table: session.tableId,
            completedAt: new Date().toISOString()
        });

        tables[session.tableId] = { status: 'available', order: null };

        saveTables(tables);
        saveCompletedOrders(completedOrders);

        alert('Pagamento realizado com sucesso! Obrigado!');
        session.tableId = null;
        window.location.reload(); // Recarrega para voltar ao início
    });
}

// ----------------- Inicialização -----------------
function init() {
  bindNav();
  bindHome();
  bindCategories();
  bindOrdersActions();
  bindAccountActions();
  showScreen(SCREENS.HOME);
}

document.addEventListener('DOMContentLoaded', init);