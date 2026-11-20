import { initializeApp, getApps, getApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc
} from 'firebase/firestore';
import type {
  Firestore,
  CollectionReference,
  DocumentReference
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import type { FirebaseStorage } from 'firebase/storage';

// Production Firebase Configuration for Upstage Hospital ERP
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB2lSQ1w-ScVufiZWafVHj90ZRHHUxxRiM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "hospital-bf28e.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "hospital-bf28e",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "hospital-bf28e.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "279046839743",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:279046839743:web:145ba4ebe291856a1a550a"
};

// Singleton initialization with Lazy Initialization Proxies
// Prevents Vite module evaluation race conditions ("Component auth has not been registered yet")
export const getFirebaseApp = (): FirebaseApp => {
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
};

export const getFirebaseAuth = (): Auth => {
  return getAuth(getFirebaseApp());
};

export const getFirebaseDb = (): Firestore => {
  return getFirestore(getFirebaseApp());
};

export const getFirebaseStorage = (): FirebaseStorage => {
  return getStorage(getFirebaseApp());
};

let _appInstance: FirebaseApp | undefined;
export const app: FirebaseApp = new Proxy({} as FirebaseApp, {
  get(_target, prop) {
    if (!_appInstance) _appInstance = getFirebaseApp();
    const val = (_appInstance as any)[prop];
    return typeof val === 'function' ? val.bind(_appInstance) : val;
  }
});

let _authInstance: Auth | undefined;
export const auth: Auth = new Proxy({} as Auth, {
  get(_target, prop) {
    if (!_authInstance) _authInstance = getFirebaseAuth();
    const val = (_authInstance as any)[prop];
    return typeof val === 'function' ? val.bind(_authInstance) : val;
  }
});

let _dbInstance: Firestore | undefined;
export const db: Firestore = new Proxy({} as Firestore, {
  get(_target, prop) {
    if (!_dbInstance) _dbInstance = getFirebaseDb();
    const val = (_dbInstance as any)[prop];
    return typeof val === 'function' ? val.bind(_dbInstance) : val;
  }
});

let _storageInstance: FirebaseStorage | undefined;
export const storage: FirebaseStorage = new Proxy({} as FirebaseStorage, {
  get(_target, prop) {
    if (!_storageInstance) _storageInstance = getFirebaseStorage();
    const val = (_storageInstance as any)[prop];
    return typeof val === 'function' ? val.bind(_storageInstance) : val;
  }
});

// Multi-Tenant Hospital Architecture Reference Helpers
// Base User Reference: users/{uid}
export const getUserDocRef = (uid: string): DocumentReference => {
  return doc(getFirebaseDb(), 'users', uid);
};

export const getUsersCollectionRef = (): CollectionReference => {
  return collection(getFirebaseDb(), 'users');
};

// Base Hospital Reference: hospitals/{hospitalId}
export const getHospitalDocRef = (hospitalId: string): DocumentReference => {
  return doc(getFirebaseDb(), 'hospitals', hospitalId);
};

export const getHospitalsCollectionRef = (): CollectionReference => {
  return collection(getFirebaseDb(), 'hospitals');
};

// Subcollection Helpers: hospitals/{hospitalId}/{subcollection}
export const getHospitalSubcollectionRef = (
  hospitalId: string,
  subCollectionName: string
): CollectionReference => {
  return collection(getFirebaseDb(), 'hospitals', hospitalId, subCollectionName);
};

export const getHospitalSubdocRef = (
  hospitalId: string,
  subCollectionName: string,
  documentId: string
): DocumentReference => {
  return doc(getFirebaseDb(), 'hospitals', hospitalId, subCollectionName, documentId);
};
