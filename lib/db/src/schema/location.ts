import { pgTable, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const locationSharesTable = pgTable("location_shares", {
  id: text("id").primaryKey(),
  creatorDeviceId: text("creator_device_id").notNull(),
  token: text("token").notNull().unique(),
  lat: real("lat"),
  lon: real("lon"),
  status: text("status", { enum: ["pending", "active", "expired"] })
    .notNull()
    .default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const insertLocationShareSchema = createInsertSchema(locationSharesTable).omit({
  createdAt: true,
});

export type InsertLocationShare = z.infer<typeof insertLocationShareSchema>;
export type LocationShare = typeof locationSharesTable.$inferSelect;
