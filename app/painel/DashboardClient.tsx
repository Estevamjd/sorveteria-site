"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { IceCream2, RefreshCw, TrendingUp, ShoppingBag, ReceiptText, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/catalog";
import type { Order } from "@/lib/order-store";

const dateKey = (date: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(date));
const hour = (date: string) => Number(new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", hourCycle: "h23" }).format(new Date(date)));

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [seeding, setSeeding] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/orders", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const result = await response.json() as { orders: Order[] };
      setOrders(result.orders);
      setError("");
    } catch {
      setError("Não foi possível atualizar o painel. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 10000);
    return () => window.clearInterval(timer);
  }, [refresh]);
  async function loadExamples() {
    setSeeding(true);
    try {
      const response = await fetch("/api/demo", { method: "POST" });
      if (!response.ok) throw new Error();
      await refresh();
    } catch {
      setError("Não foi possível carregar os dados de exemplo.");
    } finally {
      setSeeding(false);
    }
  }
  const analytics = useMemo(() => {
    const realPaid = orders.filter((order) => order.paidAt && !order.demo && order.status !== "cancelled");
    const demoMode = realPaid.length === 0;
    const paid = orders.filter((order) => order.paidAt && order.status !== "cancelled" && (demoMode ? order.demo : !order.demo));
    const today = dateKey(new Date().toISOString());
    const todayOrders = paid.filter((order) => dateKey(order.paidAt!) === today);
    const revenue = todayOrders.reduce((sum, order) => sum + order.totalCents, 0);
    const count = todayOrders.length;
    const units = todayOrders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
    const ranking = new Map<string, { name: string; units: number; revenue: number }>();
    for (const order of todayOrders) for (const item of order.items) {
      const previous = ranking.get(item.productId) ?? { name: item.productName, units: 0, revenue: 0 };
      previous.units += item.quantity;
      previous.revenue += item.quantity * item.unitPriceCents;
      ranking.set(item.productId, previous);
    }
    const top = [...ranking.values()].sort((a, b) => b.units - a.units || b.revenue - a.revenue);
    const byHour = Array.from({ length: 24 }, (_, index) => ({ hour: index, value: 0 }));
    for (const order of todayOrders) {
      const found = byHour.find((slot) => slot.hour === hour(order.paidAt!));
      if (found) found.value += order.totalCents;
    }
    return { demoMode, todayOrders, revenue, count, units, top, byHour };
  }, [orders]);
  const maxHour = Math.max(...analytics.byHour.map((slot) => slot.value), 1);
  const maxUnits = Math.max(...analytics.top.map((item) => item.units), 1);
  return <div className="staff-page dashboard-page">
    <header className="staff-header"><a className="brand" href="/"><span className="brand-mark"><IceCream2 size={22}/></span><span>Sorveteria <strong>Wesley</strong></span></a><nav><a href="/">Cardápio</a><a href="/equipe">Atendimento</a><a className="nav-active" href="/painel">Painel de vendas</a><a href="/qr">QR do cardápio</a></nav></header>
    <main className="staff-main"><div className="staff-title-row"><div><span className="eyebrow blue">VISÃO DO DIA</span><h1>Painel de vendas</h1><p>Os valores entram aqui quando a atendente marca o pedido como pago.</p></div><Button variant="outline" onClick={() => void refresh()}><RefreshCw size={16}/> Atualizar</Button></div>
      {error && <div className="staff-error" role="alert">{error}</div>}
      {analytics.demoMode && analytics.todayOrders.length > 0 && <div className="demo-notice">Prévia com pedidos de exemplo. As vendas reais aparecem aqui depois do primeiro pagamento.</div>}
      {!loading && analytics.demoMode && analytics.todayOrders.length === 0 && <div className="demo-start"><div><strong>Seu painel está pronto para receber vendas.</strong><p>Faça um pedido pelo cardápio ou carregue pedidos de exemplo para apresentar os números.</p></div><Button onClick={() => void loadExamples()} disabled={seeding}>{seeding ? "Carregando..." : "Carregar dados de exemplo"}</Button></div>}
      <div className="metric-grid"><article><span className="metric-icon"><TrendingUp size={21}/></span><p>Entrou hoje</p><strong>{formatMoney(analytics.revenue)}</strong><small>Pedidos marcados como pagos</small></article><article><span className="metric-icon"><ShoppingBag size={21}/></span><p>Pedidos pagos</p><strong>{analytics.count}</strong><small>Hoje</small></article><article><span className="metric-icon"><ReceiptText size={21}/></span><p>Valor médio</p><strong>{formatMoney(analytics.count ? Math.round(analytics.revenue / analytics.count) : 0)}</strong><small>Por pedido pago</small></article><article><span className="metric-icon"><Trophy size={21}/></span><p>Produtos vendidos</p><strong>{analytics.units}</strong><small>Unidades no dia</small></article></div>
      <div className="analytics-grid"><section className="analytics-card"><div className="analytics-card-heading"><h2>Vendas por horário</h2><span>Hoje</span></div><div className="hour-chart">{analytics.byHour.map((slot) => <div className="hour-slot" key={slot.hour}><div className="hour-bar-wrap"><div className="hour-bar" style={{ height: `${Math.max(analytics.count && slot.value ? 7 : 0, (slot.value / maxHour) * 100)}%` }} title={`${slot.hour}h: ${formatMoney(slot.value)}`} /></div><span>{slot.hour % 3 === 0 ? `${slot.hour}h` : ""}</span></div>)}</div><p className="chart-note">Somente valores de pedidos pagos.</p></section>
        <section className="analytics-card"><div className="analytics-card-heading"><h2>Mais vendidos</h2><span>Hoje</span></div>{analytics.top.length ? <div className="top-list">{analytics.top.slice(0, 5).map((item, index) => <div className="top-item" key={item.name}><span className="top-position">{String(index + 1).padStart(2, "0")}</span><div className="top-detail"><div><strong>{item.name}</strong><span>{item.units} {item.units === 1 ? "unidade" : "unidades"}</span></div><div className="top-track"><span style={{ width: `${(item.units / maxUnits) * 100}%` }}/></div></div><b>{formatMoney(item.revenue)}</b></div>)}</div> : <p className="analytics-empty">Os produtos mais vendidos aparecerão após o primeiro pagamento.</p>}</section></div>
      <section className="analytics-card paid-section"><div className="analytics-card-heading"><h2>Pedidos pagos hoje</h2><span>{analytics.count} no dia</span></div>{analytics.todayOrders.length ? <div className="paid-list">{analytics.todayOrders.slice(0, 8).map((order) => <div key={order.id}><span>#{String(order.id).padStart(3, "0")}</span><strong>{order.customerName}</strong><span>{order.items.reduce((sum, item) => sum + item.quantity, 0)} itens</span><b>{formatMoney(order.totalCents)}</b></div>)}</div> : <p className="analytics-empty">Nenhum pedido pago hoje.</p>}</section>
    </main>
  </div>;
}
