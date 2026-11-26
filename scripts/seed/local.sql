-- Local demo data for development and screenshots. Never run against the remote database.
--   pnpm db:seed:local <existing-google-email>
-- Idempotent: only replaces fixtures owned by the selected account.
-- Dates are relative to today in Asia/Jakarta, so the queue always has every state.
-- Demo calculations assume the initial rules: lead 3 days, retry 2 days, 3 attempts. ROOVE has 1 serving per sachet,
-- so an order of qty = units × dose lasts `units` days and its follow-up is due units − 3 days later.
--
-- Customers 001–112:
--   001–013 overdue (002 last attempt, 003 closing, 004 retry, 001 long history)
--   014–022 due today
--   023–030 upcoming within 7 days
--   031–036 waiting for a reply (033–036 stale)
--   037–100 later, due within the order's supply (037–040 handled today)
--   101–106 new leads, 107–112 dormant with a win-back

CREATE TABLE crm_seed_guard (
	safe INTEGER NOT NULL CONSTRAINT seed_crm_preserves_non_seed_work CHECK (safe = 1)
);
WITH seed(owner_id, prefix) AS (VALUES (__SEED_OWNER__, ('seed_' || hex(__SEED_OWNER__) || '_')))
INSERT INTO crm_seed_guard(safe)
SELECT 0 FROM seed s WHERE
	EXISTS (SELECT 1 FROM customer_order o WHERE o.owner_id = s.owner_id AND instr(o.id, s.prefix) != 1 AND instr(o.customer_id, s.prefix) = 1)
	OR EXISTS (SELECT 1 FROM follow_up f WHERE f.owner_id = s.owner_id AND instr(f.id, s.prefix) != 1
		AND (instr(f.customer_id, s.prefix) = 1 OR instr(f.order_id, s.prefix) = 1))
	OR EXISTS (SELECT 1 FROM activity a WHERE a.owner_id = s.owner_id AND instr(a.id, s.prefix) != 1
		AND (instr(a.customer_id, s.prefix) = 1 OR instr(a.order_id, s.prefix) = 1 OR instr(a.follow_up_id, s.prefix) = 1));
DROP TABLE crm_seed_guard;

DELETE FROM activity WHERE owner_id = __SEED_OWNER__ AND instr(id, ('seed_' || hex(__SEED_OWNER__) || '_')) = 1;
DELETE FROM follow_up WHERE owner_id = __SEED_OWNER__ AND instr(id, ('seed_' || hex(__SEED_OWNER__) || '_')) = 1;
DELETE FROM customer_order WHERE owner_id = __SEED_OWNER__ AND instr(id, ('seed_' || hex(__SEED_OWNER__) || '_')) = 1;
DELETE FROM customer WHERE owner_id = __SEED_OWNER__ AND instr(id, ('seed_' || hex(__SEED_OWNER__) || '_')) = 1;

INSERT OR IGNORE INTO product (owner_id, id, name, unit_label, servings_per_unit, price, active)
VALUES (__SEED_OWNER__, ('seed_' || hex(__SEED_OWNER__) || '_') || 'prod_fiber', 'ROOVE Fiber', 'sachet', 1, 12500, 1);

