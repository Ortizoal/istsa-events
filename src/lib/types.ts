import type { Timestamp } from 'firebase/firestore';

/** A Firestore timestamp, an ISO string, or a JS Date depending on source. */
export type DateLike = Timestamp | string | Date | number | null | undefined;

export type Role = 'student' | 'officer' | 'admin';

export type EventStatus = 'draft' | 'published' | 'cancelled';

export type EventVisibility = 'public' | 'unlisted';

export type RegistrationStatus =
	| 'pending' // awaiting officer approval
	| 'approved' // confirmed, ticket issued
	| 'declined'
	| 'waitlisted' // event full, on the waitlist
	| 'cancelled'; // attendee cancelled

export type QuestionType =
	| 'short_text'
	| 'long_text'
	| 'single_choice'
	| 'multi_choice'
	| 'checkbox';

export interface EventQuestion {
	id: string;
	/** The prompt shown to the attendee. */
	label: string;
	type: QuestionType;
	required: boolean;
	/** Choices for `single_choice` and `multi_choice`. */
	options?: string[];
	/** Optional helper text shown under the field. */
	helpText?: string;
}

/** Account profile stored at `users/{uid}`. */
export interface UserProfile {
	uid: string;
	email: string;
	displayName: string;
	role: Role;
	program: string;
	studentId: string;
	phone: string;
	/** Optional avatar URL. */
	photoURL?: string;
	createdAt: DateLike;
	updatedAt: DateLike;
}

export interface EventDoc {
	id: string;
	/** URL-friendly identifier, unique across events. */
	slug: string;
	title: string;
	summary: string;
	description: string;
	coverUrl: string;
	hostName: string;
	hostUid: string;

	startsAt: DateLike;
	endsAt: DateLike;
	timezone: string;

	isOnline: boolean;
	venue: string;
	meetingUrl: string;

	capacity: number | null;
	waitlistEnabled: boolean;
	requiresApproval: boolean;

	status: EventStatus;
	visibility: EventVisibility;
	allowGuests: boolean;

	questions: EventQuestion[];

	/** Denormalised counters kept in sync by the data layer. */
	registrationCount: number;
	approvedCount: number;
	checkedInCount: number;

	createdAt: DateLike;
	updatedAt: DateLike;
	createdBy: string;
}

/** Payload used when creating or updating an event. */
export interface EventInput {
	title: string;
	summary: string;
	description: string;
	coverUrl: string;
	hostName: string;
	startsAt: string;
	endsAt: string;
	timezone: string;
	isOnline: boolean;
	venue: string;
	meetingUrl: string;
	capacity: number | null;
	waitlistEnabled: boolean;
	requiresApproval: boolean;
	status: EventStatus;
	visibility: EventVisibility;
	allowGuests: boolean;
	questions: EventQuestion[];
}

export interface RegistrationDoc {
	id: string;
	eventId: string;
	eventSlug: string;
	eventTitle: string;
	eventStartsAt: DateLike;

	userId: string;
	name: string;
	email: string;
	phone: string;
	program: string;
	studentId: string;

	status: RegistrationStatus;
	/** Answers keyed by question id. */
	answers: Record<string, string | string[]>;

	/** Short, human-readable ticket code, e.g. `IST-4F2A9C`. */
	code: string;
	/** Opaque token embedded in the QR code. Only set once approved. */
	token: string;
	/** Number of extra guests brought along. */
	guestCount: number;

	checkedIn: boolean;
	checkedInAt: DateLike;
	checkedInBy: string;

	createdAt: DateLike;
	updatedAt: DateLike;
}

export interface RegistrationInput {
	name: string;
	email: string;
	phone: string;
	program: string;
	studentId: string;
	answers: Record<string, string | string[]>;
	guestCount: number;
}
