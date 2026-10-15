export const products = [
  { id: "casquinha", name: "Casquinha mista", detail: "Baunilha e chocolate", priceCents: 800, category: "Clássicos", emoji: "🍦", color: "#fae4ac" },
  { id: "copo", name: "Copo de morango", detail: "2 bolas de sorvete", priceCents: 1400, category: "Clássicos", emoji: "🍨", color: "#f8c6d1" },
  { id: "sundae", name: "Sundae de chocolate", detail: "Calda e farofa crocante", priceCents: 1600, category: "Especiais", emoji: "🍫", color: "#e9c8aa" },
  { id: "milkshake", name: "Milk-shake de morango", detail: "Cremoso, 400 ml", priceCents: 1900, category: "Especiais", emoji: "🥤", color: "#f6bed0" },
  { id: "picole", name: "Picolé de frutas", detail: "Sabor uva", priceCents: 700, category: "Picolés", emoji: "🍓", color: "#ffd2bd" },
  { id: "chocolate", name: "Picolé de chocolate", detail: "Cobertura crocante", priceCents: 900, category: "Picolés", emoji: "🍧", color: "#d9c2aa" },
] as const;

export const formatMoney = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
