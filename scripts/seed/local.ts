import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const sqlLiteral = (value: string) => `'${value.replaceAll("'", "''")}'`;

function seed(args: string[]) {
	const email = args[0]?.trim();
	if (args.length !== 1 || !email)
		throw new Error('Usage: pnpm db:seed:local <existing-google-email>');

	const wrangler = ['exec', 'wrangler', 'd1', 'execute', 'maido-book-db', '--local'];
	const persistTo = process.env.D1_LOCAL_PERSIST_TO;
	if (persistTo) wrangler.push('--persist-to', persistTo);
	const lookup = spawnSync(
		'pnpm',
		[
			...wrangler,
			'--json',
			'--command',
			`SELECT u.id, s.owner_id FROM "user" u LEFT JOIN setting s ON s.owner_id = u.id WHERE lower(u.email) = lower(${sqlLiteral(email)}) LIMIT 2`
		],
		{ encoding: 'utf8' }
	);
	if (lookup.error) throw lookup.error;
	if (lookup.status !== 0)
		throw new Error(lookup.stderr.trim() || lookup.stdout.trim() || 'Account lookup failed');

	let result: unknown;
	try {
		result = JSON.parse(lookup.stdout);
	} catch {
		throw new Error('Wrangler did not return JSON for the local account lookup');
	}
	if (
		!Array.isArray(result) ||
		result.length !== 1 ||
		result[0]?.success !== true ||
		!Array.isArray(result[0].results)
	) {
		throw new Error('Unexpected Wrangler response for the local account lookup');
	}
	const rows = result[0].results;
	if (rows.length !== 1)
		throw new Error(`Expected exactly one local Google account for ${email}; found ${rows.length}`);
	const row = rows[0];
	if (typeof row?.id !== 'string' || !row.id || row.owner_id !== row.id) {
		throw new Error('Local account has no provisioned CRM settings; apply the migrations first');
	}

	const sql = readFileSync(new URL('./local.sql', import.meta.url), 'utf8');
	const directory = mkdtempSync(join(tmpdir(), 'maido-crm-seed-'));
	try {
		const file = join(directory, 'seed.sql');
		writeFileSync(
			file,
			sql.replaceAll('__SEED_OWNER__', () => sqlLiteral(row.id))
		);
		const write = spawnSync('pnpm', [...wrangler, '--file', file], { stdio: 'inherit' });
		if (write.error) throw write.error;
		if (write.status === null) throw new Error(`Wrangler seed was interrupted (${write.signal})`);
		process.exitCode = write.status;
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
}

try {
	seed(process.argv.slice(2));
} catch (error) {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
}
