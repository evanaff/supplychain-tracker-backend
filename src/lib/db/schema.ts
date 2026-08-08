import {
    pgTable,
    varchar,
    text,
    timestamp,
    index,
    uniqueIndex,
    integer,
    pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { boolean } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", [
    "ADMIN",
    "GROWER",
    "DISTRIBUTOR",
    "RETAILER",
]);

export const supplyChainActivityEnum = pgEnum(
    "supply_chain_activity",
    [
        "CREATED",
        "HARVESTING",
        "SHIPPING",
        "RECEIVING",
        "SELLING",
    ]
);

export const actors = pgTable(
    "actors",
    {
        blockchainAddress: varchar("blockchain_address", { length: 42 }).primaryKey(),
        
        locationGln: varchar("location_gln", { length: 13 }).notNull()
            .references(() => locations.gln),
        
            name: varchar("name", { length: 255 }).notNull(),
        role: roleEnum("role").notNull(),
    },
    (table) => ({
        roleIdx: index("idx_actor_role").on(table.role),
    })
);

export const locations = pgTable(
    "locations",
    {
        gln: varchar("gln", { length: 13 }).primaryKey(),
        name: varchar("name", { length: 255 }).notNull(),
        province: varchar("province", { length: 100 }).notNull(),
        city: varchar("city", { length: 100 }).notNull(),
        address: text("address").notNull(),
        allowedRole: roleEnum("allowed_role").notNull()
    }
);

export const products = pgTable(
    "products",
    {
        gtin: varchar("gtin", { length: 13 }).primaryKey(),
        varietyName: varchar("variety_name", { length: 255 }).notNull(),
        unitOfMeasure: varchar("unit_of_measure", { length: 20 }).notNull(),
        imageUrl: text("image_url").notNull(),
    }
);

export const traceProducts = pgTable(
    "trace_products",
    {
        id: varchar("id", { length: 50 }).primaryKey(),
        
        gtin: varchar("gtin", { length: 13 }).notNull()
            .references(() => products.gtin),

        creatorBlockchainAddress: varchar("creator_blockchain_address", { length: 42 }).notNull()
            .references(() => actors.blockchainAddress),

        currentOwnerBlockchainAddress: varchar("current_owner_blockchain_address", { length: 42 }).notNull()
            .references(() => actors.blockchainAddress),

        lotNumber: varchar("lot_number", { length: 100 }).notNull(),
        quantity: integer("quantity").notNull(),
        currentActivity: supplyChainActivityEnum("current_activity").notNull().default("CREATED"),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => ({
        gtinIdx: index("idx_trace_product_gtin").on(table.gtin),
        ownerIdx: index("idx_trace_product_owner").on(table.currentOwnerBlockchainAddress),
        currentActivityIdx: index("idx_trace_product_activity").on(table.currentActivity),
        uniqueLot: uniqueIndex("unique_gtin_lot").on(table.gtin, table.lotNumber),
    })
);

export const traceEvents = pgTable(
    "trace_events",
    {
        id: varchar("id", { length: 50 }).primaryKey(),

        traceProductId: varchar("trace_product_id", { length: 50 }).notNull()
            .references(() => traceProducts.id, {
                onDelete: "cascade",
            }),

        actorBlockchainAddress: varchar("actor_blockchain_address", { length: 42 }).notNull()
            .references(() => actors.blockchainAddress),

        destinationLocationGln: varchar("destination_location_gln", { length: 13 })
            .references(() => locations.gln),

        supplyChainActivity: supplyChainActivityEnum("supply_chain_activity").notNull(),
        timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
        txHash: text("tx_hash"),
        isRecorded: boolean("is_recorded").default(false).notNull()
    }
);

export const nonces = pgTable(
    "nonces",
    {
        address: varchar("address", { length: 42 }).notNull(),
        nonce: varchar("nonce", { length: 100 }).notNull(),
        expiresAt: timestamp("expires_at").notNull(),
    }
);

export const refreshTokens = pgTable(
    "refreshTokens",
    {
        address: varchar("address", { length: 42 }).notNull(),
        token: text("token")
            .notNull()
            .unique(),
    }
);

export const actorRelations = relations(
    actors,
    ({ one, many }) => ({
        location: one(
            locations,
            {
                fields: [actors.locationGln],
                references: [locations.gln],
            }
        ),

        createdTraceProducts: many(traceProducts, {
            relationName: "creator",
        }),

        ownedTraceProducts: many(traceProducts, {
            relationName: "owner",
        }),

        traceEvents: many(traceEvents),
    })
);

export const traceProductsRelations = relations(
    traceProducts,
    ({ one, many }) => ({
        creator: one(
            actors,
            {
                fields: [
                    traceProducts.creatorBlockchainAddress,
                ],
                references: [
                    actors.blockchainAddress,
                ],
            }
        ),

        owner: one(
            actors,
            {
                fields: [
                    traceProducts.currentOwnerBlockchainAddress,
                ],
                references: [
                    actors.blockchainAddress,
                ],
            }
        ),

        product: one(
            products,
            {
                fields: [
                    traceProducts.gtin,
                ],
                references: [
                    products.gtin,
                ],
            }
        ),

        events: many(traceEvents),
    })
);

export const traceEventsRelations = relations(
    traceEvents,
    ({ one }) => ({
        traceProduct: one(
            traceProducts,
            {
                fields: [
                    traceEvents.traceProductId,
                ],
                references: [
                    traceProducts.id,
                ],
            }
        ),

        actor: one(
            actors,
            {
                fields: [
                    traceEvents.actorBlockchainAddress,
                ],
                references: [
                    actors.blockchainAddress,
                ],
            }
        ),

        destinationLocation: one(
            locations,
            {
                fields: [
                    traceEvents.destinationLocationGln,
                ],
                references: [
                    locations.gln,
                ],
            }
        ),
    })
);
