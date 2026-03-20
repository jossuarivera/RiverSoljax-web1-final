const planTitleEl = document.getElementById("planTitle");
const planDescriptionEl = document.getElementById("planDescription");

let plan = sessionStorage.getItem("selectedPlan") || "Bulking";
const planData = {
  "Stay Healthy": {desc:"5oz Protein • 3.5oz Carbs • 3.5oz Veggies", price5:75, price10:135},
  "Weight Loss": {desc:"4oz Protein • 3oz Carbs • 3.5oz Veggies", price5:70, price10:125},
  "Bulking": {desc:"6oz Protein • 4oz Carbs • 4oz Veggies", price5:80, price10:150}
};

planTitleEl.textContent = plan;
planDescriptionEl.textContent = `${planData[plan].desc} | Prices: 5 meals $${planData[plan].price5}, 10 meals $${planData[plan].price10}`;

const mealCountModal = document.getElementById("mealCountModal");
const combinationModal = document.getElementById("combinationModal");
const mealCountButtons = document.querySelectorAll(".mealCountBtn");
const comboButtons = document.querySelectorAll(".comboBtn");

let mealCount = 0;
let comboCount = 1;
let currentCombo = 1;

// Load previous orders from sessionStorage or start fresh
let orders = JSON.parse(sessionStorage.getItem("orders") || "[]");

// Reset orders if user clicks Home
document.querySelector('.navigation_bar a').addEventListener("click", () => {
  sessionStorage.clear();
});

// Show meal count modal
mealCountModal.style.display = "flex";

mealCountButtons.forEach(btn => btn.addEventListener("click", () => {
  mealCount = parseInt(btn.dataset.meals);
  mealCountModal.style.display = "none";
  currentCombo = 1; 
  comboCount = 1;

  // Only clear orders if starting a fresh selection
  orders = [];

  if(mealCount === 10) combinationModal.style.display = "flex";
  else updateComboTitle();
}));

comboButtons.forEach(btn => btn.addEventListener("click", () => {
  comboCount = parseInt(btn.dataset.combo);
  combinationModal.style.display = "none";
  updateComboTitle();
}));

const comboTitleEl = document.getElementById("comboTitle");
function updateComboTitle(){
  if(mealCount === 10 && comboCount ===2){
    comboTitleEl.textContent = currentCombo===1?"1st Combination":"2nd Combination";
    document.getElementById("nextBtn").style.display = currentCombo===1?"inline-block":"none";
    document.getElementById("checkoutBtn").style.display = currentCombo===2?"inline-block":"none";
  } else {
    comboTitleEl.textContent="";
    document.getElementById("nextBtn").style.display="none";
    document.getElementById("checkoutBtn").style.display="inline-block";
  }
}

// Limit selections
function limitSelection(name,max){
  const inputs = document.querySelectorAll(`input[name='${name}']`);
  inputs.forEach(i=>i.addEventListener("change",()=>{
    const checked = Array.from(inputs).filter(x=>x.checked);
    if(checked.length>max){i.checked=false;}
  }));
}
limitSelection("Vegetables",3);
limitSelection("Extras",2);

const nextBtn = document.getElementById("nextBtn");
const checkoutBtn = document.getElementById("checkoutBtn");
const orderForm = document.getElementById("orderForm");

function calculatePrice(){
  let base = mealCount===10?planData[plan].price10:planData[plan].price5;
  const protein = document.querySelector("input[name='Protein']:checked");
  const extras = document.querySelectorAll("input[name='Extras']:checked");
  if(protein){
    const extraPrices = {"Steak":3.5,"Salmon":3.5,"Shrimp":2,"Bison":2,"Carnitas":2};
    base += (extraPrices[protein.value]||0) * (mealCount===10?mealCount/2:mealCount);
  }
  extras.forEach(e=>{base+=1.5*(mealCount===10?mealCount/2:mealCount);});
  return base;
}

// Validate selection (works for Next and Checkout)
function validateForm(){
  let valid=true;
  ["Protein","Vegetables"].forEach(name=>{
    const field=document.querySelectorAll(`input[name='${name}']`);
    const anyChecked = Array.from(field).some(i=>i.checked);
    if(!anyChecked){
      field.forEach(i=>i.classList.add("invalid"));
      field[0].scrollIntoView({behavior:"smooth", block:"center"});
      valid=false;
    } else field.forEach(i=>i.classList.remove("invalid"));
  });
  return valid;
}

// Save combination
function saveCombination(){
  const combo = {};
  ["Protein","Vegetables","Carbohydrates","Extras"].forEach(name=>{
    const field = document.querySelectorAll(`input[name='${name}']:checked`);
    combo[name] = Array.from(field).map(i=>i.value);
  });

  // Always assign by index (clean + reliable)
  orders[currentCombo - 1] = combo;
}

// NEXT button
nextBtn.addEventListener("click",()=>{
  if(!validateForm()) return;
  saveCombination();
  currentCombo++;
  orderForm.reset();
  updateComboTitle();
  window.scrollTo({ top: orderForm.offsetTop, behavior: "smooth" });
});

// CHECKOUT button
checkoutBtn.addEventListener("click", () => {
  if(!validateForm()) return;
  saveCombination();
  sessionStorage.setItem("orders", JSON.stringify(orders));
  sessionStorage.setItem("mealCount", mealCount);
  sessionStorage.setItem("plan", plan);
  sessionStorage.setItem("planData", JSON.stringify(planData));
  window.location.href = "checkout_page.html";
});

// Checkout Modal stuff (unchanged)
const checkoutModal = document.getElementById("checkoutModal");
const checkoutForm = document.getElementById("checkoutForm");
const receiptEl = document.getElementById("receipt");

function showCheckout(){
  let subtotal = calculatePrice();
  receiptEl.innerHTML="";
  orders.forEach((c,i)=>{
    receiptEl.innerHTML+=`<b>Combo ${i+1}:</b><br>`;
    for(const key in c){
      if(c[key].length>0) receiptEl.innerHTML+=`${key}: ${c[key].join(", ")}<br>`;
    }
    receiptEl.innerHTML+="<br>";
  });
  let tax = subtotal*0.075;
  receiptEl.innerHTML+=`Subtotal: $${subtotal.toFixed(2)}<br>`;
  receiptEl.innerHTML+=`Taxes (+7.5%): $${tax.toFixed(2)}<br>`;
  receiptEl.innerHTML+=`<b>Total: $${(subtotal+tax).toFixed(2)}</b>`;
  checkoutModal.style.display="flex";
}

checkoutForm.addEventListener("submit",e=>{
  e.preventDefault();
  let allFilled=true;
  ["cName","cAddress","cPhone","cEmail"].forEach(id=>{
    const el=document.getElementById(id);
    if(!el.value.trim()){el.classList.add("invalid"); el.scrollIntoView({behavior:"smooth", block:"center"}); allFilled=false;}
    else el.classList.remove("invalid");
  });
  if(allFilled) alert("Order placed successfully! (Payment functionality placeholder)");
});

window.onclick = e=>{if(e.target===checkoutModal) checkoutModal.style.display="none";};

// CENTER modal utility
function centerModal(modal){
  if(!modal) return;
  modal.style.display = "flex";
  modal.style.justifyContent = "center";
  modal.style.alignItems = "center";
}

// Show meal count modal (5 or 10 meals)
centerModal(mealCountModal);

// Show combination modal (for 10 meals)
function showCombinationModal(){
  combinationModal.style.display = "flex";
  centerModal(combinationModal);
}
