const uploadBtnCard = document.getElementById("uploadBtn");

// Modals
const contactChoiceModal = document.getElementById("contactChoiceModal");
const infoModal = document.getElementById("infoModal");
const importantModal = document.getElementById("importantModal");
const uploadModal = document.getElementById("uploadModal");
const closeButtons = document.querySelectorAll(".closeModal");

// Inputs & buttons
const contactOptions = document.querySelectorAll(".contactOption");
const clientName = document.getElementById("clientName");
const clientPhone = document.getElementById("clientPhone");
const clientEmail = document.getElementById("clientEmail");
const doneInfo = document.getElementById("doneInfo");
const missingInfo = document.getElementById("missingInfo");

const agreeCheckbox = document.getElementById("agreeCheckbox");
const agreeBtn = document.getElementById("agreeBtn");

const planFile = document.getElementById("planFile");
const fileLabel = document.getElementById("fileLabel");
const submitUpload = document.getElementById("submitUpload");

const mealCards = document.querySelectorAll(".select_your_meal_plan .meal_card");

function showModal(modal){modal.style.display="block";modal.querySelector(".modal-content").style.animation="slideDown 0.3s forwards";}
function closeModal(modal){modal.style.display="none";}

// Start: Click upload
uploadBtnCard.onclick = () => showModal(contactChoiceModal);

// Step 1: choose contact method
contactOptions.forEach(option => {
  option.onclick = () => {
    const type = option.dataset.type;
    closeModal(contactChoiceModal);

    clientName.value="";
    clientPhone.value="";
    clientEmail.value="";
    doneInfo.disabled=true;
    missingInfo.style.display="none";

    clientName.style.display="block";
    clientPhone.style.display=(type==="phone")?"block":"none";
    clientEmail.style.display=(type==="email")?"block":"none";

    showModal(infoModal);
  };
});

// Close button (X)
closeButtons.forEach(btn=>{
  btn.addEventListener("click", ()=>{
    btn.closest(".modal").style.display="none";
  });
});

// Phone input formatting
clientPhone.addEventListener("input",(e)=>{
  let x=e.target.value.replace(/\D/g,'').substring(0,10);
  let formatted="";
  if(x.length>0) formatted="("+x.substring(0,3);
  if(x.length>=4) formatted+=") "+x.substring(3,6);
  if(x.length>=7) formatted+="-"+x.substring(6,10);
  e.target.value=formatted;
});

// Step 2: validate info before Done
function validateInfo(){
  let valid = clientName.value.trim();
  if(clientPhone.style.display!=="none") valid = valid && clientPhone.value.trim().length===14;
  if(clientEmail.style.display!=="none") valid = valid && clientEmail.value.trim();
  doneInfo.disabled = !valid;
  missingInfo.style.display = valid ? "none" : "block";
}
clientName.addEventListener("input",validateInfo);
clientPhone.addEventListener("input",validateInfo);
clientEmail.addEventListener("input",validateInfo);

// Done -> IMPORTANT modal
doneInfo.onclick = ()=>{
  closeModal(infoModal);
  showModal(importantModal);
};

// Step 3: IMPORTANT checkbox
agreeCheckbox.addEventListener("change", ()=>{
  agreeBtn.style.display=agreeCheckbox.checked?"inline-block":"none";
});

// Continue -> Upload modal
agreeBtn.onclick = ()=>{
  closeModal(importantModal);
  showModal(uploadModal);
};

// Step 4: file selection
planFile.addEventListener("change",()=>{
  if(planFile.files.length>0){
    fileLabel.textContent=planFile.files[0].name;
    submitUpload.disabled=false;
  }
});

// Meal cards redirect
mealCards.forEach(card=>{
  card.addEventListener("click", ()=>{
    const planName=card.querySelector("h3").textContent.trim();
    if(planName!=="Upload Your Plan"){
      sessionStorage.setItem("selectedPlan",planName);
      window.location.href="order_page.html";
    }
  });
});

// Close modals if click outside
window.onclick = (e)=>{
  if(e.target==contactChoiceModal) closeModal(contactChoiceModal);
  if(e.target==infoModal) closeModal(infoModal);
  if(e.target==importantModal) closeModal(importantModal);
  if(e.target==uploadModal) closeModal(uploadModal);
};