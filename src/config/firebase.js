import { getApp, getApps, initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import {
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
  getFirestore,
} from 'firebase/firestore'
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions'
import { connectStorageEmulator, getStorage } from 'firebase/storage'

import { getEmulatorHost, isFirebaseEmulatorsEnabled } from '@/config/emulatorHost'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

function createFirebaseApp() {
  if (getApps().length > 0) return getApp()
  return initializeApp(firebaseConfig)
}

const app = createFirebaseApp()

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(
  app,
  import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'asia-south1',
)

const AUTH_PORT = 9099
const FIRESTORE_PORT = 8080
const FUNCTIONS_PORT = 5001
const STORAGE_PORT = 9199

let emulatorsConnected = false

function connectFirebaseEmulators() {
  if (!isFirebaseEmulatorsEnabled() || emulatorsConnected) return

  const host = getEmulatorHost()

  connectAuthEmulator(auth, `http://${host}:${AUTH_PORT}`, { disableWarnings: true })
  connectFirestoreEmulator(db, host, FIRESTORE_PORT)
  connectFunctionsEmulator(functions, host, FUNCTIONS_PORT)
  connectStorageEmulator(storage, host, STORAGE_PORT)

  emulatorsConnected = true

  if (import.meta.env.DEV) {
    console.info(
      `[Firebase] Admin panel → emulators at ${host} (auth:${AUTH_PORT}, firestore:${FIRESTORE_PORT}, functions:${FUNCTIONS_PORT})`,
    )
  }
}

connectFirebaseEmulators()

if (!isFirebaseEmulatorsEnabled()) {
  enableIndexedDbPersistence(db).catch(() => {
    // best effort; ignore (multi-tab, unsupported browser, etc.)
  })
}
