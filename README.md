# Sorveteria — pedidos pelo celular

Sistema web para uma sorveteria receber pedidos pelo celular via QR code, sem fila no balcão.

## Problema
Em horário de pico, o cliente espera na fila só para fazer o pedido. A equipe perde controle do que está em preparo e o dono não vê as vendas do dia.

## Funcionalidades
- **Cardápio digital** com categorias, carrinho e envio do pedido com o nome do cliente
- **QR code** do cardápio para colocar nas mesas e no balcão (`/qr`)
- **Fila da equipe** (`/equipe`): colunas Novos → Em preparo → Prontos para retirar
- **Painel de vendas** (`/painel`) com indicadores do dia
- Layout mobile-first

## Stack
Next.js (vinext) · React · TypeScript · Tailwind CSS · shadcn/ui · Drizzle ORM · Cloudflare D1

## Rodar localmente
```bash
npm install
cp .env.example .env
npm run dev
```
