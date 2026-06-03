import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAgSdYkVTP_V-CJ32ihUNozax2x5jx8ZHs",
  authDomain: "missio-lite.firebaseapp.com",
  projectId: "missio-lite",
  storageBucket: "missio-lite.firebasestorage.app",
  messagingSenderId: "944973973762",
  appId: "1:944973973762:web:0a7c63e667908b71dc1a1b",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
