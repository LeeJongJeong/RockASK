import { DashboardShell } from "@/components/dashboard-shell";
import { getDashboard } from "@/lib/get-dashboard";

export default async function HomePage() {
  const dashboard = await getDashboard();

  return <DashboardShell data={dashboard} />;
}
