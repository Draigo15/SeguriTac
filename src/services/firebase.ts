// src/services/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuración directa (sin .env)
const firebaseConfig = {
  apiKey: 'AIzaSyBI5Jwmt5CoT02LhuoHvHIxMQl3S9yMgSA',
  authDomain: 'seguritacapp.firebaseapp.com',
  projectId: 'seguritacapp',
  storageBucket: 'seguritacapp.appspot.com',
  messagingSenderId: '361203563970',
  appId: '1:361203563970:android:b59da781c8ef1142f7aa5b',
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Auth y Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
