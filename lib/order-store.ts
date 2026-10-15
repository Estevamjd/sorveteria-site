import { env } from "cloudflare:workers";
import { products } from "@/lib/catalog";

export type OrderStatus = "new" | "preparing" | "ready" | "delivered" | "cancelled";
export type OrderItem = { productId: string; productName: string; quantity: number; unitPriceCents: number };
export type Order = {
  id: number;
  customerName: string;
  status: OrderStatus;
  totalCents: number;
  createdAt: string;
  paidAt: string | null;
  demo: boolean;
  items: OrderItem[];
};

function getDatabase(): D1Database {
  if (!env.DB) throw new Error("Banco de pedidos indisponível.");
  return env.DB;
}

type RawOrder = { id: number; customer_name: string; status: OrderStatus; total_cents: number; created_at: string; paid_at: string | null; demo: number };
type RawItem = { order_id: number; product_id: string; product_name: string; quantity: number; unit_price_cents: number };

export async function listOrders(): Promise<Order[]> {
  const db = getDatabase();
  const orderRows = await db.prepare("SELECT id, customer_name, status, total_cents, created_at, paid_at, demo FROM orders ORDER BY id DESC LIMIT 200").all<RawOrder>();
  const rows = orderRows.results ?? [];
  if (!rows.length) return [];
  const itemRows = await db.prepare("SELECT order_id, product_id, product_name, quantity, unit_price_cents FROM order_items WHERE order_id IN (SELECT id FROM orders ORDER BY id DESC LIMIT 200) ORDER BY id").all<RawItem>();
  const itemMap = new Map<number, OrderItem[]>();
  for (const row of itemRows.results ?? []) {
    const items = itemMap.get(row.order_id) ?? [];
    items.push({ productId: row.product_id, productName: row.product_name, quantity: row.quantity, unitPriceCents: row.unit_price_cents });
    itemMap.set(row.order_id, items);
  }
  return rows.map((row) => ({
    id: row.id,
    customerName: row.customer_name,
    status: row.status,
    totalCents: row.total_cents,
    createdAt: row.created_at,
    paidAt: row.paid_at,
    demo: Boolean(row.demo),
    items: itemMap.get(row.id) ?? [],
  }));
}

export async function createOrder(customerName: string, selections: { productId: string; quantity: number }[], demo = false, paid = false): Promise<Order> {
  const name = customerName.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 60) throw new Error("Informe um nome com 2 a 60 caracteres.");
  if (!Array.isArray(selections) || selections.length < 1 || selections.length > products.length) throw new Error("Escolha pelo menos um produto.");
  const chosen = new Map<string, number>();
  for (const selection of selections) {
    if (typeof selection?.productId !== "string" || !Number.isInteger(selection.quantity) || selection.quantity < 1 || selection.quantity > 30) throw new Error("Quantidade inválida.");
    if (chosen.has(selection.productId)) throw new Error("Produto repetido no pedido.");
    chosen.set(selection.productId, selection.quantity);
  }
  const items = products.filter((product) => chosen.has(product.id)).map((product) => ({
    productId: product.id,
    productName: product.name,
    quantity: chosen.get(product.id)!,
    unitPriceCents: product.priceCents,
  }));
  if (items.length !== chosen.size) throw new Error("Produto não encontrado.");
  const totalCents = items.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);
  const now = new Date().toISOString();
  const db = getDatabase();
  const inserted = await db.prepare("INSERT INTO orders (customer_name, status, total_cents, created_at, paid_at, demo) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(name, paid ? "delivered" : "new", totalCents, now, paid ? now : null, demo ? 1 : 0).run();
  const id = Number(inserted.meta.last_row_id);
  if (!id) throw new Error("Não foi possível registrar o pedido.");
  try {
    await db.batch(items.map((item) => db.prepare("INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price_cents) VALUES (?, ?, ?, ?, ?)")
      .bind(id, item.productId, item.productName, item.quantity, item.unitPriceCents)));
  } catch (error) {
    await db.prepare("DELETE FROM orders WHERE id = ?").bind(id).run();
    throw error;
  }
  return { id, customerName: name, status: paid ? "delivered" : "new", totalCents, createdAt: now, paidAt: paid ? now : null, demo, items };
}

export async function updateOrder(id: number, action: "preparing" | "ready" | "delivered" | "cancelled" | "paid"): Promise<boolean> {
  const db = getDatabase();
  const row = await db.prepare("SELECT status, paid_at FROM orders WHERE id = ?").bind(id).first<{ status: OrderStatus; paid_at: string | null }>();
  if (!row) return false;
  if (action === "paid") {
    if (row.status === "cancelled") throw new Error("Pedido cancelado não pode ser pago.");
    if (!row.paid_at) await db.prepare("UPDATE orders SET paid_at = ? WHERE id = ?").bind(new Date().toISOString(), id).run();
    return true;
  }
  const transitions: Record<OrderStatus, OrderStatus[]> = {
    new: ["preparing", "cancelled"],
    preparing: ["ready", "cancelled"],
    ready: ["delivered", "cancelled"],
    delivered: [],
    cancelled: [],
  };
  if (!transitions[row.status].includes(action)) throw new Error("Essa etapa não está disponível para o pedido.");
  if (action === "cancelled" && row.paid_at) throw new Error("Pedido pago não pode ser cancelado nesta demonstração.");
  await db.prepare("UPDATE orders SET status = ? WHERE id = ?").bind(action, id).run();
  return true;
}

export async function seedDemoOrders(): Promise<number> {
  const db = getDatabase();
  const count = await db.prepare("SELECT COUNT(*) AS total FROM orders WHERE demo = 1").first<{ total: number }>();
  if ((count?.total ?? 0) > 0) return 0;
  const examples = [
    { name: "Mariana", items: [{ productId: "casquinha", quantity: 2 }, { productId: "picole", quantity: 1 }], hoursAgo: 4 },
    { name: "João", items: [{ productId: "copo", quantity: 2 }, { productId: "sundae", quantity: 1 }], hoursAgo: 3 },
    { name: "Ana", items: [{ productId: "milkshake", quantity: 1 }, { productId: "casquinha", quantity: 1 }], hoursAgo: 2 },
    { name: "Pedro", items: [{ productId: "casquinha", quantity: 2 }, { productId: "chocolate", quantity: 2 }], hoursAgo: 1 },
  ];
  for (const example of examples) {
    const order = await createOrder(example.name, example.items, true, true);
    const date = new Date(Date.now() - example.hoursAgo * 3600_000).toISOString();
    await db.prepare("UPDATE orders SET created_at = ?, paid_at = ? WHERE id = ?").bind(date, date, order.id).run();
  }
  return examples.length;
}
