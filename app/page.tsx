"use client";

import { useEffect, useMemo, useState } from "react";
import { IceCream2, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { formatMoney, products } from "@/lib/catalog";

const money = formatMoney;

export default function Home() {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [category, setCategory] = useState("Todos");
  const [cartOpen, setCartOpen] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [sentOrder, setSentOrder] = useState<number | null>(null);
  useEffect(() => {
    type ModelContext = { registerTool: (tool: {
      name: string;
      title: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute: (input: unknown) => Promise<unknown>;
    }, options: { signal: AbortSignal }) => void | Promise<void> };
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: "submit_ice_cream_order",
      title: "Enviar pedido de sorvete",
      description: "Envia um pedido real para a fila da atendente com nome do cliente, produtos e quantidades.",
      inputSchema: {
        type: "object",
        properties: {
          customerName: { type: "string", minLength: 2, maxLength: 60 },
          items: { type: "array", minItems: 1, items: { type: "object", properties: { productId: { type: "string", enum: products.map((product) => product.id) }, quantity: { type: "integer", minimum: 1, maximum: 30 } }, required: ["productId", "quantity"], additionalProperties: false } },
        },
        required: ["customerName", "items"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input) {
        const value = input as { customerName?: unknown; items?: unknown };
        if (!value || typeof value.customerName !== "string" || value.customerName.trim().length < 2 || !Array.isArray(value.items) || !value.items.length) throw new Error("Informe nome e pelo menos um produto.");
        const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerName: value.customerName, items: value.items }) });
        const result = await response.json() as { order?: { id: number; totalCents: number }; error?: string };
        if (!response.ok || !result.order) throw new Error(result.error ?? "Não foi possível enviar o pedido.");
        setCustomerName(value.customerName);
        setSentOrder(result.order.id);
        setQuantities({});
        setCartOpen(true);
        return { orderId: result.order.id, totalCents: result.order.totalCents, status: "enviado" };
      },
    }, { signal: lifecycle.signal })).catch(() => {});
    return () => lifecycle.abort();
  }, []);
  const items = useMemo(() => products.filter((product) => quantities[product.id] > 0), [quantities]);
  const count = items.reduce((sum, product) => sum + quantities[product.id], 0);
  const total = items.reduce((sum, product) => sum + quantities[product.id] * product.priceCents, 0);
  const visibleProducts = category === "Todos" ? products : products.filter((product) => product.category === category);
  const changeQuantity = (id: string, delta: number) => setQuantities((current) => ({ ...current, [id]: Math.max(0, Math.min(30, (current[id] ?? 0) + delta)) }));
  async function sendOrder() {
    if (customerName.trim().length < 2) { setSubmitError("Digite seu nome para a retirada."); return; }
    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName, items: items.map((product) => ({ productId: product.id, quantity: quantities[product.id] })) }),
      });
      const result = await response.json() as { order?: { id: number }; error?: string };
      if (!response.ok || !result.order) throw new Error(result.error ?? "Não foi possível enviar o pedido.");
      setSentOrder(result.order.id);
      setQuantities({});
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Não foi possível enviar o pedido.");
    } finally {
      setSubmitting(false);
    }
  }
  return <div className="site-shell">
    <header className="menu-header">
      <a className="brand" href="/" aria-label="Sorveteria Wesley, início"><span className="brand-mark"><IceCream2 size={22} strokeWidth={2.5}/></span><span>Sorveteria <strong>Wesley</strong></span></a>
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetTrigger asChild><Button className="header-cart"><ShoppingBag size={18}/> Meu pedido <span className="cart-count">{count}</span></Button></SheetTrigger>
        <SheetContent className="cart-sheet" side="right"><SheetHeader><SheetTitle>{sentOrder ? "Pedido enviado!" : checkout ? "Falta só seu nome" : "Seu pedido"}</SheetTitle><SheetDescription>{sentOrder ? "A equipe já recebeu seu pedido." : checkout ? "Vamos chamar você pelo nome quando estiver pronto." : "Confira os itens antes de enviar."}</SheetDescription></SheetHeader>
          {sentOrder ? <div className="sent-state"><div className="sent-icon">✓</div><span>PEDIDO Nº {sentOrder}</span><h3>Obrigado, {customerName.trim().split(" ")[0]}!</h3><p>Faça o pagamento no balcão e aguarde ser chamado pelo nome.</p><Button className="primary-action" onClick={() => { setSentOrder(null); setCheckout(false); setCustomerName(""); setCartOpen(false); }}>Voltar ao cardápio</Button></div> : <>
          <div className="cart-items">{items.length ? items.map((product) => <div className="cart-line" key={product.id}><div><strong>{product.name}</strong><small>{quantities[product.id]} × {money(product.priceCents)}</small></div><b>{money(quantities[product.id] * product.priceCents)}</b></div>) : <p className="empty-cart">Escolha seus sorvetes para começar.</p>}</div>
          <div className="cart-bottom"><div className="cart-total"><span>Total</span><strong>{money(total)}</strong></div>{checkout && <label className="checkout-label">Nome para retirada<input autoFocus value={customerName} onChange={(event) => setCustomerName(event.target.value)} maxLength={60} placeholder="Como podemos chamar você?" autoComplete="given-name" /></label>}{submitError && <p className="submit-error" role="alert">{submitError}</p>}<Button className="primary-action" disabled={!count || submitting} onClick={checkout ? sendOrder : () => setCheckout(true)}>{submitting ? "Enviando..." : checkout ? "Enviar pedido" : "Continuar pedido"}</Button><p>Pagamento no balcão • retirada pelo nome</p></div>
          </>}
        </SheetContent>
      </Sheet>
    </header>
    <main>
      <section className="hero"><div className="hero-copy"><span className="eyebrow">PEÇA AQUI • RETIRE NO BALCÃO</span><h1>Seu sorvete, sem esperar na fila.</h1><p>Escolha seus favoritos, envie o pedido e aguarde ser chamado pelo nome.</p><a className="hero-link" href="#cardapio">Ver cardápio <span aria-hidden="true">↓</span></a></div><div className="hero-photo" role="img" aria-label="Copo com bolas de sorvete de morango, baunilha e chocolate" /></section>
      <section className="catalog" id="cardapio"><div className="section-heading"><div><span className="eyebrow blue">ESCOLHA SEUS FAVORITOS</span><h2>Cardápio</h2></div><span className="demo-badge">Produtos e preços de exemplo</span></div>
        <div className="category-list" aria-label="Categorias">{["Todos", "Clássicos", "Especiais", "Picolés"].map((name) => <button key={name} className={category === name ? "category active" : "category"} onClick={() => setCategory(name)}>{name}</button>)}</div>
        <div className="product-grid">{visibleProducts.map((product) => <article className="product-card" key={product.id}><div className="product-visual" style={{ backgroundColor: product.color }}><span aria-hidden="true">{product.emoji}</span></div><div className="product-info"><div><h3>{product.name}</h3><p>{product.detail}</p></div><div className="product-bottom"><strong>{money(product.priceCents)}</strong>{quantities[product.id] ? <div className="quantity"><button onClick={() => changeQuantity(product.id, -1)} aria-label={`Remover um ${product.name}`}><Minus size={16}/></button><span>{quantities[product.id]}</span><button onClick={() => changeQuantity(product.id, 1)} aria-label={`Adicionar um ${product.name}`}><Plus size={16}/></button></div> : <button className="add-button" onClick={() => changeQuantity(product.id, 1)} aria-label={`Adicionar ${product.name}`}><Plus size={19}/></button>}</div></div></article>)}</div>
      </section>
      <section className="visit-section"><div><span className="eyebrow blue">NOS ENCONTRE</span><h2>Sorveteria Wesley, em Olaria</h2><p>Depois de fazer o pedido, é só pagar e retirar no balcão.</p></div><div className="visit-address"><strong>Rua Aurélio Garcindo, 37</strong><span>Olaria · Rio de Janeiro, RJ</span><a href="https://www.google.com/maps/search/?api=1&query=Sorveteria+Wesley+Rua+Aurelio+Garcindo+37+Olaria" target="_blank" rel="noreferrer">Ver no mapa</a></div></section>
    </main>
    {count > 0 && <button className="mobile-cart-bar" onClick={() => setCartOpen(true)}><span><ShoppingBag size={18}/> Ver pedido · {count} {count === 1 ? "item" : "itens"}</span><strong>{money(total)}</strong></button>}
    <footer className="site-footer"><span>Protótipo de demonstração • Sorveteria Wesley</span><span>Pagamento no balcão</span></footer>
  </div>;
}
