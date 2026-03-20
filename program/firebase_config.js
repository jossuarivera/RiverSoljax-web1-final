// firebase_config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAeWIeUjm1lXcTjU5moe00AiPrA3btxDyk",
  authDomain: "riversoljax-orders.firebaseapp.com",
  projectId: "riversoljax-orders",
  storageBucket: "riversoljax-orders.appspot.com",
  messagingSenderId: "213018307746",
  appId: "1:213018307746:web:78758950ad5f66baff7bfb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ NOW it's safe to use app
export const db = getFirestore(app);
export const auth = getAuth(app);