-- Customers
WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 112)
INSERT INTO customer (owner_id, id, name, phone, dose_per_day, status, notes, created_at, updated_at)
SELECT
	__SEED_OWNER__, ('seed_' || hex(__SEED_OWNER__) || '_') || 'c' || printf('%03d', i),
	CASE i % 24
		WHEN 0 THEN 'Ayu' WHEN 1 THEN 'Budi' WHEN 2 THEN 'Citra' WHEN 3 THEN 'Dewi'
		WHEN 4 THEN 'Eko' WHEN 5 THEN 'Fitri' WHEN 6 THEN 'Gita' WHEN 7 THEN 'Hendra'
		WHEN 8 THEN 'Indah' WHEN 9 THEN 'Joko' WHEN 10 THEN 'Kartika' WHEN 11 THEN 'Lestari'
		WHEN 12 THEN 'Maya' WHEN 13 THEN 'Nanda' WHEN 14 THEN 'Oki' WHEN 15 THEN 'Putri'
		WHEN 16 THEN 'Rina' WHEN 17 THEN 'Sari' WHEN 18 THEN 'Tono' WHEN 19 THEN 'Umi'
		WHEN 20 THEN 'Vina' WHEN 21 THEN 'Wulan' WHEN 22 THEN 'Yanti' ELSE 'Zahra'
	END || ' ' ||
	CASE i % 7
		WHEN 0 THEN 'Lestari' WHEN 1 THEN 'Saputra' WHEN 2 THEN 'Wijaya' WHEN 3 THEN 'Rahma' WHEN 4 THEN 'Hidayat' WHEN 5 THEN 'Kusuma'
		ELSE 'Pratama'
	END,
	'6281200' || printf('%05d', i),
	CASE WHEN i % 5 = 0 THEN 2 ELSE 1 END,
	CASE WHEN i <= 100 THEN 'active' WHEN i <= 106 THEN 'lead' ELSE 'dormant' END,
	CASE WHEN i = 1 THEN 'Suka diingatkan pagi hari. Biasanya order 2 kotak.' END,
	(cast(unixepoch('now', '-' || (200 - i) || ' days') AS integer) * 1000),
	(cast(unixepoch('now', '-' || (200 - i) || ' days') AS integer) * 1000)
FROM n;

-- Latest order for each active customer, placed so its follow-up lands in the wanted bucket.
-- units = days of supply: 30, or 60 for every third customer.
WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 100),
t AS (SELECT date('now', '+7 hours') AS today),
p AS (
	SELECT i,
		CASE WHEN i % 5 = 0 THEN 2 ELSE 1 END AS dose,
		CASE WHEN i % 3 = 0 THEN 60 ELSE 30 END AS units,
		CASE WHEN i % 4 = 0 THEN (
			SELECT id FROM product
			WHERE owner_id = __SEED_OWNER__
			AND (id = ('seed_' || hex(__SEED_OWNER__) || '_') || 'prod_fiber' OR lower(name) = 'roove fiber')
			ORDER BY (id = ('seed_' || hex(__SEED_OWNER__) || '_') || 'prod_fiber') DESC LIMIT 1
		) ELSE 'prod_roove:' || __SEED_OWNER__ END AS prod,
		CASE WHEN i % 4 = 0 THEN 12500 ELSE 10100 END AS price,
		CASE
			WHEN i <= 13 THEN -i
			WHEN i <= 22 THEN 0
			WHEN i <= 30 THEN i - 22
			WHEN i <= 36 THEN -(i - 30)
			-- Spread over 8 … units − 3 days, so the order date never lands after today.
			ELSE 8 + (i - 37) % ((CASE WHEN i % 3 = 0 THEN 60 ELSE 30 END) - 10)
		END AS due_offset
	FROM n
)
INSERT INTO customer_order (owner_id, id, customer_id, product_id, order_date, qty, dose_per_day, days_supply, total_paid, note, created_at)
SELECT
	__SEED_OWNER__, ('seed_' || hex(__SEED_OWNER__) || '_') || 'o' || printf('%03d', i) || '_0',
	('seed_' || hex(__SEED_OWNER__) || '_') || 'c' || printf('%03d', i),
	prod,
	date(t.today, (due_offset - (units - 3)) || ' days'),
	units * dose,
	dose,
	units,
	units * dose * price,
	CASE WHEN i = 3 THEN 'Minta dikirim sore' END,
	(cast(unixepoch(date(t.today, (due_offset - (units - 3)) || ' days'), '+3 hours') AS integer) * 1000)
FROM p, t;

