import { db } from './firebase_config.js';
import { collection, doc, updateDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

if (window.innerWidth <= 768) {

const pcMain = document.getElementById("main");
const mobileContainer = document.getElementById("mobile-container");

pcMain.style.display = "none";
mobileContainer.style.display = "flex";

let orders = [];
let lastOrderIds = new Set(); // 🔥 used to detect NEW orders

const renderMap = {};

// -------- LOAD ORDERS (REALTIME + NEW ORDER DETECTION) --------
function loadOrders() {
  const colRef = collection(db, "orders");

  onSnapshot(colRef, snapshot => {

    const newIds = new Set();
    const newOrders = [];

    orders = snapshot.docs.map(d => {
      const data = d.data();

      const orderObj = {
        id: d.id,
        name: data.client?.name || "No Name",
        phone: data.client?.phone || "",
        email: data.client?.email || "",
        address: data.client?.type === "Delivery" && data.client?.address
          ? `${data.client.address.street}, ${data.client.address.city}, ${data.client.address.state} ${data.client.address.zip}`
          : "Pickup",
        type: data.client?.type || "",
        plan: data.plan || "",
        meals: data.mealCount || 0,
        combinations: data.orders?.length || 0,
        protein: data.orders?.[0]?.Protein?.[0] || "",
        veggies: data.orders?.[0]?.Vegetables || [],
        carbs: data.orders?.[0]?.Carbohydrates?.[0] || "",
        extras: data.orders?.[0]?.Extras || [],
        status: data.status || "new",
        raw: data
      };

      newIds.add(d.id);

      // 🔥 detect NEW order (like test button feel)
      if (!lastOrderIds.has(d.id)) {
        newOrders.push(orderObj);
      }

      return orderObj;
    });

    lastOrderIds = newIds;

    // 🔥 if new orders came in → auto open NEW section
    if (newOrders.length > 0 && renderMap["new"]) {
      renderMap["new"]();
    }

    // refresh all
    Object.values(renderMap).forEach(fn => fn());
  });
}

function orderCount(status){
  return orders.filter(o => o.status===status).length;
}

// -------- PRINT --------
function mobilePrint(contentHTML, title = "Print") {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = contentHTML;
  tempDiv.querySelectorAll('a').forEach(a => a.outerHTML = a.innerText);

  const win = window.open('', '_blank', 'width=400,height=600');
  if (!win) return alert("Pop-up blocked! Allow pop-ups for printing.");

  win.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: monospace; padding: 5px; width: 280px; margin:0; }
          .ticket { width: 100%; font-size: 12px; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
        </style>
      </head>
      <body>${tempDiv.innerHTML}</body>
    </html>
  `);

  win.document.close();
  win.focus();
  win.print();
  win.close();
}

function printTicket(order) {
  if (!order) return alert("No order selected");

  const ticketCard = [...document.querySelectorAll('.mobile-ticket')].find(
    el => el.querySelector('.ticket-header').innerText === order.name
  );
  if (!ticketCard) return alert("Ticket not rendered");

  const ticketEl = ticketCard.querySelector('.ticket'); // expanded div
  const html = ticketEl.outerHTML;

  mobilePrint(html, "Order Ticket");
}

function printNotReadyTickets() {
  const tickets = orders.filter(o => o.status === "not_ready");
  if (!tickets.length) return alert("No Not Ready orders");

  let html = "";
  tickets.forEach(t => {
    const extras = t.extras?.length ? t.extras.join(", ") : "None";

    html += `
      <div class="ticket">
        <center><b>ORDER</b></center>
        <div class="divider"></div>

        ${t.name}<br>
        ${t.phone}<br>
        ${t.address}<br>

        <div class="divider"></div>

        ${t.plan} (${t.type})<br>
        Meals: ${t.meals}<br>
        Combinations: ${t.combinations}<br>

        <div class="divider"></div>

        ${t.protein}<br>
        ${t.carbs}<br>
        Extras: ${extras}
      </div>
      <div style="page-break-after: always;"></div>
    `;
  });

  mobilePrint(html, "Not Ready Orders");
}

// -------- SECTIONS --------
function createSection(name,status){

  const btn = document.createElement("button");
  btn.className = "mobile-section-btn";
  mobileContainer.appendChild(btn);

  const page = document.createElement("div");
  page.className = "mobile-page";
  mobileContainer.appendChild(page);

  const title = document.createElement("h2");
  title.innerText = name;
  page.appendChild(title);

  const close = document.createElement("button");
  close.innerText = "X";
  close.className = "close-btn";
  close.onclick = ()=> page.style.display="none";
  page.appendChild(close);

  const search = document.createElement("input");
  search.placeholder = "Search orders...";
  search.className = "mobile-search";
  page.appendChild(search);

  // 🔥 PRINT ALL (like old system)
  if(status==="not_ready"){
    const printAll = document.createElement("button");
    printAll.innerText = "Print All";
    printAll.className = "top-left-btn";
    printAll.onclick = printNotReadyTickets;
    page.appendChild(printAll);
  }

  const list = document.createElement("div");
  page.appendChild(list);

  function render(){
    btn.textContent = `${name} (${orderCount(status)})`;
    list.innerHTML = "";

    let filtered = orders.filter(o => o.status === status);

    if(search.value.trim()){
      const s = search.value.toLowerCase();
      filtered = filtered.filter(o =>
        o.name.toLowerCase().includes(s) ||
        o.phone.toLowerCase().includes(s) ||
        o.email.toLowerCase().includes(s)
      );
    }

    filtered.forEach(order => {

      const card = document.createElement("div");
      card.className = "mobile-ticket";

      const header = document.createElement("div");
      header.className = "ticket-header";
      header.innerText = order.name;

      const ticket = document.createElement("div");
      ticket.className = "ticket";
      ticket.style.display = "none";

      const extras = order.extras?.length ? order.extras.join(', ') : 'None'; 

// Build all combinations
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

ticket.innerHTML = `
  <b>Client Information</b><br>
  Name: ${order.name}<br>
  Phone: ${order.phone}<br>
  Email: ${order.email}<br>
  ${order.type === "Delivery" ? `Address: <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}" target="_blank">${order.address}</a><br>` : ''}

  <b>Order Details</b><br>
  Type: ${order.type}<br>
  Plan: ${order.plan}<br>
  Meals: ${order.meals}<br>
  Combinations: ${order.combinations}<br><br>

  <b>Meal Details</b><br>
  ${mealDetails}
`;

      const buttons = document.createElement("div");
      buttons.className = "ticket-buttons";

      function makeBtn(text, action){
        const b = document.createElement("button");
        b.innerText = text;

        b.onclick = async (e)=>{
          e.stopPropagation();
          await action();
        };

        return b;
      }

      if(status==="new"){
        buttons.appendChild(makeBtn("Seen", ()=> updateDoc(doc(db,"orders",order.id),{status:"not_ready"})));
      }

      if(status==="not_ready"){
        buttons.appendChild(makeBtn("Done", ()=> updateDoc(doc(db,"orders",order.id),{status:"completed"})));
        buttons.appendChild(makeBtn("Print", ()=> printTicket(order)));
      }

      if(status==="completed"){
        buttons.appendChild(makeBtn("Undo", ()=> updateDoc(doc(db,"orders",order.id),{status:"not_ready"})));
        buttons.appendChild(makeBtn("Delete", ()=> deleteDoc(doc(db,"orders",order.id))));
      }

      ticket.appendChild(buttons);
      card.appendChild(header);
      card.appendChild(ticket);

      card.onclick = ()=> {
        ticket.style.display = ticket.style.display==="none" ? "block" : "none";
      };

      list.appendChild(card);
    });
  }

  renderMap[status] = render;

  search.oninput = render;
  btn.onclick = ()=>{ render(); page.style.display="flex"; };
}

// -------- INIT --------
createSection("New Orders","new");
createSection("Not Ready","not_ready");
createSection("Completed","completed");

loadOrders();

}