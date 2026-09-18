// Firebase Config for Urban Hair App (Project: urbanhairapp-ec379)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  orderBy,
  onSnapshot, 
  addDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBmaGSXcusZajs9nYSykZWvWsBchJAPLDk",
  authDomain: "urbanhairapp-ec379.firebaseapp.com",
  projectId: "urbanhairapp-ec379",
  storageBucket: "urbanhairapp-ec379.firebasestorage.app",
  messagingSenderId: "384594800620",
  appId: "1:384594800620:web:0dc5a693aa12174fa59ac9",
  measurementId: "G-BSP4YWHYBX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Auth Providers
const googleProvider = new GoogleAuthProvider();

export { 
  app, 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  signOut, 
  onAuthStateChanged,
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  orderBy,
  onSnapshot, 
  addDoc, 
  serverTimestamp 
};
