import type { Component } from 'svelte';
import TextAlignStart from '@lucide/svelte/icons/text-align-start';
import Users from '@lucide/svelte/icons/users';
import ReceiptText from '@lucide/svelte/icons/receipt-text';
import ChartColumn from '@lucide/svelte/icons/chart-column';
import Upload from '@lucide/svelte/icons/upload';
import Settings from '@lucide/svelte/icons/settings';
import { m } from '#lib/paraglide/messages.js';

type AppRoute =
	| '/(app)'
	| '/(app)/customers'
	| '/(app)/orders'
	| '/(app)/insights'
	| '/(app)/import'
	| '/(app)/settings'
	| '/(app)/more';

export interface NavItem {
	href: string;
	route: AppRoute;
	icon: Component;
	label: () => string;
}

const item = (href: string, route: AppRoute, icon: unknown, label: () => string): NavItem => ({
	href,
	route,
	icon: icon as Component,
	label
});

/** The daily work, in the order a CS agent reaches for it. */
export const primaryNav: NavItem[] = [
	item('/', '/(app)', TextAlignStart, () => m.nav_today()),
	item('/customers', '/(app)/customers', Users, () => m.nav_customers()),
	item('/orders', '/(app)/orders', ReceiptText, () => m.nav_orders()),
	item('/insights', '/(app)/insights', ChartColumn, () => m.nav_insights())
];

/** Set-up screens, visited rarely. */
export const secondaryNav: NavItem[] = [
	item('/import', '/(app)/import', Upload, () => m.nav_import()),
	item('/settings', '/(app)/settings', Settings, () => m.nav_settings())
];

/** What the phone's "Lainnya" page lists: the rest of the nav. */
export const moreItems: NavItem[] = [primaryNav[3], ...secondaryNav];

export function isActive(pathname: string, href: string): boolean {
	if (href === '/') return pathname === '/';
	return pathname === href || pathname.startsWith(href + '/');
}

/** Keeps the queue count inside its slot at any queue size. */
export const badgeCount = (n: number): string => (n > 99 ? '99+' : String(n));
