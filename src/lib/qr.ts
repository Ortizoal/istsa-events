import QRCode from 'qrcode';

/**
 * The payload embedded in every ticket QR code. A scanner reads this string and
 * the check-in screen resolves it back to a registration.
 */
export interface TicketPayload {
	v: 1;
	eventId: string;
	token: string;
	code: string;
}

export function buildTicketPayload(eventId: string, token: string, code: string): string {
	const payload: TicketPayload = { v: 1, eventId, token, code };
	return JSON.stringify(payload);
}

/** Best-effort parse of a scanned QR string. Returns null for non-ISTSA codes. */
export function parseTicketPayload(raw: string): TicketPayload | null {
	const text = raw.trim();
	try {
		const parsed = JSON.parse(text) as Partial<TicketPayload>;
		if (parsed && parsed.v === 1 && parsed.eventId && parsed.token) {
			return {
				v: 1,
				eventId: String(parsed.eventId),
				token: String(parsed.token),
				code: String(parsed.code ?? '')
			};
		}
	} catch {
		// Not JSON — could be a bare token or a check-in URL. Fall through.
	}
	// Support plain tokens or "<eventId>:<token>" fallbacks.
	if (text.includes(':')) {
		const [eventId, token] = text.split(':', 2);
		if (eventId && token) return { v: 1, eventId, token, code: '' };
	}
	return null;
}

export async function qrDataUrl(text: string, size = 320): Promise<string> {
	return QRCode.toDataURL(text, {
		width: size,
		margin: 1,
		errorCorrectionLevel: 'M',
		color: { dark: '#1b2a5c', light: '#ffffff' }
	});
}

export async function qrSvg(text: string): Promise<string> {
	return QRCode.toString(text, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });
}
