import {
    pgTable,
    varchar,
    text,
    timestamp,
    index,
    uniqueIndex,
    bigint
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { pgEnum } from 'drizzle-orm/pg-core';

export const onChainStatusEnum = pgEnum(
    "on_chain_status",
    [
        "PENDING",
        "INVALID",
        "VERIFIED"
    ]
);

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

export const products = pgTable(
    'products',
    {
        gtin: varchar('gtin', { length: 13 }).primaryKey(),
        name: varchar('name', { length: 50 }).notNull(),
        imageUrl: text('image_url').notNull()
    }
)

export const traceProducts = pgTable(
    'trace_products',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
        creatorBlockchainAddress: varchar('creator_blockchain_address', { length: 42 })
            .notNull()
            .references(() => actors.blockchainAddress, {
                onUpdate: 'cascade',
                onDelete: 'restrict',
            }),
        gtin: varchar('gtin', { length: 13 })
            .notNull()
            .references(() => products.gtin, {
                onUpdate: 'cascade',
                onDelete: 'restrict',
            }),
        lotNumber: varchar('lot_number', { length: 100 }).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (table) => ({
        gtinIdx: index('idx_products_gtin').on(table.gtin),
        uniqueLot: uniqueIndex('unique_gtin_lot').on(table.gtin, table.lotNumber)
    })
);

export const traceEvents = pgTable(
    'trace_events',
    {
        id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),

        traceProductId: bigint('trace_product_id', { mode: 'number' })
            .notNull()
            .references(() => traceProducts.id, {
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

        txHash: text('tx_hash'),
        onChainStatus: onChainStatusEnum('on_chain_status')
            .notNull()
            .default("PENDING")
    },
    (table) => ({
        productIdx: index('idx_trace_events_product_id').on(table.traceProductId),
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

export const refreshTokens = pgTable("refreshTokens", {
    address: varchar("address", { length: 42 }).notNull(),
    token: text("token").notNull().unique()
});

export const actorsRelations = relations(actors, ({ one }) => ({
    location: one(locations, {
        fields: [actors.gln],
        references: [locations.gln],
    }),
}));

export const traceProductsRelations = relations(traceProducts, ({ one, many }) => ({
    owner: one(actors, {
        fields: [traceProducts.creatorBlockchainAddress],
        references: [actors.blockchainAddress]
    }),
    product: one(products, {
        fields: [traceProducts.gtin],
        references: [products.gtin]
    }),
    events: many(traceEvents),
}));

export const traceEventsRelations = relations(traceEvents, ({ one }) => ({
    traceProduct: one(traceProducts, {
        fields: [traceEvents.traceProductId],
        references: [traceProducts.id],
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