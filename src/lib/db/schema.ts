  import {
    pgTable,
    varchar,
    text,
    timestamp,
    index,
    integer,
    uniqueIndex,
    bigint
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
        }).notNull(),
      name: varchar('name', { length: 255 }).notNull(),
      role: varchar('role', { length: 20 }).notNull(),
    },
    (table) => ({
      glnIdx: index('idx_actors_gln').on(table.gln),
      roleIdx: index('idx_actors_role').on(table.role),
    }),
  );

  export const productTypes = pgTable(
    'product_types',
    {
      gtin: varchar('gtin', { length: 13 }).primaryKey(),
      name: varchar('name', { length: 50 }).notNull()
    }
  )

  export const products = pgTable(
    'products',
    {
      productId: bigint('product_id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
      creatorBlockchainAddress: varchar('creator_blockchain_address', { length: 42 })
        .notNull()
        .references(() => actors.blockchainAddress, {
          onUpdate: 'cascade',
          onDelete: 'restrict',
        }),
      gtin: varchar('gtin', { length: 13 })
        .notNull()
        .references(() => productTypes.gtin, {
          onUpdate: 'cascade',
          onDelete: 'restrict',
        }),
      lotNumber: varchar('lot_number', { length: 100 }).notNull(),
      createdAt: timestamp('created_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (table) => ({
      ownerIdx: index('idx_products_owner').on(table.creatorBlockchainAddress),
      gtinIdx: index('idx_products_gtin').on(table.gtin),
      uniqueLot: uniqueIndex('unique_gtin_lot').on(table.gtin, table.lotNumber)
    })
  );

  export const traceEvents = pgTable(
    'trace_events',
    {
      eventId: bigint('event_id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),

      productId: bigint('product_id', { mode: 'number' })
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

      dataHash: text('data_hash'),
      
      txHash: text('tx_hash'),
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
      fields: [products.creatorBlockchainAddress],
      references: [actors.blockchainAddress],
    }),
    gtin: one(productTypes, {
      fields: [products.gtin],
      references: [productTypes.gtin]
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