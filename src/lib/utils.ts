import { createCn } from 'cn/config';

/** `text-ui` is a font size (see layout.css); without this it is merged away as a colour. */
export const cn = createCn({ extend: { classGroups: { 'font-size': [{ text: ['ui'] }] } } });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U = HTMLElement> = T & { ref?: U | null };
