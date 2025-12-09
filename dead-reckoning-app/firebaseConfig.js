// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// Paste your web config here from Firebase console

const API_KEY = "AIzaSyDlmOku4o03rkMykR2jgCgVbU4L8Lds8_U";

const firebaseConfig = {
  apiKey: API_KEY,
  authDomain: "track-predict-app.firebaseapp.com",
  projectId: "track-predict-app",
  // ...other fields
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc };
