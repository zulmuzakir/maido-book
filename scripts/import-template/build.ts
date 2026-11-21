// Builds static/templates/maido-book-import.xlsx, the template linked from /import.
// Run with `pnpm template:build` after changing the import headers, LAST_ACTIONS or limits.
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';
import { LAST_ACTIONS } from '../../src/lib/domain/follow-up.ts';
import { IMPORT_LIMITS, TEMPLATE_HEADERS } from '../../src/lib/domain/import-sheet.ts';

const OUT = fileURLToPath(
	new URL('../../static/templates/maido-book-import.xlsx', import.meta.url)
);
/** Rows 2..ROWS+1 get formats and validation; matches MAX_ROWS on the import page. */
const ROWS = 2000;
const FIXED_DATE = new Date(Date.UTC(2026, 0, 1));

type Col = keyof typeof TEMPLATE_HEADERS;
const COLS = Object.keys(TEMPLATE_HEADERS) as Col[];
const WIDTHS: Record<Col, number> = {
	name: 26,
	phone: 18,
	productName: 16,
	qty: 8,
	dosePerDay: 12,
	lastOrderDate: 19,
	lastAction: 24,
	notes: 40
};
const letter = (col: Col) => String.fromCharCode(65 + COLS.indexOf(col));
const range = (col: Col) => `${letter(col)}2:${letter(col)}${ROWS + 1}`;

const HEADER_FILL: ExcelJS.Fill = {
	type: 'pattern',
	pattern: 'solid',
	fgColor: { argb: 'FFE8F1EC' }
};

const wb = new ExcelJS.Workbook();
wb.creator = 'Maido Book';
wb.lastModifiedBy = 'Maido Book';
wb.created = FIXED_DATE;
wb.modified = FIXED_DATE;

// Sheet 1: "Customer". The import page reads the first sheet whose name contains "customer".
const sheet = wb.addWorksheet('Customer', { views: [{ state: 'frozen', ySplit: 1 }] });
sheet.columns = COLS.map((c) => ({ header: TEMPLATE_HEADERS[c], key: c, width: WIDTHS[c] }));
const header = sheet.getRow(1);
header.font = { bold: true };
header.eachCell((cell) => {
	cell.fill = HEADER_FILL;
	cell.alignment = { vertical: 'middle' };
});
sheet.getCell(`${letter('name')}1`).note = 'Wajib diisi.';
sheet.getCell(`${letter('phone')}1`).note =
	'Wajib diisi. Kolom ini berformat Teks supaya angka 0 di depan tidak hilang.';
sheet.autoFilter = `A1:${letter('notes')}1`;

for (let r = 2; r <= ROWS + 1; r++) {
	sheet.getCell(`${letter('phone')}${r}`).numFmt = '@';
	sheet.getCell(`${letter('lastOrderDate')}${r}`).numFmt = 'dd/mm/yyyy';
	sheet.getCell(`${letter('notes')}${r}`).alignment = { wrapText: true, vertical: 'top' };
}

const whole = (max: number, label: string): ExcelJS.DataValidation => ({
	type: 'whole',
	operator: 'between',
	allowBlank: true,
	formulae: [1, max],
	showErrorMessage: true,
	errorStyle: 'stop',
	errorTitle: label,
	error: `Isi angka bulat dari 1 sampai ${max}.`
});
const validations: [Col, ExcelJS.DataValidation][] = [
	['qty', whole(IMPORT_LIMITS.qty, TEMPLATE_HEADERS.qty)],
	['dosePerDay', whole(IMPORT_LIMITS.dosePerDay, TEMPLATE_HEADERS.dosePerDay)],
	[
		'lastOrderDate',
		{
			type: 'date',
			operator: 'greaterThan',
			allowBlank: true,
			formulae: [new Date(Date.UTC(2000, 0, 1))],
			showErrorMessage: true,
			errorStyle: 'stop',
			errorTitle: TEMPLATE_HEADERS.lastOrderDate,
			error: 'Isi tanggal, misalnya 05/11/2026 (hari/bulan/tahun).'
		}
	],
	[
		'lastAction',
		{
			type: 'list',
			allowBlank: true,
			formulae: [`"${LAST_ACTIONS.join(',')}"`],
			showErrorMessage: true,
			errorStyle: 'stop',
			errorTitle: TEMPLATE_HEADERS.lastAction,
			error: 'Pilih salah satu dari daftar.'
		}
	]
];
for (const [col, rule] of validations) sheet.dataValidations.add(range(col), rule);

// Sheet 2: "Petunjuk". Its name must not contain "customer". Guide lines are single cells so
// none of them reads as a header; the example table at the bottom uses the real headers.
const guide = wb.addWorksheet('Petunjuk');
guide.getColumn(1).width = 26;
for (const c of COLS.slice(1)) guide.getColumn(COLS.indexOf(c) + 1).width = WIDTHS[c];

const lines: [string, 'title' | 'heading' | 'text'][] = [
	['Petunjuk impor customer Maido Book', 'title'],
	[
		'Isi data di sheet "Customer", satu customer per baris, lalu unggah file di halaman Impor.',
		'text'
	],
	['Jangan ubah nama kolom di baris pertama. Kolom lain boleh dikosongkan.', 'text'],
	['', 'text'],
	['Kolom', 'heading'],
	[`• ${TEMPLATE_HEADERS.name}: wajib.`, 'text'],
	[
		`• ${TEMPLATE_HEADERS.phone}: wajib. Boleh 08…, 628… atau +62…. Nomor yang sudah ada di aplikasi dilewati.`,
		'text'
	],
	[
		`• ${TEMPLATE_HEADERS.productName}: nama produk. Kosong = produk utama. Nama baru dibuat sebagai produk baru.`,
		'text'
	],
	[`• ${TEMPLATE_HEADERS.qty}: jumlah sachet di order terakhir.`, 'text'],
	[`• ${TEMPLATE_HEADERS.dosePerDay}: sachet per hari. Kosong = 1.`, 'text'],
	[`• ${TEMPLATE_HEADERS.lastOrderDate}: tanggal order terakhir (hari/bulan/tahun).`, 'text'],
	[`• ${TEMPLATE_HEADERS.lastAction}: pilih dari daftar (lihat di bawah).`, 'text'],
	[`• ${TEMPLATE_HEADERS.notes}: catatan bebas.`, 'text'],
	['Jadwal reorder dihitung dari Tgl Order Terakhir + (Qty ÷ Pola Minum) hari.', 'text'],
	['', 'text'],
	['Last Action', 'heading'],
	[
		'• Kosong: follow-up reorder sesuai jadwal, atau follow-up lead hari ini jika belum ada order.',
		'text'
	],
	['• Customer berminat: follow-up closing hari ini.', 'text'],
	['• Menunggu balasan: sudah dihubungi, menunggu balasan di jadwal follow-up berikutnya.', 'text'],
	['• Customer membalas / Follow up ulang: follow-up ulang hari ini.', 'text'],
	['• Sudah follow up: follow-up reorder sesuai jadwal.', 'text'],
	[
		'• Closing / Order: follow-up reorder sesuai jadwal; jika jadwal sudah lewat, jadi win-back.',
		'text'
	],
	['• Tidak ada respon: customer jadi dorman dengan follow-up win-back.', 'text'],
	['• Customer belum berminat: customer jadi dorman tanpa follow-up.', 'text'],
	['', 'text'],
	['Batas', 'heading'],
	[`• Maksimal ${ROWS.toLocaleString('id-ID')} customer per impor. File maksimal 10 MB.`, 'text'],
	[
		'• Hanya sheet "Customer" yang dibaca. Order lama selain order terakhir dimasukkan manual.',
		'text'
	],
	['', 'text'],
	['Contoh (jangan diisi di sini, sheet ini tidak diimpor)', 'heading']
];
for (const [text, kind] of lines) {
	const row = guide.addRow([text]);
	if (kind === 'title') row.font = { bold: true, size: 14 };
	if (kind === 'heading') row.font = { bold: true };
}

const exampleHeader = guide.addRow(COLS.map((c) => TEMPLATE_HEADERS[c]));
exampleHeader.font = { bold: true };
exampleHeader.eachCell((cell) => (cell.fill = HEADER_FILL));
const examples: Record<Col, string | number | Date | null>[] = [
	{
		name: 'Contoh Ayu',
		phone: '081234567890',
		productName: 'ROOVE',
		qty: 30,
		dosePerDay: 1,
		lastOrderDate: new Date(Date.UTC(2026, 9, 30)),
		lastAction: 'Sudah follow up',
		notes: 'Suka rasa original'
	},
	{
		name: 'Contoh Budi',
		phone: '6281298765432',
		productName: null,
		qty: null,
		dosePerDay: null,
		lastOrderDate: null,
		lastAction: 'Customer berminat',
		notes: null
	}
];
for (const ex of examples) {
	const row = guide.addRow(COLS.map((c) => ex[c]));
	row.getCell(COLS.indexOf('phone') + 1).numFmt = '@';
	row.getCell(COLS.indexOf('lastOrderDate') + 1).numFmt = 'dd/mm/yyyy';
}

await wb.xlsx.writeFile(OUT);
console.log(`Wrote ${OUT}`);
