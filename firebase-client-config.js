// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAt21D0noGhWI9KoqiAV7hSF1c2m-7z4vw",
  authDomain: "e-commerce-website-7f378.firebaseapp.com",
  projectId: "e-commerce-website-7f378",
  storageBucket: "e-commerce-website-7f378.firebasestorage.app",
  messagingSenderId: "890458176135",
  appId: "1:890458176135:web:f69ef889179feaf30d5622",
  measurementId: "G-2Q9K0TMX2V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);