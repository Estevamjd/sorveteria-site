"use client";

import { useCallback, useEffect, useState } from "react";
import { IceCream2, Printer, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatMoney } from "@/lib/catalog";
import type { Order, OrderStatus } from "@/lib/order-store";

const steps: { key: OrderStatus; title: string; empty: string }[] = [
  { key: "new", title: "Novos pedidos", empty: "Aguardando pedidos" },
  { key: "preparing", title: "Em preparo", empty: "Nenhum em preparo" },
  { key: "ready", title: "Prontos para retirar", empty: "Nenhum pronto" },
];
const time = (date: string) => new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(date));

export default function TeamPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/orders", { cache: "no-store" });
      if (!response.ok) throw new Error("Não foi possível carregar os pedidos.");
      const result = await response.json() as { orders: Order[] };
      setOrders(result.orders);
      setError("");
    } catch {
      setError("A fila está indisponível. Tente atualizar novamente.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 5000);
    return () => window.clearInterval(timer);
  }, [refresh]);
  async function act(order: Order, action: "preparing" | "ready" | "delivered" | "cancelled" | "paid") {
    setBusyId(order.id);
    try {
      const response = await fetch(`/api/orders/${order.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível atualizar.");
      await refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Não foi possível atualizar.");
    } finally {
      setBusyId(null);
    }
  }
  const active = orders.filter((order) => !["delivered", "cancelled"].includes(order.status));
  return <div className="staff-page">
    <header className="staff-header"><a className="brand" href="/"><span className="brand-mark"><IceCream2 size={22}/></span><span>Sorveteria <strong>Wesley</strong></span></a><nav><a href="/">Cardápio</a><a className="nav-active" href="/equipe">Atendimento</a><a href="/painel">Painel de vendas</a><a href="/qr">QR do cardápio</a></nav></header>
    <main className="staff-main"><div className="staff-title-row"><div><span className="eyebrow blue">ATENDIMENTO</span><h1>Fila de pedidos</h1><p>Os pedidos aparecem aqui automaticamente. Chame o cliente pelo nome quando estiver pronto.</p></div><div className="staff-title-actions"><span className="live-label">Atualização automática</span><Button variant="outline" onClick={() => void refresh()}><RefreshCw size={16}/> Atualizar</Button></div></div>
      {error && <div className="staff-error" role="alert">{error}</div>}
      <div className="queue-summary"><strong>{active.length}</strong><span>{active.length === 1 ? "pedido em andamento" : "pedidos em andamento"}</span><span className="summary-divider"/><strong>{active.filter((order) => order.status === "ready").length}</strong><span>prontos para retirar</span></div>
      <div className="queue-grid">{steps.map((step) => <section className="queue-column" key={step.key}><h2>{step.title}<span>{active.filter((order) => order.status === step.key).length}</span></h2><div className="queue-list">{active.filter((order) => order.status === step.key).map((order) => <article className="order-card" key={order.id}><div className="order-top"><span>#{String(order.id).padStart(3, "0")} · {time(order.createdAt)}</span><strong>{formatMoney(order.totalCents)}</strong></div><h3>{order.customerName}</h3><ul>{order.items.map((item) => <li key={item.productId}><span>{item.quantity}× {item.productName}</span></li>)}</ul><div className="order-tags"><span className={order.paidAt ? "paid" : "unpaid"}>{order.paidAt ? "Pago" : "A pagar no balcão"}</span>{order.demo && <span>Exemplo</span>}</div><div className="order-actions">
          <Dialog><DialogTrigger asChild><Button variant="outline" size="sm"><Printer size={15}/> Comanda</Button></DialogTrigger><DialogContent className="receipt-dialog"><DialogHeader><DialogTitle>Comanda do pedido</DialogTitle><DialogDescription>Comprovante para preparo e retirada. Não é nota fiscal.</DialogDescription></DialogHeader><div className="print-receipt"><div className="receipt-brand">SORVETERIA WESLEY</div><div className="receipt-sub">COMANDA • NÃO FISCAL</div><div className="receipt-rule"/><p><strong>Pedido #{String(order.id).padStart(3, "0")}</strong><br/>Nome: {order.customerName}<br/>Horário: {time(order.createdAt)}</p><div className="receipt-rule"/>{order.items.map((item) => <div className="receipt-item" key={item.productId}><span>{item.quantity}× {item.productName}</span><span>{formatMoney(item.quantity * item.unitPriceCents)}</span></div>)}<div className="receipt-rule"/><div className="receipt-total"><strong>Total</strong><strong>{formatMoney(order.totalCents)}</strong></div><p>{order.paidAt ? "PAGO" : "PAGAMENTO NO BALCÃO"}</p></div><Button onClick={() => window.print()}><Printer size={16}/> Imprimir comanda</Button></DialogContent></Dialog>
          {!order.paidAt && <Button variant="outline" size="sm" disabled={busyId === order.id} onClick={() => void act(order, "paid")}>Marcar pago</Button>}
          {order.status === "new" && <Button size="sm" disabled={busyId === order.id} onClick={() => void act(order, "preparing")}>Iniciar preparo</Button>}
          {order.status === "preparing" && <Button size="sm" disabled={busyId === order.id} onClick={() => void act(order, "ready")}>Marcar pronto</Button>}
          {order.status === "ready" && <Button size="sm" disabled={busyId === order.id} onClick={() => void act(order, "delivered")}>Entregue</Button>}
        </div></article>)}{!loading && !active.some((order) => order.status === step.key) && <p className="queue-empty">{step.empty}</p>}</div></section>)}</div>
      <section className="recent-section"><h2>Últimos concluídos</h2>{orders.filter((order) => order.status === "delivered").slice(0, 6).length ? <div className="recent-list">{orders.filter((order) => order.status === "delivered").slice(0, 6).map((order) => <div key={order.id}><span>#{String(order.id).padStart(3, "0")} · {order.customerName}</span><span>{order.demo ? "Exemplo" : order.paidAt ? "Pago" : "Pagamento pendente"}</span><strong>{formatMoney(order.totalCents)}</strong></div>)}</div> : <p className="queue-empty">Os pedidos entregues aparecem aqui.</p>}</section>
    </main>
  </div>;
}
