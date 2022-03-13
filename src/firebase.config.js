import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore'



// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCyLZkgcOpR1ntBuAK4Z9GVK1iNYz_FnnY",
  authDomain: "car-marketplace-b28d3.firebaseapp.com",
  projectId: "car-marketplace-b28d3",
  storageBucket: "car-marketplace-b28d3.appspot.com",
  messagingSenderId: "253231152996",
  appId: "1:253231152996:web:c7b033399146d9f741c471"
};

// Initialize Firebase
initializeApp(firebaseConfig);

export const db = getFirestore()