import type { Role } from './types';

const RANK: Record<Role, number> = { student: 0, officer: 1, admin: 2 };

export const ROLE_LABELS: Record<Role, string> = {
	student: 'Student',
	officer: 'Officer',
	admin: 'Admin'
};

export function isStaff(role: Role | null | undefined): boolean {
	return role === 'officer' || role === 'admin';
}

export function isAdmin(role: Role | null | undefined): boolean {
	return role === 'admin';
}

export function atLeast(role: Role | null | undefined, min: Role): boolean {
	if (!role) return false;
	return RANK[role] >= RANK[min];
}
