// admin.js - Versão final e corrigida com 2 abas e botão de Reset

document.addEventListener('DOMContentLoaded', () => {
  // --- Element References ---
  const ordersGrid = document.getElementById('orders-grid');
  const completedOrdersGrid = document.getElementById('completed-orders-grid');
  const noCompletedOrdersMsg = document.getElementById('no-completed-orders');
  const refreshBtn = document.getElementById('refresh-btn');
  const resetBtn = document.getElementById('reset-btn');
  const tabActive = document.getElementById('tab-active');
  const tabCompleted = document.getElementById('tab-completed');
  const panelActive = document.getElementById('panel-active');
  const panelCompleted = document.getElementById('panel-completed');

  // --- Data & Constants ---
  const TABLES_KEY = 'tanamesa_tables';
  const COMPLETED_ORDERS_KEY = 'tanamesa_completed_orders';
  const TOTAL_TABLES = 10;
  const moneyBR = (value) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // --- Data Functions ---
  const getFromStorage = (key) => JSON.parse(localStorage.getItem(key) || '[]');
  const saveToStorage = (key, data) => localStorage.setItem(key, JSON.stringify(data));

  const initializeTables = () => {
    const tablesJSON = localStorage.getItem(TABLES_KEY);
    if (!tablesJSON) {
      const initialTables = {};
      for (let i = 1; i <= TOTAL_TABLES; i++) initialTables[i] = { status: 'available', order: null };
      saveToStorage(TABLES_KEY, initialTables);
      return initialTables;
    }
    try {
      return JSON.parse(tablesJSON);
    } catch (e) {
      console.error("Falha ao ler as mesas no admin. Resetando o estado.", e);
      const initialTables = {};
      for (let i = 1; i <= TOTAL_TABLES; i++) initialTables[i] = { status: 'available', order: null };
      saveToStorage(TABLES_KEY, initialTables);
      return initialTables;
    }
  };
  
  const getTables = () => initializeTables();
  const getCompletedOrders = () => getFromStorage(COMPLETED_ORDERS_KEY);

  // --- Render Functions ---
  const renderActiveTables = () => {
    const tables = getTables();
    ordersGrid.innerHTML = '';
    for (let i = 1; i <= TOTAL_TABLES; i++) {
      const table = tables[i];
      const tableCard = document.createElement('div');
      tableCard.setAttribute('data-table-id', i);
      if (table.status === 'occupied' && table.order) {
        const order = table.order;
        const itemsHtml = order.items.map(entry => `<li class="flex justify-between"><span>${entry.qty}x ${entry.item.title}</span><span class="font-mono">${moneyBR(entry.item.price * entry.qty)}</span></li>`).join('');
        tableCard.className = 'bg-white p-4 rounded-lg shadow-md flex flex-col';
        tableCard.innerHTML = `<header class="mb-4 border-b pb-2"><div class="flex justify-between items-center"><h2 class="text-xl font-bold">Mesa ${i}</h2><span class="text-sm text-gray-500">${new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div><p class="text-sm text-gray-600">Cliente: ${order.clientName}</p></header><ul class="flex-grow space-y-1 text-sm mb-4 overflow-y-auto" style="max-height: 150px;">${itemsHtml}</ul><footer class="border-t pt-2 mt-auto"><div class="flex justify-between items-center font-bold text-lg mb-4"><span>Total</span><span>${moneyBR(order.total)}</span></div><button class="w-full bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600 free-table-btn">Liberar Mesa (Manual)</button></footer>`;
      } else {
        tableCard.className = 'bg-gray-50 border-2 border-dashed rounded-lg flex items-center justify-center h-48';
        tableCard.innerHTML = `<div class="text-center"><h2 class="text-xl font-bold text-gray-400">Mesa ${i}</h2><p class="text-gray-400">Disponível</p></div>`;
      }
      ordersGrid.appendChild(tableCard);
    }
  };

  const renderCompletedOrders = () => {
    const orders = getCompletedOrders();
    completedOrdersGrid.innerHTML = '';
    if (orders.length === 0) {
      completedOrdersGrid.appendChild(noCompletedOrdersMsg);
    } else {
      orders.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
      orders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'bg-gray-200 p-4 rounded-lg shadow-sm flex flex-col opacity-80';
        const itemsHtml = order.items.map(entry => `<li class="flex justify-between text-gray-700"><span>${entry.qty}x ${entry.item.title}</span><span class="font-mono">${moneyBR(entry.item.price * entry.qty)}</span></li>`).join('');
        const completedTime = new Date(order.completedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        orderCard.innerHTML = `<header class="mb-4 border-b border-gray-400 pb-2"><div class="flex justify-between items-center"><h2 class="text-xl font-bold text-gray-700">Mesa ${order.table}</h2><p class="text-sm text-gray-600">Cliente: ${order.clientName}</p></div></header><ul class="flex-grow space-y-1 text-sm mb-4">${itemsHtml}</ul><footer class="border-t border-gray-400 pt-2 mt-auto"><div class="flex justify-between items-center font-bold text-gray-700"><span>Total</span><span>${moneyBR(order.total)}</span></div><p class="text-xs text-center text-gray-500 mt-2">Finalizado às ${completedTime}</p></footer>`;
        completedOrdersGrid.appendChild(orderCard);
      });
    }
  };
  
  const renderAll = () => {
    renderActiveTables();
    renderCompletedOrders();
  };

  // --- Event Listeners ---
  refreshBtn.addEventListener('click', renderAll);
  
  resetBtn.addEventListener('click', () => {
    if (confirm('ATENÇÃO: Isso limpará todos os dados do sistema (mesas e pedidos finalizados).\n\nDeseja continuar?')) {
      localStorage.removeItem(TABLES_KEY);
      localStorage.removeItem(COMPLETED_ORDERS_KEY);
      window.location.reload();
    }
  });

  tabActive.addEventListener('click', () => {
    panelActive.classList.remove('hidden');
    panelCompleted.classList.add('hidden');
    tabActive.classList.add('border-orange-500', 'text-orange-600');
    tabCompleted.classList.remove('border-orange-500', 'text-orange-600');
  });

  tabCompleted.addEventListener('click', () => {
    panelActive.classList.add('hidden');
    panelCompleted.classList.remove('hidden');
    tabCompleted.classList.add('border-orange-500', 'text-orange-600');
    tabActive.classList.remove('border-orange-500', 'text-orange-600');
  });

  ordersGrid.addEventListener('click', (e) => {
    if (e.target.classList.contains('free-table-btn')) {
      const card = e.target.closest('[data-table-id]');
      const tableId = card.getAttribute('data-table-id');
      if (!confirm(`Liberar a Mesa ${tableId} manualmente? O pedido será movido para finalizados.`)) return;
      let tables = getTables();
      let completedOrders = getCompletedOrders();
      const tableToFree = tables[tableId];
      if (tableToFree && tableToFree.status === 'occupied') {
        const orderToComplete = { ...tableToFree.order, table: tableId, completedAt: new Date().toISOString() };
        completedOrders.push(orderToComplete);
        tables[tableId] = { status: 'available', order: null };
        saveToStorage(TABLES_KEY, tables);
        saveToStorage(COMPLETED_ORDERS_KEY, completedOrders);
        renderAll();
      }
    }
  });

  // --- Initial Setup ---
  renderAll();
  setInterval(renderAll, 10000);
});