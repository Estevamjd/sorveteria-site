import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sorveteria Wesley | Peça pelo celular",
  description: "Escolha seu sorvete, envie o pedido e retire no balcão.",
  robots: { index: false, follow: false },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
