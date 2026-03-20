import { db } from './firebase_config.js';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

let orders = [];
let currentTicket = null;

// Load orders from Firebase
function loadOrders() {
  const colRef = collection(db, "orders");

  onSnapshot(colRef, snapshot => {
    orders = snapshot.docs.map(d => {
      const data = d.data();
        console.log("FIREBASE SNAPSHOT:", snapshot.docs.map(d => d.data()));

      return {
        id: d.id,

        // 🔥 FIX: map your new structure → old structure
        name: data.client?.name || "No Name",
        phone: data.client?.phone || "",
        email: data.client?.email || "",
        address: data.client?.type?.toLowerCase() === "delivery" && data.client?.address
        ? `${data.client.address.street}, ${data.client.address.city}, ${data.client.address.state} ${data.client.address.zip}`
        : "",  // ← empty string for pickup
        type: data.client?.type || "",

        type: data.client?.type || "",
        plan: data.plan || "",
        meals: data.mealCount || 0,
        combinations: data.orders?.length || 0,

        // grab first combo for preview (your system expects this)
        protein: data.orders?.[0]?.Protein?.[0] || "",
        veggies: data.orders?.[0]?.Vegetables || data.orders?.[0]?.Veggies || [],
        carbs: data.orders?.[0]?.Carbohydrates?.[0] || "",
        extras: data.orders?.[0]?.Extras || [],

        status: data.status || "new", // default NEW
        raw: data // keep full data if needed later
      };
    });

    refreshOrders();
  });
}

// Save a new order
async function saveOrder(order) {
  await setDoc(doc(db, "orders", order.id), order);
}

// Update order
async function updateOrder(order) {
  await updateDoc(doc(db, "orders", order.id), {
    status: order.status
  });
}

// Delete order
async function deleteOrderFirebase(orderId) {
  await deleteDoc(doc(db, "orders", orderId));
}


// --- Rendering Functions ---
function renderOrder(listId, order) {
  const container = document.getElementById(listId);
  const div = document.createElement('div');
  div.className = 'order-card';
  div.innerHTML = `<span>${order.name}</span>`;
  div.onclick = () => showTicket(order);

  if (order.status === 'completed') {
    const undo = document.createElement('button'); undo.textContent = '↑'; undo.onclick = e => { e.stopPropagation(); undoComplete(order.id); };
    const del = document.createElement('button'); del.textContent = 'Delete'; del.onclick = e => { e.stopPropagation(); deleteOrder(order.id); };
    div.appendChild(undo); div.appendChild(del);
  } else if (order.status === 'not_ready') {
    const complete = document.createElement('button'); complete.textContent = 'Complete'; complete.onclick = e => { e.stopPropagation(); markComplete(order.id); };
    div.appendChild(complete);
  } else if (order.status === 'new') {
    const seen = document.createElement('button'); seen.textContent = 'Seen'; seen.onclick = e => { e.stopPropagation(); markSeen(order.id); };
    div.appendChild(seen);
  }
  container.appendChild(div);
}

function refreshOrders() {
  ['new-list', 'notready-list', 'completed-list'].forEach(id => document.getElementById(id).innerHTML = '');
  const newFilter = document.getElementById('search-new')?.value?.toLowerCase() || '';
  const notReadyFilter = document.getElementById('search-notready')?.value?.toLowerCase() || '';
  const completedFilter = document.getElementById('search-completed')?.value?.toLowerCase() || '';

  orders.forEach(o => {
    if (o.status === 'new' && o.name.toLowerCase().includes(newFilter)) renderOrder('new-list', o);
    else if (o.status === 'not_ready' && o.name.toLowerCase().includes(notReadyFilter)) renderOrder('notready-list', o);
    else if (o.status === 'completed' && o.name.toLowerCase().includes(completedFilter)) renderOrder('completed-list', o);
  });
}

// --- Order Status Functions ---
function markComplete(id) { const o = orders.find(o => o.id === id); if (o) { o.status = 'completed'; updateOrder(o); } }
function undoComplete(id) { const o = orders.find(o => o.id === id); if (o) { o.status = 'not_ready'; updateOrder(o); } }
function deleteOrder(id) { deleteOrderFirebase(id); }
function markSeen(id) { const o = orders.find(o => o.id === id); if (o) { o.status = 'not_ready'; updateOrder(o); } }

