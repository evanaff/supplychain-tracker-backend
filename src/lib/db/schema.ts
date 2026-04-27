import {
  pgTable,
  varchar,
  text,
  timestamp,
  index,
  integer,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const locations = pgTable(
  'locations',
  {
    gln: varchar('gln', { length: 50 }).primaryKey(),
    name: varchar('name', { length: 50 }).notNull(),
    address: text('address'),
    type: varchar('type', { length: 20 }).notNull(),
  },
  (table) => ({
    typeIdx: index('idx_locations_type').on(table.type),
  })
);

export const actors = pgTable(
  'actors',
  {
    blockchainAddress: varchar('blockchain_address', { length: 42 }).primaryKey(),
    gln: varchar('gln', { length: 50 })
      .references(() => locations.gln, {
        onUpdate: 'cascade',
        onDelete: 'restrict',
      }),
    name: varchar('name', { length: 255 }).notNull(),
    role: varchar('role', { length: 20 }).notNull(),
  },
  (table) => ({
    glnIdx: index('idx_actors_gln').on(table.gln),
    roleIdx: index('idx_actors_role').on(table.role),
  }),
);

export const products = pgTable(
  'products',
  {
    productId: varchar('product_id', { length: 50 }).primaryKey(),
    ownerBlockchainAddress: varchar('owner_blockchain_address', { length: 42 })
      .notNull()
      .references(() => actors.blockchainAddress, {
        onUpdate: 'cascade',
        onDelete: 'restrict',
      }),
    gtin: varchar('gtin', { length: 50 }).notNull(),
    lotNumber: varchar('lot_number', { length: 100 }).notNull(),
    productName: varchar('product_name', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    ownerIdx: index('idx_products_owner').on(table.ownerBlockchainAddress),
    gtinIdx: index('idx_products_gtin').on(table.gtin),
  })
);

export const traceEvents = pgTable(
  'trace_events',
  {
    eventId: integer('event_id').primaryKey(),

    productId: varchar('product_id', { length: 50 })
      .notNull()
      .references(() => products.productId, {
        onUpdate: 'cascade',
        onDelete: 'cascade',
      }),

    actorBlockchainAddress: varchar('actor_blockchain_address', { length: 42 })
      .notNull()
      .references(() => actors.blockchainAddress, {
        onUpdate: 'cascade',
        onDelete: 'restrict',
      }),

    gln: varchar('gln', { length: 50 })
      .notNull()
      .references(() => locations.gln, {
        onUpdate: 'cascade',
        onDelete: 'restrict',
      }),

    supplychainStep: varchar('supplychain_step', { length: 100 }).notNull(),

    timestamp: timestamp('timestamp', { withTimezone: true })
      .notNull()
      .defaultNow(),

    dataHash: text('data_hash').notNull(),

    validationStatus: varchar('validation_status', { length: 20 })
      .notNull()
      .default('pending'),
  },
  (table) => ({
    productIdx: index('idx_trace_events_product_id').on(table.productId),
    actorIdx: index('idx_trace_events_actor').on(table.actorBlockchainAddress),
    glnIdx: index('idx_trace_events_gln').on(table.gln),
    timeIdx: index('idx_trace_events_timestamp').on(table.timestamp),
  })
);

export const nonces = pgTable("nonces", {
  address: varchar("address", { length: 42 }).notNull(),
  nonce: varchar("nonce", { length: 100 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const actorsRelations = relations(actors, ({ one }) => ({
  location: one(locations, {
    fields: [actors.gln],
    references: [locations.gln],
  }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  owner: one(actors, {
    fields: [products.ownerBlockchainAddress],
    references: [actors.blockchainAddress],
  }),
  events: many(traceEvents),
}));

export const traceEventsRelations = relations(traceEvents, ({ one }) => ({
  product: one(products, {
    fields: [traceEvents.productId],
    references: [products.productId],
  }),
  actor: one(actors, {
    fields: [traceEvents.actorBlockchainAddress],
    references: [actors.blockchainAddress],
  }),
  location: one(locations, {
    fields: [traceEvents.gln],
    references: [locations.gln],
  }),
}));