import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// These values identify the project, they are not secrets: every web client
// receives them. Access is controlled by the Firestore rules in firestore.rules.
const firebaseConfig = {
  apiKey: 'AIzaSyBZ7Mg4osp-q8HFB-NP2g2pdDpcYTcTkfE',
  authDomain: 'invoice-generator-7978a.firebaseapp.com',
  projectId: 'invoice-generator-7978a',
  storageBucket: 'invoice-generator-7978a.firebasestorage.app',
  messagingSenderId: '769665795989',
  appId: '1:769665795989:web:1043123a35c5b37a5a589c',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
