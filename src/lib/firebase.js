import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBECAkuOnZqJsm4M4PN7ePq9CRebWSNEPk",
  authDomain: "firstone-617ac.firebaseapp.com",
  databaseURL: "https://firstone-617ac-default-rtdb.firebaseio.com",
  projectId: "firstone-617ac",
  storageBucket: "firstone-617ac.firebasestorage.app",
  messagingSenderId: "47737253613",
  appId: "1:47737253613:web:1126be8f15a2470cb266e4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
