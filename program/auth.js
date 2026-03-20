import { auth } from './firebase_config.js';
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";

const overlay = document.getElementById("login-overlay");
const emailInput = document.getElementById("login-email");
const passwordInput = document.getElementById("login-password");
const loginBtn = document.getElementById("login-btn");
const errorText = document.getElementById("login-error");

// LOGIN CLICK
loginBtn.onclick = async () => {
  const email = emailInput.value;
  const password = passwordInput.value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    errorText.textContent = "";
  } catch (err) {
    errorText.textContent = "Invalid login";
  }
};

// CHECK IF LOGGED IN
onAuthStateChanged(auth, (user) => {
  if (user) {
    overlay.style.display = "none"; // ✅ unlock page
  } else {
    overlay.style.display = "flex"; // 🔒 keep locked
  }
});