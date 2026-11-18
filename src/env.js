/** Declares the public environment variables that SvelteKit exposes to the client. */
export const variables = {
	PUBLIC_FIREBASE_API_KEY: { public: true, static: false },
	PUBLIC_FIREBASE_AUTH_DOMAIN: { public: true, static: false },
	PUBLIC_FIREBASE_PROJECT_ID: { public: true, static: false },
	PUBLIC_FIREBASE_STORAGE_BUCKET: { public: true, static: false },
	PUBLIC_FIREBASE_MESSAGING_SENDER_ID: { public: true, static: false },
	PUBLIC_FIREBASE_APP_ID: { public: true, static: false },
	PUBLIC_SUPER_ADMIN_EMAILS: { public: true, static: false },
};
