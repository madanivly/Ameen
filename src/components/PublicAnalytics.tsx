import { useAppState } from "@/context/AppStateContext";
import { Card } from "@/components/ui/card";
import { fmt } from "@/lib/format";
import { Coins, TrendingUp, Wallet, PieChart } from "lucide-react";

export function PublicAnalytics() {
  const { totals, state, memberMonthlyPaid } = useAppState();
  const t = totals();
  const totalExpenses = state.expenses.filter(e => e.source !== 'admin_fund').reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const netBalance = t.balance - totalExpenses;
  const collectedTransactionCount = state.transactions.filter((transaction) => {
    const status = (transaction.status || "").trim().toLowerCase();
    return status === "completed"
      || status === "held by admin"
      || status === "held_by_admin"
      || transaction.approved === true;
  }).length;

  // Calculate total shares of members who paid for July 2026 ("2026-07")
  const july2026PaidMembers = state.members.filter((m) => memberMonthlyPaid(m.id, "2026-07"));
  const totalMemberShares = july2026PaidMembers.reduce((acc, m) => acc + Number(m.shares || 1), 0);

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
        Fund transparency · live
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={<PieChart className="h-4 w-4" />}
          label="Total Member Shares"
          value={`${totalMemberShares} Shares`}
          hint={`From ${july2026PaidMembers.length} members who paid July 2026`}
        />
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          label="Total Collected"
          value={fmt(t.totalCollected)}
          hint={`${collectedTransactionCount} fund transactions`}
        />
        <StatCard
          icon={<Coins className="h-4 w-4" />}
          label="Invested Amount"
          value={fmt(t.totalActiveCapital)}
          hint={`${state.investments.filter((i) => i.status === "active").length} ventures`}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Total Profit"
          value={fmt(t.totalProfit)}
          hint="Distributed by share"
        />
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          label="Total Expenses"
          value={fmt(totalExpenses)}
          hint={`${state.expenses.filter(e => e.source !== 'admin_fund').length} official expenses`}
        />
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          label="Net Balance"
          value={fmt(netBalance)}
          hint="After all expenses deducted"
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="border-emerald-100 p-4 transition-shadow hover:shadow-md">
      <div className="flex items-center gap-2 text-emerald-700">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </Card>
  );
}