-- The previous cycle for customers 001–060, so last month has orders too.
WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 60)
INSERT INTO customer_order (owner_id, id, customer_id, product_id, order_date, qty, dose_per_day, days_supply, total_paid, created_at)
SELECT
	__SEED_OWNER__, ('seed_' || hex(__SEED_OWNER__) || '_') || 'o' || printf('%03d', i) || '_1',
	o.customer_id, o.product_id,
	date(o.order_date, '-' || o.days_supply || ' days'),
	o.qty, o.dose_per_day, o.days_supply, o.total_paid,
	o.created_at - o.days_supply * 86400000
FROM n JOIN customer_order o ON o.owner_id = __SEED_OWNER__ AND o.id = ('seed_' || hex(__SEED_OWNER__) || '_') || 'o' || printf('%03d', i) || '_0';

-- A long history for customer 001: ten more monthly orders.
WITH RECURSIVE k(j) AS (SELECT 2 UNION ALL SELECT j + 1 FROM k WHERE j < 11)
INSERT INTO customer_order (owner_id, id, customer_id, product_id, order_date, qty, dose_per_day, days_supply, total_paid, created_at)
SELECT
	__SEED_OWNER__, ('seed_' || hex(__SEED_OWNER__) || '_') || 'o001_' || j, o.customer_id, o.product_id,
	date(o.order_date, '-' || (o.days_supply * j) || ' days'),
	o.qty, o.dose_per_day, o.days_supply, o.total_paid,
	o.created_at - o.days_supply * j * 86400000
FROM k JOIN customer_order o ON o.owner_id = __SEED_OWNER__ AND o.id = ('seed_' || hex(__SEED_OWNER__) || '_') || 'o001_0';

-- Two old orders for each dormant customer (107–112), long run out.
WITH RECURSIVE n(i) AS (SELECT 107 UNION ALL SELECT i + 1 FROM n WHERE i < 112),
t AS (SELECT date('now', '+7 hours') AS today)
INSERT INTO customer_order (owner_id, id, customer_id, product_id, order_date, qty, dose_per_day, days_supply, total_paid, created_at)
SELECT __SEED_OWNER__, ('seed_' || hex(__SEED_OWNER__) || '_') || 'o' || printf('%03d', i) || '_0', ('seed_' || hex(__SEED_OWNER__) || '_') || 'c' || printf('%03d', i), 'prod_roove:' || __SEED_OWNER__,
	date(t.today, '-' || (90 + i - 107) || ' days'), 30, 1, 30, 303000,
	(cast(unixepoch(date(t.today, '-' || (90 + i - 107) || ' days'), '+3 hours') AS integer) * 1000)
FROM n, t
UNION ALL
SELECT __SEED_OWNER__, ('seed_' || hex(__SEED_OWNER__) || '_') || 'o' || printf('%03d', i) || '_1', ('seed_' || hex(__SEED_OWNER__) || '_') || 'c' || printf('%03d', i), 'prod_roove:' || __SEED_OWNER__,
	date(t.today, '-' || (120 + i - 107) || ' days'), 30, 1, 30, 303000,
	(cast(unixepoch(date(t.today, '-' || (120 + i - 107) || ' days'), '+3 hours') AS integer) * 1000)
FROM n, t;

-- Open follow-ups for active customers, due units − 3 days after their latest order.
WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 100)
INSERT INTO follow_up (owner_id, id, customer_id, kind, due_date, attempt, contacted_at, status, order_id, created_at)
SELECT
	__SEED_OWNER__, ('seed_' || hex(__SEED_OWNER__) || '_') || 'f' || printf('%03d', i),
	o.customer_id,
	CASE i WHEN 2 THEN 'retry' WHEN 3 THEN 'closing' WHEN 4 THEN 'retry' ELSE 'reorder' END,
	date(o.order_date, (o.days_supply - 3) || ' days'),
	CASE i WHEN 2 THEN 3 WHEN 4 THEN 2 ELSE 1 END,
	CASE WHEN i BETWEEN 31 AND 36
		THEN (cast(unixepoch('now', '-' || ((i - 31) * 18 + 2) || ' hours') AS integer) * 1000) END,
	'open',
	-- order_id marks a follow-up closed by an order (orders.ts); an open one has none, or the
	-- queue's "Urungkan" refuses to undo its outcome.
	NULL,
	o.created_at
