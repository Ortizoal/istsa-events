import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { Resend } from 'resend';
import QRCode from 'qrcode';

initializeApp();
const db = getFirestore();

const MAIL_FROM = process.env.MAIL_FROM ?? 'ISTSA Events <onboarding@resend.dev>';
const APP_URL = (process.env.APP_URL ?? 'http://localhost:5173').replace(/\/$/, '');
const SUPER_ADMINS = (process.env.SUPER_ADMIN_EMAILS ?? '')
	.split(',')
	.map((e) => e.trim().toLowerCase())
	.filter(Boolean);

interface Registration {
	eventId: string;
	eventSlug: string;
	eventTitle: string;
	eventStartsAt?: Timestamp;
	name: string;
	email: string;
	code: string;
	token: string;
	status: string;
	guestCount?: number;
}

interface EventDoc {
	title: string;
	slug: string;
	startsAt?: Timestamp;
	endsAt?: Timestamp;
	isOnline?: boolean;
	venue?: string;
	meetingUrl?: string;
	hostName?: string;
}

function brandWrap(title: string, body: string): string {
	return `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Inter,Segoe UI,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:#1b2a5c;border-radius:16px 16px 0 0;padding:24px;color:#fff">
      <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#f4c33c">ISTSA Events</div>
      <div style="font-size:18px;font-weight:600;margin-top:4px">${title}</div>
    </div>
    <div style="background:#fff;border-radius:0 0 16px 16px;padding:24px;color:#131f45">
      ${body}
    </div>
    <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:16px">
      Information Systems and Technology Students Association · Accra Technical University
    </p>
  </div>
</body></html>`;
}

async function sendMail(to: string, subject: string, html: string, qrPng?: Buffer) {
	const key = process.env.RESEND_API_KEY;
	if (!key) {
		logger.warn('RESEND_API_KEY not set — skipping email to', to);
		return;
	}
	const resend = new Resend(key);
	const attachments = qrPng
		? [{ filename: 'istsa-ticket.png', content: qrPng.toString('base64') }]
		: undefined;
	const { error } = await resend.emails.send({
		from: MAIL_FROM,
		to,
		subject,
		html,
		attachments
	});
	if (error) logger.error('Resend error', error);
}

async function getEvent(eventId: string): Promise<EventDoc | null> {
	const snap = await db.collection('events').doc(eventId).get();
	return snap.exists ? (snap.data() as EventDoc) : null;
}

async function sendTicket(reg: Registration) {
	const event = await getEvent(reg.eventId);
	const payload = JSON.stringify({ v: 1, eventId: reg.eventId, token: reg.token, code: reg.code });
	const dataUrl = await QRCode.toDataURL(payload, { width: 360, margin: 1 });
	const png = Buffer.from(dataUrl.split(',')[1], 'base64');

	const when = event?.startsAt
		? event.startsAt.toDate().toLocaleString('en-GB', { timeZone: 'Africa/Accra' })
		: 'See event page';
	const where = event?.isOnline ? 'Online' : event?.venue || 'Venue TBC';

	const body = `
    <p style="font-size:15px">Hi ${reg.name},</p>
    <p style="font-size:15px">You're in. Here is your ticket for <strong>${reg.eventTitle}</strong>.</p>
    <div style="text-align:center;margin:20px 0">
      <img src="${dataUrl}" width="220" height="220" alt="Ticket QR" style="border:1px solid #e2e8f0;border-radius:12px"/>
      <div style="font-family:monospace;font-size:18px;letter-spacing:.2em;margin-top:10px">${reg.code}</div>
    </div>
    <table style="width:100%;font-size:14px;color:#334155">
      <tr><td style="padding:4px 0">When</td><td style="text-align:right">${when}</td></tr>
      <tr><td style="padding:4px 0">Where</td><td style="text-align:right">${where}</td></tr>
    </table>
    <p style="font-size:13px;color:#64748b;margin-top:16px">
      Show this QR code at the door. You can also view it at
      <a href="${APP_URL}/tickets" style="color:#1b2a5c">${APP_URL}/tickets</a>.
    </p>`;

	await sendMail(
		reg.email,
		`Your ticket — ${reg.eventTitle}`,
		brandWrap('Your ticket', body),
		png
	);
}

