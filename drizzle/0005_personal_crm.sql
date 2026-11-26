-- Shared CRM data must be preserved instead of silently assigning it to a user.
CREATE TABLE crm_migration_guard (
	safe INTEGER NOT NULL CONSTRAINT legacy_crm_requires_explicit_ownership CHECK (safe = 1)
);
--> statement-breakpoint
WITH defaults(kind, body) AS (VALUES
	('reorder', 'Halo Kak {nama}, ini {cs}. Stok {produk} Kakak kira-kira tinggal beberapa hari lagi. Mau sekalian disiapkan order berikutnya supaya minumnya nggak terputus?'),
	('retry', 'Halo Kak {nama}, {cs} lagi ya. Kemarin sempat tanya soal {produk}. Kalau mau lanjut order, kabari saja ya Kak.'),
	('lead', 'Halo Kak {nama}, ini {cs}. Terima kasih sudah tertarik dengan {produk}. Ada yang bisa {cs} bantu jelaskan?'),
	('winback', 'Halo Kak {nama}, apa kabar? Sudah lama nggak minum {produk} ya. Kalau mau mulai lagi, {cs} siap bantu.'),
	('closing', 'Halo Kak {nama}, ini {cs}. Kemarin Kakak sempat tertarik dengan {produk}. Mau {cs} bantu siapkan ordernya sekarang?')
)
INSERT INTO crm_migration_guard(safe)
SELECT 0 WHERE EXISTS (SELECT 1 FROM customer)
OR EXISTS (SELECT 1 FROM customer_order)
OR EXISTS (SELECT 1 FROM follow_up)
OR EXISTS (SELECT 1 FROM activity)
OR EXISTS (SELECT 1 FROM product WHERE NOT (id = 'prod_roove' AND name = 'ROOVE' AND unit_label = 'sachet' AND servings_per_unit = 1 AND price = 10100 AND active = 1))
OR EXISTS (SELECT 1 FROM setting WHERE NOT (id = 1 AND lead_days = 3 AND retry_days = 2 AND max_attempts = 3 AND winback_days = 30))
OR EXISTS (
	SELECT 1 FROM message_template m
	WHERE NOT EXISTS (SELECT 1 FROM defaults d WHERE d.kind = m.kind AND d.body = m.body)
);
--> statement-breakpoint
DROP TABLE crm_migration_guard;
--> statement-breakpoint
DROP TABLE activity;
--> statement-breakpoint
DROP TABLE follow_up;
--> statement-breakpoint
DROP TABLE customer_order;
--> statement-breakpoint
DROP TABLE customer;
--> statement-breakpoint
DROP TABLE product;
--> statement-breakpoint
DROP TABLE message_template;
--> statement-breakpoint
DROP TABLE setting;
--> statement-breakpoint
CREATE TABLE `customer` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	name text NOT NULL,
	phone text NOT NULL,
	dose_per_day integer DEFAULT 1 NOT NULL,
	status text DEFAULT 'lead' NOT NULL,
	notes text,
	created_at integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	updated_at integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customer_owner_id_idx` ON `customer` (`owner_id`,`id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `customer_owner_phone_idx` ON `customer` (`owner_id`,`phone`);
--> statement-breakpoint
CREATE INDEX `customer_status_idx` ON `customer` (`owner_id`,`status`);
--> statement-breakpoint
CREATE TABLE `product` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	name text NOT NULL,
	unit_label text DEFAULT 'sachet' NOT NULL,
	servings_per_unit integer DEFAULT 1 NOT NULL,
	price integer DEFAULT 0 NOT NULL,
	active integer DEFAULT 1 NOT NULL,
	created_at integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_owner_id_idx` ON `product` (`owner_id`,`id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_owner_name_idx` ON `product` (`owner_id`,lower("name"));
--> statement-breakpoint
CREATE INDEX `product_owner_active_created_idx` ON `product` (`owner_id`,`active`,`created_at`);
--> statement-breakpoint
CREATE TABLE `setting` (
	`owner_id` text PRIMARY KEY NOT NULL,
	`lead_days` integer DEFAULT 3 NOT NULL,
	`retry_days` integer DEFAULT 2 NOT NULL,
	`max_attempts` integer DEFAULT 3 NOT NULL,
	`winback_days` integer DEFAULT 30 NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `message_template` (
	`owner_id` text NOT NULL,
	`kind` text NOT NULL,
	`body` text NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`owner_id`, `kind`),
	FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `customer_order` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`product_id` text NOT NULL,
	`order_date` text NOT NULL,
	`qty` integer NOT NULL,
	`dose_per_day` integer NOT NULL,
	`days_supply` integer NOT NULL,
	`total_paid` integer,
	`note` text,
	`created_by` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`owner_id`,`customer_id`) REFERENCES `customer`(`owner_id`,`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_id`,`product_id`) REFERENCES `product`(`owner_id`,`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "customer_order_owned_actor" CHECK("customer_order"."created_by" IS NULL OR "customer_order"."created_by" = "customer_order"."owner_id")
);
--> statement-breakpoint
CREATE INDEX `customer_order_customer_idx` ON `customer_order` (`owner_id`,`customer_id`,`order_date`,`created_at`);
--> statement-breakpoint
CREATE INDEX `customer_order_date_idx` ON `customer_order` (`owner_id`,`order_date`);
--> statement-breakpoint
CREATE INDEX `customer_order_product_idx` ON `customer_order` (`owner_id`,`product_id`);
--> statement-breakpoint
CREATE TABLE `follow_up` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`kind` text NOT NULL,
	`due_date` text NOT NULL,
	`attempt` integer DEFAULT 1 NOT NULL,
	`contacted_at` integer,
	`status` text DEFAULT 'open' NOT NULL,
	`outcome` text,
	`completed_at` integer,
	`order_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `customer_order`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`owner_id`,`customer_id`) REFERENCES `customer`(`owner_id`,`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `follow_up_status_due_idx` ON `follow_up` (`owner_id`,`status`,`due_date`);
