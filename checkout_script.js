// --- IMPORT FIRESTORE ---
import { db } from "./program/firebase_config.js"; 
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

// Elements
const pickupDeliveryModal = document.getElementById("pickupDeliveryModal");
const pickupBtn = document.getElementById("pickupBtn");
const deliveryBtn = document.getElementById("deliveryBtn");
const mapContainer = document.getElementById("mapContainer");
const addressContainer = document.getElementById("addressContainer");
const deliveryTimeContainer = document.getElementById("deliveryTimeContainer");
const checkoutForm = document.getElementById("checkoutForm");
const receiptEl = document.getElementById("receipt");
const payNowBtn = document.getElementById("payNowBtn");
const rangeMsg = document.getElementById("rangeMsg");

// Input fields
const cName = document.getElementById("cName");
const cEmail = document.getElementById("cEmail");
const cPhone = document.getElementById("cPhone");
const cAddress = document.getElementById("cAddress");
const cStreet = document.getElementById("cStreet");
const cCity = document.getElementById("cCity");
const cState = document.getElementById("cState");
const cZip = document.getElementById("cZip");
const deliveryTime = document.getElementById("deliveryTime");

// Orders & plan data
const orders = JSON.parse(sessionStorage.getItem("orders") || "[]");
const mealCount = parseInt(sessionStorage.getItem("mealCount") || "0");
const plan = sessionStorage.getItem("plan") || "";
const planData = JSON.parse(sessionStorage.getItem("planData") || "{}");

// Food truck data
const foodTruckAddress = "Riversoljax Food Truck, 8350 Baymeadows Rd, Jacksonville, FL 32256";
const foodTruckCoords = { lat: 30.2203, lng: -81.5856 };
const maxDeliveryMiles = 10;

// Map links
const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(foodTruckAddress)}`;
const appleMapsLink = `https://maps.apple.com/?q=${encodeURIComponent(foodTruckAddress)}`;

// Device check
function isAppleDevice(){ return /iPhone|iPad|iPod/.test(navigator.userAgent); }

// --- SHOW ADDRESS MODAL ---
function showAddress(type) {
    pickupDeliveryModal.style.display = "none";
    const locationHTML = `<span class="location_icon"><i class="fa fa-map-marker"></i></span>
    <a href="${isAppleDevice() ? 'javascript:void(0)' : googleMapsLink}" target="_blank" id="addressLink">${foodTruckAddress}</a>`;

    if(type==="Pickup"){
        addressContainer.style.display="none";
        deliveryTimeContainer.style.display="none";
        mapContainer.innerHTML = `<p style="margin-bottom:0.5rem;">Food Truck Location:</p>
        <div class="address_display">${locationHTML}</div>
        <div class="schedule_box"><b>Schedule</b><br><br>
        Sunday — 6:30am - 11:00am<br>
        Monday — 6:30am - 3pm<br>
        Tuesday — 6:30am - 3pm<br>
        Wednesday — 6:30am - 3pm<br>
        Thursday — 7am - 3pm<br>
        Friday — 7am - 3pm<br>
        Saturday — Closed
        </div>`;
    } else {
        addressContainer.style.display="block";
        deliveryTimeContainer.style.display="block";
        mapContainer.innerHTML = `<p style="margin-bottom:0.5rem;">Delivery available within 10 miles of:</p>
        <div class="address_display">${locationHTML}</div>`;
    }

    if(isAppleDevice()){
        const addressLinkEl = document.getElementById("addressLink");
        addressLinkEl.addEventListener("click",(e)=>{
            e.preventDefault();
            const oldModal = document.getElementById("mapChoiceModal");
            if(oldModal) oldModal.remove();
            const modalHTML = document.createElement("div");
            modalHTML.id = "mapChoiceModal";
            modalHTML.style.position = "fixed";
            modalHTML.style.top = "0";
            modalHTML.style.left = "0";
            modalHTML.style.width = "100%";
            modalHTML.style.height = "100%";
            modalHTML.style.background = "rgba(0,0,0,0.5)";
            modalHTML.style.display = "flex";
            modalHTML.style.justifyContent = "center";
            modalHTML.style.alignItems = "center";
            modalHTML.style.zIndex = "9999";

            modalHTML.innerHTML=`
            <div style="background:white;padding:1.8rem 2rem;border-radius:16px;text-align:center;max-width:300px;width:90%;box-shadow:0 10px 30px rgba(0,0,0,0.2);position:relative;">
                <span id="closeMapModal" style="position:absolute;top:10px;right:14px;font-size:20px;font-weight:700;cursor:pointer;">×</span>
                <p style="font-weight:600;margin-bottom:1rem;font-size:1rem;">Open in:</p>
                <button id="openAppleMaps" style="padding:0.8rem 1.2rem;margin:0.5rem;width:100%;border:none;border-radius:12px;background:#e5e5e5;color:black;font-weight:600;font-size:1rem;cursor:pointer;">Apple Maps</button>
                <button id="openGoogleMaps" style="padding:0.8rem 1.2rem;margin:0.5rem;width:100%;border:none;border-radius:12px;background:#e5e5e5;color:black;font-weight:600;font-size:1rem;cursor:pointer;">Google Maps</button>
            </div>`;
            document.body.appendChild(modalHTML);
            document.getElementById("openAppleMaps").addEventListener("click",()=>{window.open(appleMapsLink,"_blank"); modalHTML.remove();});
            document.getElementById("openGoogleMaps").addEventListener("click",()=>{window.open(googleMapsLink,"_blank"); modalHTML.remove();});
            document.getElementById("closeMapModal").addEventListener("click",()=>{modalHTML.remove();});
        });
    }

    checkoutForm.dataset.type = type;
    renderReceipt();

    if(type === "Pickup"){
    addressContainer.style.display = "none";
    deliveryTimeContainer.style.display = "none";

    // ❗ REMOVE required for pickup
    cStreet.required = false;
    cCity.required = false;
    cState.required = false;
    cZip.required = false;
    deliveryTime.required = false;

} else {
    addressContainer.style.display = "block";
    deliveryTimeContainer.style.display = "block";

    // ❗ ADD required for delivery
    cStreet.required = true;
    cCity.required = true;
    cState.required = true;
    cZip.required = true;
    deliveryTime.required = true;
}
}