FROM n JOIN customer_order o ON o.owner_id = __SEED_OWNER__ AND o.id = ('seed_' || hex(__SEED_OWNER__) || '_') || 'o' || printf('%03d', i) || '_0';

-- New leads (101–106): first contact due today or overdue.
WITH RECURSIVE n(i) AS (SELECT 101 UNION ALL SELECT i + 1 FROM n WHERE i < 106),
t AS (SELECT date('now', '+7 hours') AS today)
INSERT INTO follow_up (owner_id, id, customer_id, kind, due_date, attempt, status)
SELECT __SEED_OWNER__, ('seed_' || hex(__SEED_OWNER__) || '_') || 'f' || printf('%03d', i), ('seed_' || hex(__SEED_OWNER__) || '_') || 'c' || printf('%03d', i), 'lead',
	date(t.today, '-' || ((i - 101) % 3) || ' days'), 1, 'open'
FROM n, t;

-- Dormant customers (107–112): win-backs due now.
WITH RECURSIVE n(i) AS (SELECT 107 UNION ALL SELECT i + 1 FROM n WHERE i < 112),
t AS (SELECT date('now', '+7 hours') AS today)
INSERT INTO follow_up (owner_id, id, customer_id, kind, due_date, attempt, status)
SELECT __SEED_OWNER__, ('seed_' || hex(__SEED_OWNER__) || '_') || 'f' || printf('%03d', i), ('seed_' || hex(__SEED_OWNER__) || '_') || 'c' || printf('%03d', i), 'winback',
	date(t.today, '-' || (i - 107) || ' days'), 1, 'open'
FROM n, t;

-- Handled today (037–040): a closed follow-up and an outcome logged this morning.
WITH RECURSIVE n(i) AS (SELECT 37 UNION ALL SELECT i + 1 FROM n WHERE i < 40),
t AS (SELECT date('now', '+7 hours') AS today)
INSERT INTO follow_up (owner_id, id, customer_id, kind, due_date, attempt, contacted_at, status, outcome, completed_at)
SELECT __SEED_OWNER__, ('seed_' || hex(__SEED_OWNER__) || '_') || 'fd' || printf('%03d', i), ('seed_' || hex(__SEED_OWNER__) || '_') || 'c' || printf('%03d', i), 'reorder', t.today, 1,
	(cast(unixepoch('now', '-' || ((i - 36) * 20) || ' minutes') AS integer) * 1000) - 600000,
	'done',
	CASE i WHEN 37 THEN 'replied' WHEN 38 THEN 'interested' WHEN 39 THEN 'no_reply' ELSE 'not_interested' END,
	(cast(unixepoch('now', '-' || ((i - 36) * 20) || ' minutes') AS integer) * 1000)
FROM n, t;

-- Activity: account creation, every order, sends, outcomes.
INSERT INTO activity (owner_id, id, customer_id, type, created_at)
SELECT __SEED_OWNER__, ('seed_' || hex(__SEED_OWNER__) || '_') || 'a_new_' || substr(id, length(('seed_' || hex(__SEED_OWNER__) || '_')) + 1), id, 'customer_created', created_at
FROM customer WHERE owner_id = __SEED_OWNER__ AND instr(id, ('seed_' || hex(__SEED_OWNER__) || '_') || 'c') = 1;

INSERT INTO activity (owner_id, id, customer_id, type, order_id, created_at)
SELECT __SEED_OWNER__, ('seed_' || hex(__SEED_OWNER__) || '_') || 'a_' || substr(id, length(('seed_' || hex(__SEED_OWNER__) || '_')) + 1), customer_id, 'order', id, created_at
FROM customer_order WHERE owner_id = __SEED_OWNER__ AND instr(id, ('seed_' || hex(__SEED_OWNER__) || '_') || 'o') = 1;

