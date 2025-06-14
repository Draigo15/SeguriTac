import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuración de Firebase
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

// Auth sin persistencia personalizada (Expo Go no la soporta)
export const auth = getAuth(app);

// Firestore
export const db = getFirestore(app);
