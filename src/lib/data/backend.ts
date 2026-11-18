import type {
	EventDoc,
	EventInput,
	EventStatus,
	RegistrationDoc,
	RegistrationInput,
	RegistrationStatus,
	Role,
	UserProfile
} from '#lib/types';

export interface SignUpInput {
	email: string;
	password: string;
	displayName: string;
	program: string;
	studentId: string;
	phone: string;
}

/**
 * The data contract the whole app codes against. Two implementations exist:
 * `firebase` (Firestore + Firebase Auth) and `local` (browser storage, for demos).
 */
export interface Backend {
	mode: 'firebase' | 'local';

	// ---- auth ----
	onAuthChange(cb: (user: UserProfile | null) => void): () => void;
	signUp(input: SignUpInput): Promise<UserProfile>;
	signIn(email: string, password: string): Promise<UserProfile>;
	signInWithGoogle(): Promise<UserProfile>;
	signOut(): Promise<void>;
	resetPassword(email: string): Promise<void>;
	updateProfile(uid: string, patch: Partial<UserProfile>): Promise<void>;

	// ---- events ----
	listPublishedEvents(): Promise<EventDoc[]>;
	listEventsByHost(uid: string): Promise<EventDoc[]>;
	getEventBySlug(slug: string): Promise<EventDoc | null>;
	getEventById(id: string): Promise<EventDoc | null>;
	createEvent(input: EventInput, user: UserProfile): Promise<EventDoc>;
	updateEvent(id: string, input: EventInput, user: UserProfile): Promise<void>;
	setEventStatus(id: string, status: EventStatus): Promise<void>;
	deleteEvent(id: string): Promise<void>;

	// ---- registrations ----
	register(event: EventDoc, input: RegistrationInput, user: UserProfile): Promise<RegistrationDoc>;
	listRegistrationsByUser(uid: string): Promise<RegistrationDoc[]>;
	listRegistrationsForEvent(eventId: string): Promise<RegistrationDoc[]>;
	getRegistration(id: string): Promise<RegistrationDoc | null>;
	setRegistrationStatus(
		id: string,
		status: RegistrationStatus,
		actor: UserProfile
	): Promise<void>;
	checkIn(id: string, actor: UserProfile): Promise<RegistrationDoc>;
	checkInByToken(eventId: string, token: string, actor: UserProfile): Promise<RegistrationDoc>;
	undoCheckIn(id: string): Promise<void>;
	cancelRegistration(id: string): Promise<void>;

	// ---- users (admin) ----
	listUsers(): Promise<UserProfile[]>;
	getUser(uid: string): Promise<UserProfile | null>;
	setUserRole(uid: string, role: Role): Promise<void>;
}
