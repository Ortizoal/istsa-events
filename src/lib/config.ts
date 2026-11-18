/**
 * Static app configuration and brand constants for the ISTSA Events Portal.
 */

export const APP_NAME = 'ISTSA Events';
export const APP_TAGLINE = 'Host events. Track attendance.';
export const ORGANISATION = 'Information Systems and Technology Students Association';
export const ORGANISATION_SHORT = 'ISTSA';
export const ORG_MOTTO = 'Protecting what connects us';
export const ORG_UNIVERSITY = 'Accra Technical University';

/** Brand colours — keep in sync with `src/routes/layout.css`. */
export const BRAND = {
	navy: '#1b2a5c',
	gold: '#f4c33c'
} as const;

export interface ProgramOption {
	value: string;
	label: string;
}

/** Programmes offered by the department. Extend as the association grows. */
export const PROGRAMS: ProgramOption[] = [
	{ value: 'Diploma in IT Morning', label: 'Diploma in IT Morning' },
	{ value: 'Diploma in IT Evening', label: 'Diploma in IT Evening' },
	{ value: 'Diploma in Cybersecurity Morning', label: 'Diploma in Cybersecurity Morning' },
	{ value: 'Diploma in Cybersecurity Evening', label: 'Diploma in Cybersecurity Evening' },
	{ value: 'BTech Cybersecurity Morning', label: 'BTech Cybersecurity Morning' },
	{ value: 'BTech Applied Informatics Morning', label: 'BTech Applied Informatics Morning' }
];

export const PROGRAMS_OTHER = 'Other';
