import { relations, sql } from 'drizzle-orm';
import {
	sqliteTable,
	text,
	integer,
	index,
	uniqueIndex,
	foreignKey,
	primaryKey,
	check
} from 'drizzle-orm/sqlite-core';
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

const ownerId = () => text('owner_id').notNull();
const accountOwnerId = () => ownerId().references(() => user.id, { onDelete: 'cascade' });

export const product = sqliteTable(
	'product',
	{
		id: id(),
		ownerId: accountOwnerId(),
		name: text('name').notNull(),
		unitLabel: text('unit_label').notNull().default('sachet'),
		servingsPerUnit: integer('servings_per_unit').notNull().default(1),
		price: integer('price').notNull().default(0),
		active: integer('active', { mode: 'boolean' }).notNull().default(true),
		createdAt: createdAt()
	},
	(t) => [
		uniqueIndex('product_owner_id_idx').on(t.ownerId, t.id),
		uniqueIndex('product_owner_name_idx').on(t.ownerId, sql`lower(${t.name})`),
		index('product_owner_active_created_idx').on(t.ownerId, t.active, t.createdAt)
	]
);

export const customer = sqliteTable(
	'customer',
	{
		id: id(),
		ownerId: accountOwnerId(),
		name: text('name').notNull(),
		phone: text('phone').notNull(),
		dosePerDay: integer('dose_per_day').notNull().default(1),
		status: text('status', { enum: CUSTOMER_STATUSES }).notNull().default('lead'),
		notes: text('notes'),
		createdAt: createdAt(),
		updatedAt: updatedAt()
	},
	(t) => [
		uniqueIndex('customer_owner_id_idx').on(t.ownerId, t.id),
		uniqueIndex('customer_owner_phone_idx').on(t.ownerId, t.phone),
		index('customer_status_idx').on(t.ownerId, t.status)
	]
);

export const customerOrder = sqliteTable(
	'customer_order',
	{
		id: id(),
		ownerId: ownerId(),
		customerId: text('customer_id').notNull(),
		productId: text('product_id').notNull(),
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
		foreignKey({
			columns: [t.ownerId, t.customerId],
			foreignColumns: [customer.ownerId, customer.id]
		}).onDelete('cascade'),
		foreignKey({
			columns: [t.ownerId, t.productId],
			foreignColumns: [product.ownerId, product.id]
		}).onDelete('no action'),
		check(
			'customer_order_owned_actor',
			sql`${t.createdBy} IS NULL OR ${t.createdBy} = ${t.ownerId}`
		),
		// Covers the "latest order" lookup (order_date desc, created_at desc) without a sort.
		index('customer_order_customer_idx').on(t.ownerId, t.customerId, t.orderDate, t.createdAt),
		index('customer_order_date_idx').on(t.ownerId, t.orderDate),
		index('customer_order_product_idx').on(t.ownerId, t.productId)
	]
);

export const followUp = sqliteTable(
	'follow_up',
	{
		id: id(),
		ownerId: ownerId(),
		customerId: text('customer_id').notNull(),
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
		foreignKey({
			columns: [t.ownerId, t.customerId],
			foreignColumns: [customer.ownerId, customer.id]
		}).onDelete('cascade'),
		index('follow_up_status_due_idx').on(t.ownerId, t.status, t.dueDate),
		index('follow_up_completed_idx').on(t.ownerId, t.completedAt),
		uniqueIndex('follow_up_one_open_idx')
			.on(t.ownerId, t.customerId)
			.where(sql`status = 'open'`)
	]
);

export const activity = sqliteTable(
	'activity',
	{
		id: id(),
		ownerId: ownerId(),
		customerId: text('customer_id').notNull(),
		type: text('type', { enum: ACTIVITY_TYPES }).notNull(),
		outcome: text('outcome', { enum: FOLLOW_UP_OUTCOMES }),
		body: text('body'),
		followUpId: text('follow_up_id').references(() => followUp.id, { onDelete: 'set null' }),
		orderId: text('order_id').references(() => customerOrder.id, { onDelete: 'set null' }),
		userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
		createdAt: createdAt()
	},
	(t) => [
		foreignKey({
			columns: [t.ownerId, t.customerId],
			foreignColumns: [customer.ownerId, customer.id]
		}).onDelete('cascade'),
		check('activity_owned_actor', sql`${t.userId} IS NULL OR ${t.userId} = ${t.ownerId}`),
		index('activity_customer_idx').on(t.ownerId, t.customerId, t.createdAt),
		// Today's and this month's activity by type: the queue progress and insights counts.
		index('activity_type_created_idx').on(t.ownerId, t.type, t.createdAt)
	]
);

export const setting = sqliteTable('setting', {
	ownerId: accountOwnerId().primaryKey(),
	leadDays: integer('lead_days').notNull().default(3),
	retryDays: integer('retry_days').notNull().default(2),
	maxAttempts: integer('max_attempts').notNull().default(3),
	winbackDays: integer('winback_days').notNull().default(30),
	updatedAt: updatedAt()
});

export const messageTemplate = sqliteTable(
	'message_template',
	{
		ownerId: accountOwnerId(),
		kind: text('kind', { enum: FOLLOW_UP_KINDS }).notNull(),
		body: text('body').notNull(),
		updatedAt: updatedAt()
	},
	(t) => [primaryKey({ columns: [t.ownerId, t.kind] })]
);

export const customerRelations = relations(customer, ({ many }) => ({
	orders: many(customerOrder),
	followUps: many(followUp),
	activities: many(activity)
}));

export const customerOrderRelations = relations(customerOrder, ({ one }) => ({
	customer: one(customer, {
		fields: [customerOrder.ownerId, customerOrder.customerId],
		references: [customer.ownerId, customer.id]
	}),
	product: one(product, {
		fields: [customerOrder.ownerId, customerOrder.productId],
		references: [product.ownerId, product.id]
	})
}));

export const followUpRelations = relations(followUp, ({ one }) => ({
	customer: one(customer, {
		fields: [followUp.ownerId, followUp.customerId],
		references: [customer.ownerId, customer.id]
	})
}));

export const activityRelations = relations(activity, ({ one }) => ({
	customer: one(customer, {
		fields: [activity.ownerId, activity.customerId],
		references: [customer.ownerId, customer.id]
	})
}));
