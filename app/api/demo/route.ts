import { seedDemoOrders } from "@/lib/order-store";
import { isStaff } from "@/lib/staff-auth";

export async function POST() {
  if (!await isStaff()) return Response.json({ error: "Acesso restrito à equipe." }, { status: 403 });
  try {
    const inserted = await seedDemoOrders();
    return Response.json({ inserted });
  } catch {
    return Response.json({ error: "Não foi possível carregar os dados de exemplo." }, { status: 503 });
  }
}
