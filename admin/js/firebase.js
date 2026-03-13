// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAbbbtdZDoWWdWx8gZD5pTqme4zNtn5I6Q",
  authDomain: "hmwaffle-60e3e.firebaseapp.com",
  databaseURL: "https://hmwaffle-60e3e-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "hmwaffle-60e3e",
  storageBucket: "hmwaffle-60e3e.firebasestorage.app",
  messagingSenderId: "566279108076",
  appId: "1:566279108076:web:7f6e8247de4c68f73bbcc9",
  measurementId: "G-4KL5XBC9TD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

export { db, auth };
