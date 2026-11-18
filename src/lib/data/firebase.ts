import {
	createUserWithEmailAndPassword,
	onAuthStateChanged,
	sendPasswordResetEmail,
	signInWithEmailAndPassword,
	signInWithPopup,
	signOut as fbSignOut,
	updateProfile as fbUpdateProfile,
	GoogleAuthProvider,
	type User
} from 'firebase/auth';
import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	increment,
	limit,
	orderBy,
	query,
	serverTimestamp,
	setDoc,
	updateDoc,
	where,
	type DocumentData
} from 'firebase/firestore';
import { getDb, getFirebaseAuth } from '#lib/firebase/client';
import type { Backend, SignUpInput } from './backend';
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
import { generateCode, generateToken, slugify } from '#lib/utils';

const USERS = 'users';
const EVENTS = 'events';
const REGS = 'registrations';

function withId<T>(id: string, data: DocumentData | undefined): T {
	return { id, ...(data ?? {}) } as T;
}

async function ensureProfile(user: User): Promise<UserProfile> {
	const db = getDb();
	const ref = doc(db, USERS, user.uid);
	const snap = await getDoc(ref);
	if (snap.exists()) return snap.data() as UserProfile;
	// New profiles start as students; allowlisted admins are promoted server-side.
	const profile: UserProfile = {
		uid: user.uid,
		email: user.email ?? '',
		displayName: user.displayName ?? user.email?.split('@')[0] ?? 'Member',
		role: 'student',
		program: '',
		studentId: '',
		phone: '',
		photoURL: user.photoURL ?? undefined
	} as UserProfile;
	await setDoc(ref, { ...profile, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
	return profile;
}

export function createFirebaseBackend(): Backend {
	return {
		mode: 'firebase',

		onAuthChange(cb) {
			return onAuthStateChanged(getFirebaseAuth(), async (user) => {
				if (!user) return cb(null);
				try {
					cb(await ensureProfile(user));
				} catch {
					cb(null);
				}
			});
		},

		async signUp(input: SignUpInput) {
			const cred = await createUserWithEmailAndPassword(
				getFirebaseAuth(),
				input.email.trim(),
				input.password
			);
			await fbUpdateProfile(cred.user, { displayName: input.displayName.trim() });
			const profile: UserProfile = {
				uid: cred.user.uid,
				email: input.email.trim().toLowerCase(),
				displayName: input.displayName.trim(),
				role: 'student',
				program: input.program,
				studentId: input.studentId.trim(),
				phone: input.phone.trim(),
				createdAt: serverTimestamp() as never,
				updatedAt: serverTimestamp() as never
			};
			await setDoc(doc(getDb(), USERS, cred.user.uid), profile);
			return profile;
		},

		async signIn(email, password) {
			const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
			return ensureProfile(cred.user);
		},

		async signInWithGoogle(): Promise<UserProfile> {
			const provider = new GoogleAuthProvider();
			const cred = await signInWithPopup(getFirebaseAuth(), provider);
			return ensureProfile(cred.user);
		},

		async signOut() {
			await fbSignOut(getFirebaseAuth());
		},

		async resetPassword(email) {
			await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
		},

		async updateProfile(uid, patch) {
			const { uid: _uid, ...rest } = patch;
			await updateDoc(doc(getDb(), USERS, uid), { ...rest, updatedAt: serverTimestamp() });
		},

		async listPublishedEvents() {
			const q = query(
				collection(getDb(), EVENTS),
				where('status', '==', 'published'),
				orderBy('startsAt', 'asc')
			);
			const snap = await getDocs(q);
			return snap.docs.map((d) => withId<EventDoc>(d.id, d.data()));
		},

		async listEventsByHost(uid) {
			const q = query(
				collection(getDb(), EVENTS),
				where('hostUid', '==', uid),
				orderBy('startsAt', 'desc')
			);
			const snap = await getDocs(q);
			return snap.docs.map((d) => withId<EventDoc>(d.id, d.data()));
		},

		async getEventBySlug(slug) {
			const q = query(collection(getDb(), EVENTS), where('slug', '==', slug), limit(1));
			const snap = await getDocs(q);
			const first = snap.docs[0];
			return first ? withId<EventDoc>(first.id, first.data()) : null;
		},

		async getEventById(id) {
			const snap = await getDoc(doc(getDb(), EVENTS, id));
			return snap.exists() ? withId<EventDoc>(snap.id, snap.data()) : null;
		},

		async createEvent(input: EventInput, user) {
			const db = getDb();
			const base = slugify(input.title) || 'event';
			let slug = base;
			let n = 2;
			// eslint-disable-next-line no-constant-condition
			while (true) {
				const clash = await getDocs(
					query(collection(db, EVENTS), where('slug', '==', slug), limit(1))
				);
				if (clash.empty) break;
				slug = `${base}-${n++}`;
			}
			const payload = {
				...input,
				slug,
				hostUid: user.uid,
				hostName: input.hostName || user.displayName,
				registrationCount: 0,
				approvedCount: 0,
				checkedInCount: 0,
				createdAt: serverTimestamp(),
				updatedAt: serverTimestamp(),
				createdBy: user.uid
			};
			const ref = await addDoc(collection(db, EVENTS), payload);
			return withId<EventDoc>(ref.id, payload);
		},

		async updateEvent(id, input) {
			await updateDoc(doc(getDb(), EVENTS, id), { ...input, updatedAt: serverTimestamp() });
		},

		async setEventStatus(id, status: EventStatus) {
			await updateDoc(doc(getDb(), EVENTS, id), { status, updatedAt: serverTimestamp() });
		},

		async deleteEvent(id) {
			await deleteDoc(doc(getDb(), EVENTS, id));
		},

		async register(event, input: RegistrationInput, user) {
			const db = getDb();
			const existing = await getDocs(
				query(
					collection(db, REGS),
					where('eventId', '==', event.id),
					where('userId', '==', user.uid)
				)
			);
			if (existing.docs.some((d) => (d.data() as RegistrationDoc).status !== 'cancelled')) {
				throw new Error('You are already registered for this event.');
			}

			const approved = await getDocs(
				query(
					collection(db, REGS),
					where('eventId', '==', event.id),
					where('status', '==', 'approved')
				)
			);
			const isFull = event.capacity != null && approved.size >= event.capacity;

			let status: RegistrationStatus = 'approved';
			if (isFull && event.waitlistEnabled) status = 'waitlisted';
			else if (event.requiresApproval) status = 'pending';

			const payload = {
				eventId: event.id,
				eventSlug: event.slug,
				eventTitle: event.title,
				eventStartsAt: event.startsAt,
				userId: user.uid,
				name: input.name,
				email: input.email,
				phone: input.phone,
				program: input.program,
				studentId: input.studentId,
				status,
				answers: input.answers,
				code: generateCode(),
				token: status === 'approved' ? generateToken() : '',
				guestCount: input.guestCount,
				checkedIn: false,
				checkedInAt: null,
				checkedInBy: '',
				createdAt: serverTimestamp(),
				updatedAt: serverTimestamp()
			};
			const ref = await addDoc(collection(db, REGS), payload);
			await updateDoc(doc(db, EVENTS, event.id), {
				registrationCount: increment(1),
				...(status === 'approved' ? { approvedCount: increment(1) } : {})
			});
			return withId<RegistrationDoc>(ref.id, payload);
		},

		async listRegistrationsByUser(uid) {
			const q = query(
				collection(getDb(), REGS),
				where('userId', '==', uid),
				orderBy('createdAt', 'desc')
			);
			const snap = await getDocs(q);
			return snap.docs.map((d) => withId<RegistrationDoc>(d.id, d.data()));
		},

		async listRegistrationsForEvent(eventId) {
			const q = query(
				collection(getDb(), REGS),
				where('eventId', '==', eventId),
				orderBy('name', 'asc')
			);
			const snap = await getDocs(q);
			return snap.docs.map((d) => withId<RegistrationDoc>(d.id, d.data()));
		},

		async getRegistration(id) {
			const snap = await getDoc(doc(getDb(), REGS, id));
			return snap.exists() ? withId<RegistrationDoc>(snap.id, snap.data()) : null;
		},

		async setRegistrationStatus(id, status, _actor) {
			await updateDoc(doc(getDb(), REGS, id), {
				status,
				...(status === 'approved' ? { token: generateToken() } : {}),
				updatedAt: serverTimestamp()
			});
		},

		async checkIn(id, actor) {
			await updateDoc(doc(getDb(), REGS, id), {
				checkedIn: true,
				checkedInAt: serverTimestamp(),
				checkedInBy: actor.displayName,
				updatedAt: serverTimestamp()
			});
			const snap = await getDoc(doc(getDb(), REGS, id));
			return withId<RegistrationDoc>(snap.id, snap.data());
		},

		async checkInByToken(eventId, token, actor) {
			const q = query(
				collection(getDb(), REGS),
				where('eventId', '==', eventId),
				where('token', '==', token),
				limit(1)
			);
			const snap = await getDocs(q);
			const match = snap.docs[0];
			if (!match) throw new Error('No ticket matches that code.');
			return this.checkIn(match.id, actor);
		},

		async undoCheckIn(id) {
			await updateDoc(doc(getDb(), REGS, id), {
				checkedIn: false,
				checkedInAt: null,
				checkedInBy: '',
				updatedAt: serverTimestamp()
			});
		},

		async cancelRegistration(id) {
			await updateDoc(doc(getDb(), REGS, id), {
				status: 'cancelled',
				updatedAt: serverTimestamp()
			});
		},

		async listUsers() {
			const snap = await getDocs(query(collection(getDb(), USERS), orderBy('displayName', 'asc')));
			return snap.docs.map((d) => d.data() as UserProfile);
		},

		async getUser(uid) {
			const snap = await getDoc(doc(getDb(), USERS, uid));
			return snap.exists() ? (snap.data() as UserProfile) : null;
		},

		async setUserRole(uid: string, role: Role) {
			await updateDoc(doc(getDb(), USERS, uid), { role, updatedAt: serverTimestamp() });
		}
	};
}
