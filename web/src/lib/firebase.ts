import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const missingFirebaseEnvVars = [
  !firebaseConfig.apiKey && 'NEXT_PUBLIC_FIREBASE_API_KEY',
  !firebaseConfig.authDomain && 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  !firebaseConfig.projectId && 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  !firebaseConfig.storageBucket && 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  !firebaseConfig.messagingSenderId && 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  !firebaseConfig.appId && 'NEXT_PUBLIC_FIREBASE_APP_ID',
].filter(Boolean) as string[];

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

function parseEmulatorHost(hostValue: string | undefined, fallbackHost: string, fallbackPort: number) {
  if (!hostValue) {
    return { host: fallbackHost, port: fallbackPort, url: `http://${fallbackHost}:${fallbackPort}` };
  }

  const normalized = hostValue.startsWith('http') ? new URL(hostValue) : new URL(`http://${hostValue}`);
  const host = normalized.hostname || fallbackHost;
  const port = normalized.port ? Number(normalized.port) : fallbackPort;

  return {
    host,
    port,
    url: `${normalized.protocol}//${host}:${port}`,
  };
}

// Guard against missing env vars during Next.js SSR/build prerendering
if (missingFirebaseEnvVars.length === 0) {
  try {
    const isNewApp = getApps().length === 0;
    app = isNewApp ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);

    // Connect to local emulators when running QA tests.
    // Only on first init to avoid "already connected" errors from HMR.
    if (isNewApp && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
      const authEmulator = parseEmulatorHost(
        process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST ?? process.env.FIREBASE_AUTH_EMULATOR_HOST,
        '127.0.0.1',
        9099,
      );
      const firestoreEmulator = parseEmulatorHost(
        process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST ?? process.env.FIRESTORE_EMULATOR_HOST,
        '127.0.0.1',
        8080,
      );

      connectAuthEmulator(auth, authEmulator.url, { disableWarnings: true });
      connectFirestoreEmulator(db, firestoreEmulator.host, firestoreEmulator.port);
    }
  } catch (e) {
    console.error('Firebase initialization error:', e);
  }
} else if (typeof window !== 'undefined') {
  console.error(
    `Firebase is not configured. Missing env vars: ${missingFirebaseEnvVars.join(', ')}`
  );
}

export { auth, db, missingFirebaseEnvVars };
