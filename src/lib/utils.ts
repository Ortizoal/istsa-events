import type { DateLike, RegistrationDoc } from './types';

/** Minimal className joiner (keeps the dependency footprint small). */
export function cn(...parts: Array<string | false | null | undefined>): string {
	return parts.filter(Boolean).join(' ');
}

const FALLBACK_TZ = 'Africa/Accra';

/** Normalise anything date-ish into a JS Date (or null). */
export function toDate(value: DateLike): Date | null {
	if (!value) return null;
	if (value instanceof Date) return value;
	if (typeof value === 'number') return new Date(value);
	if (typeof value === 'string') {
		const d = new Date(value);
		return Number.isNaN(d.getTime()) ? null : d;
	}
	// Firestore Timestamp
	if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
		return value.toDate();
	}
	return null;
}

export function isPast(value: DateLike): boolean {
	const d = toDate(value);
	return d ? d.getTime() < Date.now() : false;
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
	weekday: 'short',
	day: 'numeric',
	month: 'short',
	year: 'numeric',
	timeZone: FALLBACK_TZ
});

const timeFmt = new Intl.DateTimeFormat('en-GB', {
	hour: '2-digit',
	minute: '2-digit',
	hour12: true,
	timeZone: FALLBACK_TZ
});

export function formatDate(value: DateLike): string {
	const d = toDate(value);
	return d ? dateFmt.format(d) : 'Date TBC';
}

export function formatTime(value: DateLike): string {
	const d = toDate(value);
	return d ? timeFmt.format(d) : '';
}

export function formatDateTime(value: DateLike): string {
	const d = toDate(value);
	return d ? `${dateFmt.format(d)} · ${timeFmt.format(d)}` : 'Date TBC';
}

/** "Fri 3 Apr · 5:00 PM – 8:00 PM" (collapses the date when the range is same-day). */
export function formatEventRange(start: DateLike, end: DateLike): string {
	const s = toDate(start);
	const e = toDate(end);
	if (!s) return 'Date TBC';
	if (!e) return formatDateTime(s);
	const sameDay =
		s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth() && s.getDate() === e.getDate();
	return sameDay
		? `${dateFmt.format(s)} · ${timeFmt.format(s)} – ${timeFmt.format(e)}`
		: `${dateFmt.format(s)} ${timeFmt.format(s)} – ${dateFmt.format(e)} ${timeFmt.format(e)}`;
}

/** Convert a Date to the value format required by `<input type="datetime-local">`. */
export function toDatetimeLocal(value: DateLike): string {
	const d = toDate(value);
	if (!d) return '';
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
		d.getMinutes()
	)}`;
}

export function slugify(input: string): string {
	return input
		.toLowerCase()
		.trim()
		.replace(/['"]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 60);
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomChars(length: number): string {
	const bytes = new Uint8Array(length);
	crypto.getRandomValues(bytes);
	let out = '';
	for (let i = 0; i < length; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
	return out;
}

/** Short, human-readable ticket code, e.g. `IST-4F2A9C`. */
export function generateCode(): string {
	return `IST-${randomChars(6)}`;
}

/** Opaque token embedded in the QR code. */
export function generateToken(): string {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function newId(): string {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
	return `${Date.now().toString(36)}-${randomChars(10)}`;
}

/** Escape a value for CSV output. */
export function csvCell(value: unknown): string {
	const s = value == null ? '' : String(value);
	return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: Array<Record<string, unknown>>, columns: string[]): string {
	const header = columns.map(csvCell).join(',');
	const body = rows.map((row) => columns.map((c) => csvCell(row[c])).join(',')).join('\n');
	return `${header}\n${body}`;
}

/** Trigger a browser download of a text file. */
export function downloadText(filename: string, text: string, mime = 'text/csv;charset=utf-8'): void {
	const blob = new Blob([text], { type: mime });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}

export function initials(name: string): string {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((p) => p[0]?.toUpperCase() ?? '')
		.join('');
}

/** Human summary of a registration's ticket state. */
export function registrationLabel(reg: Pick<RegistrationDoc, 'status' | 'checkedIn'>): string {
	if (reg.checkedIn) return 'Checked in';
	switch (reg.status) {
		case 'approved':
			return 'Confirmed';
		case 'pending':
			return 'Pending';
		case 'waitlisted':
			return 'Waitlisted';
		case 'declined':
			return 'Declined';
		case 'cancelled':
			return 'Cancelled';
		default:
			return 'Registered';
	}
}
