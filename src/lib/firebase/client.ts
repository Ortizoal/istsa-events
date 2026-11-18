import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
	browserLocalPersistence,
	getAuth,
	GoogleAuthProvider,
	setPersistence,
	signInWithPopup,
	type Auth
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import {
	PUBLIC_FIREBASE_API_KEY,
	PUBLIC_FIREBASE_AUTH_DOMAIN,
	PUBLIC_FIREBASE_PROJECT_ID,
	PUBLIC_FIREBASE_STORAGE_BUCKET,
	PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	PUBLIC_FIREBASE_APP_ID,
	PUBLIC_SUPER_ADMIN_EMAILS
} from '$app/env/public';

/**
 * Firebase configuration is read from Vite-exposed `PUBLIC_*` env vars
 * (declared in `src/env.js`), so the same build runs configured (`.env.local`)
 * or shows a setup screen when empty.
 */
export const firebaseConfig = {
	apiKey: PUBLIC_FIREBASE_API_KEY,
	authDomain: PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	appId: PUBLIC_FIREBASE_APP_ID
};

/** True when a usable Firebase config is present. */
export const hasFirebaseConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

/** Emails that are always treated as admins (comma separated). */
export const superAdminEmails = (PUBLIC_SUPER_ADMIN_EMAILS ?? '')
	.split(',')
	.map((e: string) => e.trim().toLowerCase())
	.filter(Boolean);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

export function getFirebaseApp(): FirebaseApp {
	if (!hasFirebaseConfig) {
		throw new Error('Firebase is not configured. Add PUBLIC_FIREBASE_* to your .env.local');
	}
	if (!app) app = getApps().length ? getApp() : initializeApp(firebaseConfig);
	return app;
}

export function getFirebaseAuth(): Auth {
	if (!auth) {
		auth = getAuth(getFirebaseApp());
		void setPersistence(auth, browserLocalPersistence).catch(() => undefined);
	}
	return auth;
}

export function getDb(): Firestore {
	if (!db) db = getFirestore(getFirebaseApp());
	return db;
}

export function getStorageClient(): FirebaseStorage {
	if (!storage) storage = getStorage(getFirebaseApp());
	return storage;
}
