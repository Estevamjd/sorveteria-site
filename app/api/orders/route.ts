import { createOrder, listOrders } from "@/lib/order-store";
import { isStaff } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!await isStaff()) return Response.json({ error: "Acesso restrito à equipe." }, { status: 403 });
  try {
    return Response.json({ orders: await listOrders() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Os pedidos estão indisponíveis no momento." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { customerName?: string; items?: { productId: string; quantity: number }[] };
    const order = await createOrder(body.customerName ?? "", body.items ?? []);
    return Response.json({ order }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível enviar o pedido.";
    const clientError = /nome|produto|quantidade|escolha/i.test(message);
    return Response.json({ error: clientError ? message : "Não foi possível enviar o pedido. Tente novamente." }, { status: clientError ? 400 : 503 });
  }
}
