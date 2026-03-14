import { LandingPageClient } from "@/components/landing/landing-page-client";
import { getDashboard } from "@/lib/get-dashboard";

export default async function HomePage() {
  const dashboard = await getDashboard();

  return <LandingPageClient data={dashboard} />;
}
