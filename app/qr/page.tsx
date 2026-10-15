"use client";

import { IceCream2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QRPage() {
  return <div className="qr-page"><header className="staff-header"><a className="brand" href="/"><span className="brand-mark"><IceCream2 size={22}/></span><span>Sorveteria <strong>Wesley</strong></span></a><nav><a href="/">Cardápio</a><a href="/equipe">Atendimento</a><a href="/painel">Painel de vendas</a></nav></header>
    <main><div className="qr-intro"><span className="eyebrow blue">PARA MOSTRAR NA LOJA</span><h1>QR code do cardápio</h1><p>Imprima este cartaz e deixe no balcão ou nas mesas.</p><Button onClick={() => window.print()}><Printer size={17}/> Imprimir cartaz</Button></div>
      <section className="qr-poster"><span className="poster-brand">SORVETERIA WESLEY</span><h2>Peça seu sorvete<br/>pelo celular</h2><p>Escaneie o código, escolha seus favoritos e retire pelo nome.</p><img src="/qr-cardapio.svg" alt="QR code para abrir o cardápio da Sorveteria Wesley" width="290" height="290"/><strong>Pagamento no balcão</strong><small>Protótipo de demonstração</small></section>
    </main>
  </div>;
}