/** Promote allowlisted emails to admin the moment their profile is created. */
export const onUserProfileCreated = onDocumentCreated('users/{uid}', async (event) => {
	const data = event.data?.data();
	if (!data) return;
	const email = String(data.email ?? '').toLowerCase();
	if (SUPER_ADMINS.includes(email) && data.role !== 'admin') {
		await event.data!.ref.update({ role: 'admin' });
		logger.info(`Promoted ${email} to admin`);
	}
});

/** Email a ticket when a registration is created already approved. */
export const onRegistrationCreated = onDocumentCreated(
	{ document: 'registrations/{regId}' },
	async (event) => {
		const reg = event.data?.data() as Registration | undefined;
		if (!reg || reg.status !== 'approved') return;
		await sendTicket(reg);
	}
);

/** Email a ticket when a pending/waitlisted registration becomes approved. */
export const onRegistrationApproved = onDocumentUpdated(
	{ document: 'registrations/{regId}' },
	async (event) => {
		const before = event.data?.before.data() as Registration | undefined;
		const after = event.data?.after.data() as Registration | undefined;
		if (!before || !after) return;
		if (before.status !== 'approved' && after.status === 'approved') {
			await sendTicket(after);
		}
	}
);

/** Daily reminder to everyone approved for events starting in the next 24 hours. */
export const sendEventReminders = onSchedule(
	{ schedule: 'every day 08:00', timeZone: 'Africa/Accra' },
	async () => {
		const now = Date.now();
		const soon = Timestamp.fromMillis(now + 24 * 60 * 60 * 1000);
		const events = await db
			.collection('events')
			.where('status', '==', 'published')
			.where('startsAt', '>=', Timestamp.fromMillis(now))
			.where('startsAt', '<=', soon)
			.get();

		for (const ev of events.docs) {
			const data = ev.data() as EventDoc;
			const regs = await db
				.collection('registrations')
				.where('eventId', '==', ev.id)
				.where('status', '==', 'approved')
				.get();

			const when = data.startsAt
				? data.startsAt.toDate().toLocaleString('en-GB', { timeZone: 'Africa/Accra' })
				: '';
			const where = data.isOnline ? 'Online' : data.venue || '';

			for (const r of regs.docs) {
				const reg = r.data() as Registration;
				const body = `
          <p style="font-size:15px">Hi ${reg.name},</p>
          <p style="font-size:15px"><strong>${data.title}</strong> starts soon.</p>
          <table style="width:100%;font-size:14px;color:#334155;margin:12px 0">
            <tr><td>When</td><td style="text-align:right">${when}</td></tr>
            <tr><td>Where</td><td style="text-align:right">${where}</td></tr>
          </table>
          <p style="font-size:13px;color:#64748b">Your ticket code is
            <strong>${reg.code}</strong> — bring it along.</p>`;
				await sendMail(reg.email, `Reminder: ${data.title}`, brandWrap('Reminder', body));
			}
		}
		logger.info(`Reminders sent for ${events.size} event(s)`);
	}
);

/** Callable: resend a ticket to the signed-in attendee (or any ticket, for staff). */
export const resendTicket = onCall(async (request) => {
	if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in first.');
	const regId = String(request.data?.registrationId ?? '');
	if (!regId) throw new HttpsError('invalid-argument', 'registrationId is required.');

	const snap = await db.collection('registrations').doc(regId).get();
	if (!snap.exists) throw new HttpsError('not-found', 'Registration not found.');
	const reg = snap.data() as Registration;

	const caller = await db.collection('users').doc(request.auth.uid).get();
	const role = caller.data()?.role ?? 'student';
	const isOwner = request.auth.uid === (snap.data() as { userId?: string }).userId;
	if (!isOwner && role !== 'officer' && role !== 'admin') {
		throw new HttpsError('permission-denied', 'Not allowed.');
	}
	if (reg.status !== 'approved') {
		throw new HttpsError('failed-precondition', 'Ticket is not approved yet.');
	}
	await sendTicket(reg);
	return { ok: true };
});
