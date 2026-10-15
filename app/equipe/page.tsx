import StaffGate from "@/components/staff-gate";
import TeamClient from "./TeamClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return <StaffGate returnTo="/equipe"><TeamClient /></StaffGate>;
}
