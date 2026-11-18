import { hasFirebaseConfig } from '#lib/firebase/client';
import type { Backend } from './backend';
import { createFirebaseBackend } from './firebase';

let instance: Backend | null = null;

/** The app runs on Firebase. Throws a clear error when it is not configured. */
export function backend(): Backend {
	if (!hasFirebaseConfig) {
		throw new Error('Firebase is not configured. Add PUBLIC_FIREBASE_* to your .env.local.');
	}
	if (!instance) instance = createFirebaseBackend();
	return instance;
}

export { hasFirebaseConfig };
export type { Backend, SignUpInput } from './backend';
