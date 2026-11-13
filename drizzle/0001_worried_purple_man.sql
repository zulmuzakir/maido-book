CREATE TABLE `activity` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`type` text NOT NULL,
	`outcome` text,
	`body` text,
	`follow_up_id` text,
	`order_id` text,
	`user_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`follow_up_id`) REFERENCES `follow_up`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`order_id`) REFERENCES `customer_order`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `activity_customer_idx` ON `activity` (`customer_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `customer` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`dose_per_day` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'lead' NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customer_phone_unique` ON `customer` (`phone`);--> statement-breakpoint
CREATE INDEX `customer_status_idx` ON `customer` (`status`);--> statement-breakpoint
CREATE TABLE `customer_order` (
	`id` text PRIMARY KEY NOT NULL,
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
	FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `customer_order_customer_idx` ON `customer_order` (`customer_id`,`order_date`);--> statement-breakpoint
CREATE INDEX `customer_order_date_idx` ON `customer_order` (`order_date`);--> statement-breakpoint
CREATE TABLE `follow_up` (
	`id` text PRIMARY KEY NOT NULL,
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
	FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_id`) REFERENCES `customer_order`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `follow_up_status_due_idx` ON `follow_up` (`status`,`due_date`);--> statement-breakpoint
CREATE UNIQUE INDEX `follow_up_one_open_idx` ON `follow_up` (`customer_id`) WHERE status = 'open';--> statement-breakpoint
CREATE TABLE `message_template` (
	`kind` text PRIMARY KEY NOT NULL,
	`body` text NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `product` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`unit_label` text DEFAULT 'sachet' NOT NULL,
	`servings_per_unit` integer DEFAULT 1 NOT NULL,
	`price` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_name_unique` ON `product` (`name`);--> statement-breakpoint
CREATE TABLE `setting` (
	`id` integer PRIMARY KEY NOT NULL,
	`lead_days` integer DEFAULT 3 NOT NULL,
	`retry_days` integer DEFAULT 2 NOT NULL,
	`max_attempts` integer DEFAULT 3 NOT NULL,
	`winback_days` integer DEFAULT 30 NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
