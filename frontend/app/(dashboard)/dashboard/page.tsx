import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { AiInsightBanner } from "@/components/dashboard/ai-insight-banner";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <AiInsightBanner />
      <StatsCards />
      <RecentTransactions />
    </div>
  );
}