// --- INIT ---
window.onload = () => pickupDeliveryModal.style.display="flex";
pickupBtn.addEventListener("click",()=>showAddress("Pickup"));
deliveryBtn.addEventListener("click",()=>showAddress("Delivery"));

// --- DISTANCE CALCULATION ---
function getDistanceMiles(lat1, lon1, lat2, lon2){
    const R=3958.8;
    const dLat=(lat2-lat1)*Math.PI/180;
    const dLon=(lon2-lon1)*Math.PI/180;
    const a=Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R*c;
}

// --- DELIVERY RANGE CHECK ---
let addressTimer;
[cAddress, cStreet, cCity, cState, cZip].forEach(input=>{
    if(!input) return;
    input.addEventListener("input",()=>{
        clearTimeout(addressTimer);
        addressTimer = setTimeout(checkDeliveryRange,800);
    });
});

cAddress.addEventListener("paste",()=>{
    setTimeout(async ()=>{
        const address = cAddress.value.trim();
        if(address.length < 6) return;
        try{
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(address)}`);
            const data = await res.json();
            if(!data.length) return;
            const addr = data[0].address;
            const street = (addr.house_number?addr.house_number+" ":"")+(addr.road||"");
            const city = addr.city || addr.town || addr.village || "";
            const state = addr.state || "";
            const zip = addr.postcode || "";
            if(cStreet) cStreet.value = street;
            if(cCity) cCity.value = city;
            if(cState) cState.value = state;
            if(cZip) cZip.value = zip;
            checkDeliveryRange();
        }catch(err){console.error(err);}
    },200);
});

async function checkDeliveryRange(){
    if(checkoutForm.dataset.type !== "Delivery") return;

    let address = cAddress.value.trim();
    if(!address){
        address = `${cStreet.value} ${cCity.value} ${cState.value} ${cZip.value}`.trim();
    }
    if(address.length<6){rangeMsg.style.display="none"; payNowBtn.disabled=false; return;}

    try{
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
        const data = await res.json();
        if(!data.length){rangeMsg.innerText="Address not found."; rangeMsg.style.color="red"; rangeMsg.style.display="block"; payNowBtn.disabled=true; return;}
        const lat=parseFloat(data[0].lat);
        const lon=parseFloat(data[0].lon);
        const distance=getDistanceMiles(foodTruckCoords.lat, foodTruckCoords.lng, lat, lon);
        if(distance>maxDeliveryMiles){
            rangeMsg.innerText="Outside the 10 mile delivery range.";
            rangeMsg.style.color="red";
            rangeMsg.style.display="block";
            payNowBtn.disabled=true;
        } else {
            rangeMsg.innerText="Delivery available ✓";
            rangeMsg.style.color="green";
            rangeMsg.style.display="block";
            payNowBtn.disabled=false;
        }
    }catch(err){console.error(err);}
}

// --- RENDER RECEIPT ---
function renderReceipt(){
    let subtotal = 0;
    receiptEl.innerHTML = `<p><b>Order Type:</b> ${checkoutForm.dataset.type}</p>
    <p><b>Plan:</b> ${plan}</p>
    <p><b>Meals:</b> ${mealCount}</p>
    <p><b>Combinations:</b> ${orders.length}</p><hr>`;
    orders.forEach((combo,i)=>{
        receiptEl.innerHTML += `<p><b>Combo ${i+1}</b><br>`;
        for(const key in combo){
            if(combo[key].length>0) receiptEl.innerHTML += `${key}: ${combo[key].join(", ")}<br>`;
            if(key==="Protein"){const extraPrices={Steak:3.5,Salmon:3.5,Shrimp:2,Bison:2,Carnitas:2};
                subtotal += combo[key].reduce((acc,val)=>acc+(extraPrices[val]||0),0)*(mealCount===10?mealCount/2:mealCount);}
            if(key==="Extras") subtotal += combo[key].length*1.5*(mealCount===10?mealCount/2:mealCount);
        }
        receiptEl.innerHTML+="</p>";
    });
    const basePrice = mealCount===10?planData[plan].price10:planData[plan].price5;
    subtotal += basePrice;
    const tax = subtotal*0.075;
    receiptEl.innerHTML += `<p>Subtotal: $${subtotal.toFixed(2)}</p><p>Taxes (+7.5%): $${tax.toFixed(2)}</p><p><b>Total: $${(subtotal+tax).toFixed(2)}</b></p>`;

    // Phone formatting
    cPhone.addEventListener("input",(e)=>{
        let x=e.target.value.replace(/\D/g,'').substring(0,10);
        let formatted="";
        if(x.length>0) formatted="("+x.substring(0,3);
        if(x.length>=4) formatted+=") "+x.substring(3,6);
        if(x.length>=7) formatted+="-"+x.substring(6,10);
        e.target.value=formatted;
    });
}

// --- FORM SUBMIT + FIRESTORE ---
checkoutForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Make sure only visible required fields are checked
    let allFilled = true;
    const requiredFields = [cName, cEmail, cPhone];
    if(checkoutForm.dataset.type === "Delivery"){
        requiredFields.push(cStreet, cCity, cState, cZip, document.getElementById("deliveryTime"));
    }
    requiredFields.forEach(el => {
        if(!el.value.trim() || (el === cPhone && el.value.trim().length !== 14)){
            el.classList.add("invalid");
            el.scrollIntoView({behavior:"smooth", block:"center"});
            allFilled = false;
        } else el.classList.remove("invalid");
    });
    if(!allFilled) return;

    // Calculate subtotal here
    let subtotal = 0;
    orders.forEach(combo=>{
        if(combo.Protein){
            const extraPrices = {Steak:3.5,Salmon:3.5,Shrimp:2,Bison:2,Carnitas:2};
            subtotal += combo.Protein.reduce((acc,val)=>acc+(extraPrices[val]||0),0)*(mealCount===10?mealCount/2:mealCount);
        }
        if(combo.Extras) subtotal += combo.Extras.length*1.5*(mealCount===10?mealCount/2:mealCount);
    });
    const basePrice = mealCount===10 ? planData[plan].price10 : planData[plan].price5;
    subtotal += basePrice;
    const tax = subtotal*0.075;

    // Prepare order object
    const orderData = {
        client: {
            name: cName.value.trim(),
            email: cEmail.value.trim(),
            phone: cPhone.value.trim(),
            type: checkoutForm.dataset.type,
            address: checkoutForm.dataset.type === "Delivery" ? {
                street: cStreet.value.trim(),
                city: cCity.value.trim(),
                state: cState.value.trim(),
                zip: cZip.value.trim(),
                notes: document.getElementById("cNotes").value.trim(),
                deliveryTime: document.getElementById("deliveryTime").value
            } : "N/A"
        },
        orders,
        plan,
        mealCount,
        subtotal,
        tax,
        total: subtotal + tax,
        timestamp: new Date().toISOString()
    };

    // Send to Firebase
    try {
        const { db } = await import("./program/firebase_config.js");
        const { collection, addDoc } = await import("https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js");
        await addDoc(collection(db, "orders"), orderData);
        alert("Order sent successfully!");
    } catch(err){
        console.error("Firebase error:", err);
        alert("Failed to send order. Check console.");
    }
});