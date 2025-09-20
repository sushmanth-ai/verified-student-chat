
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyD3YY0d2EJyNhGCKGOplUgN1N2qFFh33KI",
  authDomain: "pushpa2-a5a90.firebaseapp.com",
  databaseURL: "https://pushpa2-a5a90-default-rtdb.firebaseio.com",
  projectId: "pushpa2-a5a90",
  storageBucket: "pushpa2-a5a90.firebasestorage.app",
  messagingSenderId: "960596526404",
  appId: "1:960596526404:web:9ab921a3e289573f288311",
  measurementId: "G-JE6ELX4ZM7"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Configure Google provider with additional settings
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Test Firebase Storage connection
export const testStorageConnection = async () => {
  try {
    const testRef = ref(storage, 'test/connection.txt');
    const testData = 'Firebase Storage connection test';
    await uploadString(testRef, testData);
    console.log('Firebase Storage connection successful');
    return true;
  } catch (error) {
    console.error('Firebase Storage connection failed:', error);
    return false;
  }
};