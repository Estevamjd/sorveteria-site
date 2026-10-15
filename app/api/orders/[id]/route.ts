import { updateOrder } from "@/lib/order-store";
import { isStaff } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await isStaff()) return Response.json({ error: "Acesso restrito à equipe." }, { status: 403 });
  try {
    const { id } = await context.params;
    const number = Number(id);
    if (!Number.isInteger(number) || number < 1) return Response.json({ error: "Pedido inválido." }, { status: 400 });
    const body = await request.json() as { action?: string };
    if (!["preparing", "ready", "delivered", "cancelled", "paid"].includes(body.action ?? "")) return Response.json({ error: "Ação inválida." }, { status: 400 });
    const found = await updateOrder(number, body.action as "preparing" | "ready" | "delivered" | "cancelled" | "paid");
    return found ? Response.json({ ok: true }) : Response.json({ error: "Pedido não encontrado." }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível atualizar o pedido.";
    const clientError = /cancelado|etapa|pago/i.test(message);
    return Response.json({ error: clientError ? message : "Não foi possível atualizar o pedido." }, { status: clientError ? 400 : 503 });
  }
}
