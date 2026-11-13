import { describe, expect, it } from 'vitest';
import { renderTemplate, toTemplate, type TemplateVars } from './template.ts';

const none: TemplateVars = { nama: '', produk: '', cs: '' };

describe('renderTemplate', () => {
	it('fills every placeholder', () => {
		expect(
			renderTemplate('Halo {nama}, {produk} dari {cs}', {
				nama: 'Ana',
				produk: 'ROOVE',
				cs: 'Vina'
			})
		).toBe('Halo Ana, ROOVE dari Vina');
	});
	it('does not fill a placeholder that a value introduces', () => {
		expect(renderTemplate('{nama} | {produk}', { nama: '{produk}', produk: 'ROOVE', cs: '' })).toBe(
			'{produk} | ROOVE'
		);
	});
});

describe('toTemplate', () => {
	it('puts placeholders back, longest value first', () => {
		expect(
			toTemplate('Halo Kak Ibu Ratna, ini Vina. Stok ROOVE…', {
				nama: 'Ibu Ratna',
				produk: 'ROOVE',
				cs: 'Vina'
			})
		).toBe('Halo Kak {nama}, ini {cs}. Stok {produk}…');
	});
	it('leaves text alone for empty values', () => {
		expect(toTemplate('Halo Kak', none)).toBe('Halo Kak');
	});
	it('replaces every occurrence of a value', () => {
		expect(toTemplate('Ana, Ana', { ...none, nama: 'Ana' })).toBe('{nama}, {nama}');
	});
	it('does not match a value inside a longer word', () => {
		expect(toTemplate('Anakku sudah Ana', { ...none, nama: 'Ana' })).toBe('Anakku sudah {nama}');
	});
	it('matches the longest value first', () => {
		expect(
			toTemplate('Stok ROOVE Plus, ROOVE biasa', { nama: '', produk: 'ROOVE Plus', cs: 'ROOVE' })
		).toBe('Stok {produk}, {cs} biasa');
	});
	it('prefers the longer value over a shorter one inside it', () => {
		expect(toTemplate('Halo Ibu Ana', { nama: 'Ibu Ana', produk: '', cs: 'Ana' })).toBe(
			'Halo {nama}'
		);
	});
	it('ignores whitespace-only values', () => {
		expect(toTemplate('Halo   ', { ...none, nama: '   ' })).toBe('Halo   ');
	});
	it('matches values containing regular expression characters literally', () => {
		expect(toTemplate('Halo Ny. (Rina)?, ya', { ...none, nama: 'Ny. (Rina)?' })).toBe(
			'Halo {nama}, ya'
		);
	});
	it('is case-sensitive', () => {
		expect(toTemplate('ana ANA Ana', { ...none, nama: 'Ana' })).toBe('ana ANA {nama}');
	});
	it('uses the first key in order when two keys hold the same value', () => {
		expect(toTemplate('ROOVE', { nama: 'ROOVE', produk: 'ROOVE', cs: '' })).toBe('{nama}');
	});
	it('stops a value at punctuation', () => {
		expect(toTemplate('Kak Warces? Ya', { ...none, nama: 'Kak Warces' })).toBe('{nama}? Ya');
	});
	it('handles unicode letters at word boundaries', () => {
		expect(toTemplate('Ärmax, Ärma', { ...none, nama: 'Ärma' })).toBe('Ärmax, {nama}');
	});
	it('keeps a partial name as literal text', () => {
		expect(toTemplate('Warces Melni', { ...none, nama: 'Warces Melni Songko' })).toBe(
			'Warces Melni'
		);
	});
	it('round-trips a rendered template', () => {
		const vars = { nama: 'Ibu Ratna', produk: 'ROOVE', cs: 'Vina' };
		const body = 'Halo Kak {nama}, ini {cs}. Stok {produk}';
		expect(toTemplate(renderTemplate(body, vars), vars)).toBe(body);
	});
});
