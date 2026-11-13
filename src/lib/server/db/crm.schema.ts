import { relations, sql } from 'drizzle-orm';
import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import {
	ACTIVITY_TYPES,
	CUSTOMER_STATUSES,
	FOLLOW_UP_KINDS,
	FOLLOW_UP_OUTCOMES,
	FOLLOW_UP_STATUSES
} from '#lib/domain/types.ts';
import { user } from './auth.schema';

const id = () =>
	text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
	integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull();

const updatedAt = () =>
	integer('updated_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull();

export const product = sqliteTable('product', {
	id: id(),
	name: text('name').notNull().unique(),
	unitLabel: text('unit_label').notNull().default('sachet'),
	servingsPerUnit: integer('servings_per_unit').notNull().default(1),
	price: integer('price').notNull().default(0),
	active: integer('active', { mode: 'boolean' }).notNull().default(true),
	createdAt: createdAt()
});

export const customer = sqliteTable(
	'customer',
	{
		id: id(),
		name: text('name').notNull(),
		phone: text('phone').notNull().unique(),
		dosePerDay: integer('dose_per_day').notNull().default(1),
		status: text('status', { enum: CUSTOMER_STATUSES }).notNull().default('lead'),
		notes: text('notes'),
		createdAt: createdAt(),
		updatedAt: updatedAt()
	},
	(t) => [index('customer_status_idx').on(t.status)]
);

export const customerOrder = sqliteTable(
	'customer_order',
	{
		id: id(),
		customerId: text('customer_id')
			.notNull()
			.references(() => customer.id, { onDelete: 'cascade' }),
		productId: text('product_id')
			.notNull()
			.references(() => product.id, { onDelete: 'restrict' }),
		orderDate: text('order_date').notNull(),
		qty: integer('qty').notNull(),
		dosePerDay: integer('dose_per_day').notNull(),
		daysSupply: integer('days_supply').notNull(),
		totalPaid: integer('total_paid'),
		note: text('note'),
		createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
		createdAt: createdAt()
	},
	(t) => [
		index('customer_order_customer_idx').on(t.customerId, t.orderDate),
		index('customer_order_date_idx').on(t.orderDate)
	]
);

export const followUp = sqliteTable(
	'follow_up',
	{
		id: id(),
		customerId: text('customer_id')
			.notNull()
			.references(() => customer.id, { onDelete: 'cascade' }),
		kind: text('kind', { enum: FOLLOW_UP_KINDS }).notNull(),
		dueDate: text('due_date').notNull(),
		attempt: integer('attempt').notNull().default(1),
		contactedAt: integer('contacted_at', { mode: 'timestamp_ms' }),
		status: text('status', { enum: FOLLOW_UP_STATUSES }).notNull().default('open'),
		outcome: text('outcome', { enum: FOLLOW_UP_OUTCOMES }),
		completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
		orderId: text('order_id').references(() => customerOrder.id, { onDelete: 'set null' }),
		createdAt: createdAt()
	},
	(t) => [
		index('follow_up_status_due_idx').on(t.status, t.dueDate),
		uniqueIndex('follow_up_one_open_idx')
			.on(t.customerId)
			.where(sql`status = 'open'`)
	]
);

export const activity = sqliteTable(
	'activity',
	{
		id: id(),
		customerId: text('customer_id')
			.notNull()
			.references(() => customer.id, { onDelete: 'cascade' }),
		type: text('type', { enum: ACTIVITY_TYPES }).notNull(),
		outcome: text('outcome', { enum: FOLLOW_UP_OUTCOMES }),
		body: text('body'),
		followUpId: text('follow_up_id').references(() => followUp.id, { onDelete: 'set null' }),
		orderId: text('order_id').references(() => customerOrder.id, { onDelete: 'set null' }),
		userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
		createdAt: createdAt()
	},
	(t) => [index('activity_customer_idx').on(t.customerId, t.createdAt)]
);

export const setting = sqliteTable('setting', {
	id: integer('id').primaryKey(),
	leadDays: integer('lead_days').notNull().default(3),
	retryDays: integer('retry_days').notNull().default(2),
	maxAttempts: integer('max_attempts').notNull().default(3),
	winbackDays: integer('winback_days').notNull().default(30),
	updatedAt: updatedAt()
});

export const messageTemplate = sqliteTable('message_template', {
	kind: text('kind', { enum: FOLLOW_UP_KINDS }).primaryKey(),
	body: text('body').notNull(),
	updatedAt: updatedAt()
});

export const customerRelations = relations(customer, ({ many }) => ({
	orders: many(customerOrder),
	followUps: many(followUp),
	activities: many(activity)
}));

export const customerOrderRelations = relations(customerOrder, ({ one }) => ({
	customer: one(customer, { fields: [customerOrder.customerId], references: [customer.id] }),
	product: one(product, { fields: [customerOrder.productId], references: [product.id] })
}));

export const followUpRelations = relations(followUp, ({ one }) => ({
	customer: one(customer, { fields: [followUp.customerId], references: [customer.id] })
}));

export const activityRelations = relations(activity, ({ one }) => ({
	customer: one(customer, { fields: [activity.customerId], references: [customer.id] })
}));
