import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerName: text("customer_name").notNull(),
  status: text("status").notNull().default("new"),
  totalCents: integer("total_cents").notNull(),
  createdAt: text("created_at").notNull(),
  paidAt: text("paid_at"),
  demo: integer("demo", { mode: "boolean" }).notNull().default(false),
}, (table) => [
  index("idx_orders_created_at").on(table.createdAt),
  index("idx_orders_paid_at").on(table.paidAt),
]);

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: text("product_id").notNull(),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
}, (table) => [index("idx_order_items_order_id").on(table.orderId)]);
