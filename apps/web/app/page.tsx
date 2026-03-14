import { DashboardShell } from "@/components/dashboard-shell";
import { getDashboard } from "@/lib/get-dashboard";
import { normalizeDashboardFixture } from "@/lib/mock-dashboard-fixtures";

interface HomePageProps {
  searchParams?: Promise<{
    fixture?: string | string[] | undefined;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const fixture = normalizeDashboardFixture(resolvedSearchParams?.fixture);
  const dashboard = await getDashboard(fixture);

  return <DashboardShell data={dashboard} fixture={fixture} />;
}
