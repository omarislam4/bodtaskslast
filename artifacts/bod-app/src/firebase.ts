import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDnyNmiFFdvJHWJydZ4K61z0FKEPfj-Fpc",
  authDomain: "birth-21c5c.firebaseapp.com",
  projectId: "birth-21c5c",
  storageBucket: "birth-21c5c.firebasestorage.app",
  messagingSenderId: "444980894945",
  appId: "1:444980894945:web:f936d483a89632d665aba0",
  measurementId: "G-QNVE5DFKEB"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
