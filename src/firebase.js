// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// #cspell:disable
const firebaseConfig = {
  apiKey: "AIzaSyC3wzDclGKqIunBCWrkHatSx0JZDVpb-fA",
  authDomain: "khampor-dorm.firebaseapp.com",
  projectId: "khampor-dorm",
  storageBucket: "khampor-dorm.firebasestorage.app",
  messagingSenderId: "607409168118",
  appId: "1:607409168118:web:125ef77fe897aee8ffd6d7",
  measurementId: "G-69NM3LLEBW",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Export the initialized app and analytics for use in other parts of the application
export { app, analytics, db, auth, googleProvider };