// --- Ticket Functions ---
function showTicket(order) {
  currentTicket = order;
  const ticketList = document.getElementById('ticket-list');
  ticketList.innerHTML = '';
  ticketList.appendChild(generateTicketDiv(order));
}

function generateTicketDiv(order) {
  const div = document.createElement('div'); 
  div.className = 'ticket';

  let mealDetails = '';

  order.raw.orders.forEach((combo, index) => {
    const protein = combo.Protein?.join(', ') || '';
    const veggies = combo.Vegetables || combo.Veggies || [];
    const carbs = combo.Carbohydrates?.join(', ') || '';
    const extras = combo.Extras?.length ? combo.Extras.join(', ') : 'None';

    mealDetails += `
      <b>Combination ${index + 1}</b><br>
      Protein: ${protein}<br>
      Veggies: ${veggies.join(', ')}<br>
      Carbs: ${carbs}<br>
      Extras: ${extras}<br><br>
    `;
  });

  div.innerHTML = `
    <b>Client Information</b><br>
    Name: ${order.name}<br>
    Phone: ${order.phone}<br>
    Email: ${order.email}<br>
    ${order.address ? `Address: <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}" target="_blank">${order.address}</a><br>` : ''}

    <b>Order Details</b><br>
    Type: ${order.type}<br>
    Plan: ${order.plan}<br>
    Meals: ${order.meals}<br>
    Combinations: ${order.combinations}<br><br>

    <b>Meal Details</b><br>
    ${mealDetails}
  `;

  return div;
}

function openPrintWindow(contentHTML) {
  const win = window.open('', '', 'width=400,height=600');

  win.document.write(`
    <html>
      <head>
        <title>Print</title>
        <style>
          body {
            font-family: monospace;
            padding: 10px;
            width: 280px;
          }

          .ticket {
            width: 100%;
            font-size: 12px;
          }

          .divider {
            border-top: 1px dashed #000;
            margin: 8px 0;
          }

          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        ${contentHTML}
      </body>
    </html>
  `);

  win.document.close();
  win.focus();

  setTimeout(() => {
    win.print();
    win.close();
  }, 300);
}

// --- Printing ---
function printTicket() {
  if (!currentTicket) return alert("No ticket selected");

  const ticketEl = document.querySelector('#ticket-list .ticket');
  if (!ticketEl) return alert("Ticket not rendered");

  // Clone and force display
  const clone = ticketEl.cloneNode(true);
  clone.style.display = "block"; // make sure it shows in print
  clone.querySelectorAll('a').forEach(a => {
    a.outerHTML = a.innerText; // remove links for printing
  });

  const win = window.open('', '', 'width=400,height=600');
  win.document.write(`
    <html>
      <head>
        <title>Print Ticket</title>
        <style>
          body { font-family: monospace; padding: 10px; width: 280px; }
          .ticket { width: 100%; font-size: 12px; display: block; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          @media print { body { margin:0; } }
        </style>
      </head>
      <body>
        ${clone.outerHTML}
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
  win.close();
}
document.getElementById("print-ticket-btn")?.addEventListener("click", printTicket);

function printNotReady() {
  const notReady = orders.filter(o => o.status === 'not_ready');
  if (!notReady.length) return alert("No Not Ready orders");

  let html = "";

  notReady.forEach(o => {
    const extras = o.extras?.length ? o.extras.join(', ') : 'None';

    html += `
      <div class="ticket">
        <center><b>ORDER</b></center>
        <div class="divider"></div>

        ${o.name}<br>
        ${o.phone}<br>

        <div class="divider"></div>

        ${o.plan} (${o.type})<br>
        Meals: ${o.meals}<br>

        <div class="divider"></div>

        ${o.protein}<br>
        ${o.carbs}<br>

        Extras: ${extras}
      </div>

      <div style="page-break-after: always;"></div>
    `;
  });

  openPrintWindow(html);
}
document.getElementById("print-notready-btn")?.addEventListener("click", printNotReady);

function printWeekProduct() {
  const weekList = document.getElementById('week-list');
  if (!weekList.innerHTML) return alert("No products");

  const html = `
    <div class="ticket">
      <center><b>WEEK PRODUCTS</b></center>
      <div class="divider"></div>
      ${weekList.innerHTML}
    </div>
  `;

  openPrintWindow(html);
}
document.getElementById("print-week-btn")?.addEventListener("click", printWeekProduct);

// --- Search Listeners ---
['search-new', 'search-notready', 'search-completed'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', refreshOrders);
});

// Start
loadOrders();