INSERT INTO activity (owner_id, id, customer_id, type, follow_up_id, created_at)
SELECT __SEED_OWNER__, ('seed_' || hex(__SEED_OWNER__) || '_') || 'a_wa_' || substr(id, length(('seed_' || hex(__SEED_OWNER__) || '_')) + 1), customer_id, 'wa_sent', id, contacted_at
FROM follow_up WHERE owner_id = __SEED_OWNER__ AND instr(id, ('seed_' || hex(__SEED_OWNER__) || '_') || 'f') = 1 AND contacted_at IS NOT NULL;

-- A reminder that worked: a send at 09:00 Jakarta two days before every repeat order.
INSERT INTO activity (owner_id, id, customer_id, type, created_at)
SELECT __SEED_OWNER__, ('seed_' || hex(__SEED_OWNER__) || '_') || 'a_wa_o_' || substr(o.id, length(('seed_' || hex(__SEED_OWNER__) || '_')) + 2), o.customer_id, 'wa_sent',
	(cast(unixepoch(date(o.order_date, '-2 days'), '+2 hours') AS integer) * 1000)
FROM customer_order o
WHERE o.owner_id = __SEED_OWNER__ AND instr(o.id, ('seed_' || hex(__SEED_OWNER__) || '_') || 'o') = 1 AND EXISTS (
	SELECT 1 FROM customer_order e
	WHERE e.owner_id = o.owner_id AND e.customer_id = o.customer_id AND e.order_date < o.order_date
);

-- Sends that have not turned into an order yet: every third customer in 061–100, five days ago.
WITH RECURSIVE n(i) AS (SELECT 61 UNION ALL SELECT i + 1 FROM n WHERE i < 100)
INSERT INTO activity (owner_id, id, customer_id, type, created_at)
SELECT __SEED_OWNER__, ('seed_' || hex(__SEED_OWNER__) || '_') || 'a_wa_open_' || printf('%03d', i), ('seed_' || hex(__SEED_OWNER__) || '_') || 'c' || printf('%03d', i), 'wa_sent',
	(cast(unixepoch('now', '-5 days') AS integer) * 1000)
FROM n WHERE i % 3 = 0;

INSERT INTO activity (owner_id, id, customer_id, type, outcome, follow_up_id, created_at)
SELECT __SEED_OWNER__, ('seed_' || hex(__SEED_OWNER__) || '_') || 'a_out_' || substr(id, length(('seed_' || hex(__SEED_OWNER__) || '_')) + 1), customer_id, 'outcome', outcome, id, completed_at
FROM follow_up WHERE owner_id = __SEED_OWNER__ AND instr(id, ('seed_' || hex(__SEED_OWNER__) || '_') || 'fd') = 1;

-- Customer 001: notes and earlier attempts, for the long activity history.
WITH RECURSIVE k(j) AS (SELECT 1 UNION ALL SELECT j + 1 FROM k WHERE j < 8)
INSERT INTO activity (owner_id, id, customer_id, type, outcome, body, created_at)
SELECT __SEED_OWNER__, ('seed_' || hex(__SEED_OWNER__) || '_') || 'a_c001_' || j, ('seed_' || hex(__SEED_OWNER__) || '_') || 'c001',
	CASE j % 3 WHEN 0 THEN 'note' WHEN 1 THEN 'wa_sent' ELSE 'outcome' END,
	CASE WHEN j % 3 = 2 THEN 'replied' END,
	CASE WHEN j % 3 = 0 THEN 'Sudah ditelepon, minta dikirim minggu depan.' END,
	(cast(unixepoch('now', '-' || (j * 11) || ' days') AS integer) * 1000)
FROM k;