--> statement-breakpoint
CREATE INDEX `follow_up_completed_idx` ON `follow_up` (`owner_id`,`completed_at`);
--> statement-breakpoint
CREATE UNIQUE INDEX `follow_up_one_open_idx` ON `follow_up` (`owner_id`,`customer_id`) WHERE status = 'open';
--> statement-breakpoint
CREATE TABLE `activity` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`type` text NOT NULL,
	`outcome` text,
	`body` text,
	`follow_up_id` text,
	`order_id` text,
	`user_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`follow_up_id`) REFERENCES `follow_up`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`order_id`) REFERENCES `customer_order`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`owner_id`,`customer_id`) REFERENCES `customer`(`owner_id`,`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "activity_owned_actor" CHECK("activity"."user_id" IS NULL OR "activity"."user_id" = "activity"."owner_id")
);
--> statement-breakpoint
CREATE INDEX `activity_customer_idx` ON `activity` (`owner_id`,`customer_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX `activity_type_created_idx` ON `activity` (`owner_id`,`type`,`created_at`);
--> statement-breakpoint
CREATE TRIGGER crm_follow_up_links_before_insert
BEFORE INSERT ON follow_up
WHEN NEW.order_id IS NOT NULL AND NOT EXISTS (
	SELECT 1 FROM customer_order
	WHERE id = NEW.order_id AND owner_id = NEW.owner_id AND customer_id = NEW.customer_id
)
BEGIN
	SELECT RAISE(ABORT, 'CRM link must belong to the same customer and owner');
END;
--> statement-breakpoint
CREATE TRIGGER crm_activity_links_before_insert
BEFORE INSERT ON activity
WHEN NEW.order_id IS NOT NULL AND NOT EXISTS (
	SELECT 1 FROM customer_order
	WHERE id = NEW.order_id AND owner_id = NEW.owner_id AND customer_id = NEW.customer_id
)
OR NEW.follow_up_id IS NOT NULL AND NOT EXISTS (
	SELECT 1 FROM follow_up
	WHERE id = NEW.follow_up_id AND owner_id = NEW.owner_id AND customer_id = NEW.customer_id
)
BEGIN
	SELECT RAISE(ABORT, 'CRM link must belong to the same customer and owner');
END;
--> statement-breakpoint
CREATE TRIGGER crm_follow_up_links_before_update
BEFORE UPDATE OF owner_id, customer_id, order_id ON follow_up
WHEN NEW.order_id IS NOT NULL AND NOT EXISTS (
	SELECT 1 FROM customer_order
	WHERE id = NEW.order_id AND owner_id = NEW.owner_id AND customer_id = NEW.customer_id
)
BEGIN
	SELECT RAISE(ABORT, 'CRM link must belong to the same customer and owner');
END;
--> statement-breakpoint
CREATE TRIGGER crm_activity_links_before_update
BEFORE UPDATE OF owner_id, customer_id, order_id, follow_up_id ON activity
WHEN NEW.order_id IS NOT NULL AND NOT EXISTS (
	SELECT 1 FROM customer_order
	WHERE id = NEW.order_id AND owner_id = NEW.owner_id AND customer_id = NEW.customer_id
)
OR NEW.follow_up_id IS NOT NULL AND NOT EXISTS (
	SELECT 1 FROM follow_up
	WHERE id = NEW.follow_up_id AND owner_id = NEW.owner_id AND customer_id = NEW.customer_id
)
BEGIN
	SELECT RAISE(ABORT, 'CRM link must belong to the same customer and owner');
END;
--> statement-breakpoint
CREATE TRIGGER crm_defaults_after_setting_insert AFTER INSERT ON setting
BEGIN
	INSERT INTO product(id, owner_id, name, unit_label, servings_per_unit, price, active)
	VALUES ('prod_roove:' || NEW.owner_id, NEW.owner_id, 'ROOVE', 'sachet', 1, 10100, 1);
	INSERT INTO message_template(owner_id, kind, body) VALUES
		(NEW.owner_id, 'reorder', 'Halo Kak {nama}, ini {cs}. Stok {produk} Kakak kira-kira tinggal beberapa hari lagi. Mau sekalian disiapkan order berikutnya supaya minumnya nggak terputus?'),
		(NEW.owner_id, 'retry', 'Halo Kak {nama}, {cs} lagi ya. Kemarin sempat tanya soal {produk}. Kalau mau lanjut order, kabari saja ya Kak.'),
		(NEW.owner_id, 'lead', 'Halo Kak {nama}, ini {cs}. Terima kasih sudah tertarik dengan {produk}. Ada yang bisa {cs} bantu jelaskan?'),
		(NEW.owner_id, 'winback', 'Halo Kak {nama}, apa kabar? Sudah lama nggak minum {produk} ya. Kalau mau mulai lagi, {cs} siap bantu.'),
		(NEW.owner_id, 'closing', 'Halo Kak {nama}, ini {cs}. Kemarin Kakak sempat tertarik dengan {produk}. Mau {cs} bantu siapkan ordernya sekarang?');
END;
--> statement-breakpoint
CREATE TRIGGER crm_setting_after_user_insert AFTER INSERT ON "user"
BEGIN
	INSERT INTO setting(owner_id) VALUES (NEW.id);
END;
--> statement-breakpoint
INSERT INTO setting(owner_id) SELECT id FROM "user";