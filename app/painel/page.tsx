import StaffGate from "@/components/staff-gate";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return <StaffGate returnTo="/painel"><DashboardClient /></StaffGate>;
}
