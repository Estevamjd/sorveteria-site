import { chatGPTSignInPath, getChatGPTUser } from "@/app/chatgpt-auth";
import { isStaff } from "@/lib/staff-auth";

export default async function StaffGate({ children, returnTo }: { children: React.ReactNode; returnTo: string }) {
  const user = await getChatGPTUser();
  if (!user) return <main className="staff-gate"><div><span className="eyebrow blue">ÁREA RESTRITA</span><h1>Acesso da equipe</h1><p>Entre com a conta autorizada para acompanhar pedidos e vendas.</p><a href={chatGPTSignInPath(returnTo)} target="_top">Entrar com ChatGPT</a><p className="staff-gate-small">Clientes podem pedir pelo cardápio sem fazer login.</p></div></main>;
  if (!await isStaff()) return <main className="staff-gate"><div><span className="eyebrow blue">ÁREA RESTRITA</span><h1>Acesso não autorizado</h1><p>Esta conta não tem permissão para ver os pedidos da equipe.</p><a href="/">Voltar ao cardápio</a></div></main>;
  return <>{children}</>;
}
