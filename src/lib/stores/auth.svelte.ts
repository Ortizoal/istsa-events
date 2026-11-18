import { backend, hasFirebaseConfig } from '#lib/data';
import type { UserProfile } from '#lib/types';
import type { SignUpInput } from '#lib/data';

/**
 * Global auth state for the app. Call `auth.init()` once (in the root layout)
 * to subscribe to backend auth changes.
 */
class AuthStore {
	user = $state<UserProfile | null>(null);
	loading = $state(true);

	private started = false;

	init(): void {
		if (this.started || typeof window === 'undefined') return;
		if (!hasFirebaseConfig) {
			this.loading = false;
			return;
		}
		this.started = true;
		backend().onAuthChange((user) => {
			this.user = user;
			this.loading = false;
		});
	}

	get isStaff(): boolean {
		return this.user?.role === 'officer' || this.user?.role === 'admin';
	}

	async signIn(email: string, password: string): Promise<UserProfile> {
		const user = await backend().signIn(email, password);
		this.user = user;
		return user;
	}

	async signInWithGoogle(): Promise<UserProfile> {
		const user = await backend().signInWithGoogle();
		this.user = user;
		return user;
	}

	async signUp(input: SignUpInput): Promise<UserProfile> {
		const user = await backend().signUp(input);
		this.user = user;
		return user;
	}

	async signOut(): Promise<void> {
		await backend().signOut();
		this.user = null;
	}

	async resetPassword(email: string): Promise<void> {
		await backend().resetPassword(email);
	}
}

export const auth = new AuthStore();
