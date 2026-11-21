DROP INDEX `customer_order_customer_idx`;--> statement-breakpoint
CREATE INDEX `customer_order_customer_idx` ON `customer_order` (`customer_id`,`order_date`,`created_at`);--> statement-breakpoint
CREATE INDEX `activity_type_created_idx` ON `activity` (`type`,`created_at`);--> statement-breakpoint
CREATE INDEX `follow_up_completed_idx` ON `follow_up` (`completed_at`);