// Configuración de Firebase
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuración de Firebase (usar variables de entorno en producción)
const firebaseConfig = {
  apiKey: "AIzaSyDummyApiKey",
  authDomain: "seguridad-ciudadana-app.firebaseapp.com",
  projectId: "seguridad-ciudadana-app",
  storageBucket: "seguridad-ciudadana-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

export { auth, firestore };