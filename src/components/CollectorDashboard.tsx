import { useEffect, useMemo, useState } from "react";
import { useAppState, monthKey } from "@/context/AppStateContext";
import { AppShell } from "./AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PublicAnalytics } from "./PublicAnalytics";
import { MonthlyContributionsOverviewCard } from "./MonthlyContributionsOverviewCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmt as qr, fmtDateTime, fmtMonthKey } from "@/lib/format";
import { toast } from "sonner";

export function CollectorDashboard() {
  const {
    state,
    currentAdmin,
    memberMonthlyPaid,
    memberActiveInvestedCapital,
    memberProfitShare,
    logPayment,
    approvePayment,
    updatePaymentAmount,
    rejectPayment,
    refreshData,
  } = useAppState();

  const a = currentAdmin();
  const [mkInput, setMkInput] = useState<string>(monthKey(new Date()));
  const [amountDrafts, setAmountDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    setAmountDrafts((previous) => {
      const next = { ...previous };
      for (const transaction of state.transactions) {
        if (next[transaction.id] === undefined) next[transaction.id] = String(transaction.amount);
      }
      return next;
    });
  }, [state.transactions]);

  const myMembers = useMemo(
    () => {
        if (!a) return [];
        return state.members.filter((m) => 
            m.adminId === a.id || 
            (m.collectorName && a.name && m.collectorName.trim().toLowerCase() === a.name.trim().toLowerCase())
        );
    },
    [state.members, a],
  );

  const pendingApprovals = useMemo(() => {
    if (!a) return [];
    return state.transactions.filter(t => {
      if (t.approved) return false;
      const isPendingCollector = t.status?.startsWith("Held with") || t.status?.startsWith("Held by Collector") || t.status === "held_by_collector";
      if (!isPendingCollector) return false;
      const member = state.members.find(m => m.id === t.memberId);
      // Strict: only show transactions where the member's assigned collector matches this collector
      return (
        t.adminId === a.id ||
        (member?.collectorName && a.name && member.collectorName.trim().toLowerCase() === a.name.trim().toLowerCase())
      );
    });
  }, [state.transactions, a, state.members]);

  // A collector-to-admin transfer occurs at the moment the collector approves
  // a receipt. The receipt is then held by Admin, so use that durable payment
  // status as the transfer ledger rather than the separate treasurer batches.
  // All transactions belonging to this collector's members, newest first
  const myMembersPaymentHistory = useMemo(() => {
    if (!a) return [];
    const memberIds = new Set(myMembers.map((m) => m.id));
    return state.transactions
      .filter((t) => memberIds.has(t.memberId))
      .sort((left, right) => (left.paidAt < right.paidAt ? 1 : -1));
  }, [state.transactions, myMembers, a]);

  const transfersToAdmin = useMemo(() => {
    if (!a) return [];
    return state.transactions
      .filter((transaction) => {
        // Include transactions that are held by admin OR completed (already approved by admin)
        if (transaction.status !== "held_by_admin" && transaction.status !== "Held by Admin" && transaction.status !== "completed") return false;
        // If it was just directly added by admin without going through a collector, skip it here unless this is the collector
        const member = state.members.find((item) => item.id === transaction.memberId);
        return transaction.adminId === a.id
          || (member?.collectorName && member.collectorName.trim().toLowerCase() === a.name.trim().toLowerCase());
      })
      .sort((left, right) => (left.paidAt < right.paidAt ? 1 : -1));
  }, [state.transactions, state.members, a]);

  if (!a || (a.role !== "collector" && a.role !== "admin" as string)) return null;

    return (
      <AppShell
        title={`${a.name} · Collector Portal`}
        subtitle="Manage your assigned members and approve pending payments."
      >
        <div className="mb-4">
            {/* <Button variant="outline" onClick={refreshData}>Refresh Data</Button> */}
        </div>

        {/* 1. Pending Approvals (Highest Priority - Top position) */}
        <Card className="p-5 mb-6 border-amber-200 bg-amber-50/20">
            <h2 className="mb-3 font-semibold text-slate-900 flex items-center justify-between">
              <span>Pending Approvals</span>
              {pendingApprovals.length > 0 && (
                <Badge className="bg-amber-500 text-white font-bold text-xs px-2 py-0.5">
                  {pendingApprovals.length} Pending
                </Badge>
              )}
            </h2>
            {pendingApprovals.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Receipt</TableHead>
                            <TableHead>Member</TableHead>
                            <TableHead>Month</TableHead>
                            <TableHead>Confirm Amount</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pendingApprovals.map(t => {
                            const draftAmount = amountDrafts[t.id] ?? String(t.amount);
                            const parsedAmount = Number(draftAmount);
                            const validAmount = Number.isFinite(parsedAmount) && parsedAmount > 0;
                            return (
                            <TableRow key={t.id}>
                                <TableCell>{t.receiptNo}</TableCell>
                                <TableCell>{state.members.find(m => m.id === t.memberId)?.name}</TableCell>
                                <TableCell className="font-medium">{fmtMonthKey(t.monthKey || "")}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="number"
                                        min="1"
                                        className="w-24 rounded border p-1.5 text-sm"
                                        value={draftAmount}
                                        onChange={(event) => setAmountDrafts((drafts) => ({ ...drafts, [t.id]: event.target.value }))}
                                      />
                                      <span className="text-xs text-slate-500">{validAmount ? parsedAmount : t.amount}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="flex gap-2">
                                    <Button size="sm" variant="outline" disabled={!validAmount || parsedAmount === t.amount} onClick={() => {
                                        updatePaymentAmount(t.id, parsedAmount);
                                        toast.success("Amount saved. You can now approve the payment.");
                                    }}>Save Amount</Button>
                                    <Button size="sm" onClick={() => {
                                        if (!validAmount) {
                                          toast.error("Enter a valid amount before approving.");
                                          return;
                                        }
                                        approvePayment(t.id, parsedAmount);
                                        toast.success("Approved");
                                    }}>Approve</Button>
                                    <Button size="sm" variant="destructive" onClick={() => {
                                        rejectPayment(t.id);
                                        toast.success("Rejected");
                                    }}>Reject</Button>
                                </TableCell>
                            </TableRow>
                        );
                        })}
                    </TableBody>
                </Table>
            ) : <p className="text-sm text-slate-500">No pending approvals.</p>}
        </Card>

        {/* 2. Monthly Contributions Overview & WhatsApp Tracker */}
        <MonthlyContributionsOverviewCard
          members={myMembers}
          transactions={state.transactions}
        />

        {/* 2. My Registered Members */}
        <Card className="p-5 mb-6">
            <h2 className="mb-3 font-semibold text-slate-900">
            My Registered Members
            </h2>
            <Table>
            <TableHeader><TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Collector Status</TableHead>
              <TableHead>Assigned Collector</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Shares</TableHead>
              <TableHead>Password</TableHead>
              <TableHead className="text-right">Held</TableHead>
              <TableHead className="text-right">Invested</TableHead>
              <TableHead className="text-right">Profit Earned</TableHead>
            </TableRow></TableHeader>
            <TableBody>
                {myMembers.map((m) => {
                const isCollector = m.isCollector || m.role === "collector";
                return (
                    <TableRow key={m.id}>
                    <TableCell>
                        <div className="font-medium text-slate-900">{m.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{m.memberId}</div>
                    </TableCell>
                    <TableCell>{isCollector ? <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Collector</Badge> : <Badge variant="outline">Member</Badge>}</TableCell>
                    <TableCell>{m.collectorName || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{m.memberId}</TableCell>
                    <TableCell className="font-mono text-xs">{m.mobile || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{m.whatsapp || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-medium whitespace-nowrap">
                        {m.shares || 1} Share{Number(m.shares || 1) > 1 ? 's' : ''} ({Number(m.shares || 1) * 100}/mo)
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{m.password || "—"}</TableCell>
                    <TableCell className="text-right font-semibold">{state.transactions.filter((t) => (t.memberId === m.id || t.memberId === m.memberId) && (t.approved || t.status === "completed")).reduce((sum, t) => sum + (Number(t.amount) || 0), 0)}</TableCell>
                    <TableCell className="text-right font-semibold">{memberActiveInvestedCapital(m.id)}</TableCell>
                    <TableCell className="text-right font-semibold text-emerald-600">{memberProfitShare(m.id)}</TableCell>
                    </TableRow>
                );
                })}
            </TableBody>
            </Table>
        </Card>

        <Card className="p-5 mb-6">
          <h2 className="mb-3 font-semibold text-slate-900">
            Payment History — My Members
          </h2>
          {myMembersPaymentHistory.length === 0 ? (
            <p className="text-sm text-slate-500">No payments recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myMembersPaymentHistory.map((t) => {
                    const member = state.members.find((m) => m.id === t.memberId);
                    let statusLabel = t.status || (t.approved ? "completed" : "pending");
                    let badgeClass = "bg-slate-100 text-slate-700 hover:bg-slate-100";
                    if (t.approved || t.status === "completed") {
                      statusLabel = "Approved";
                      badgeClass = "bg-emerald-100 text-emerald-800 hover:bg-emerald-100";
                    } else if (t.status === "held_by_admin" || t.status === "Held by Admin") {
                      statusLabel = "With Admin";
                      badgeClass = "bg-blue-100 text-blue-800 hover:bg-blue-100";
                    } else if (t.status === "held_by_collector" || t.status?.startsWith("Held by Collector") || t.status?.startsWith("Held with")) {
                      statusLabel = "With Collector";
                      badgeClass = "bg-amber-100 text-amber-800 hover:bg-amber-100";
                    }
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-xs">{t.receiptNo || "—"}</TableCell>
                        <TableCell>
                          <div className="font-medium">{member?.name || t.memberId}</div>
                          <div className="text-xs text-slate-500 font-mono">{member?.memberId || ""}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                            {t.for_month || t.month_paid_for || (t.monthKey ? fmtMonthKey(t.monthKey) : "—")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{fmtDateTime(t.paidAt)}</TableCell>
                        <TableCell className="text-right font-semibold">{Number(t.amount || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={badgeClass}>{statusLabel}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <tfoot className="border-t bg-slate-50/50 font-semibold">
                  <tr>
                    <td colSpan={4} className="p-4 text-right">Total Collected:</td>
                    <td className="p-4 text-right">
                      {myMembersPaymentHistory.reduce((sum, t) => sum + Number(t.amount || 0), 0).toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </Table>
            </div>
          )}
        </Card>

        <Card className="p-5 mb-6">
        <h2 className="mb-3 font-semibold text-slate-900">
          Transfer History to Admin
        </h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt</TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Approved / Sent</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfersToAdmin.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-xs">{t.receiptNo}</TableCell>
                <TableCell>{state.members.find((member) => member.id === t.memberId)?.name || t.memberId}</TableCell>
                <TableCell>{fmtDateTime(t.paidAt)}</TableCell>
                <TableCell className="text-right font-semibold">
                  {t.amount}
                </TableCell>
                <TableCell>
                  {t.approved || t.status === 'completed' ? (
                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                      Approved
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                      Waiting for Approval
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {transfersToAdmin.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-slate-500">
                  No receipts have been approved and sent to Admin yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {transfersToAdmin.length > 0 && (
            <tfoot className="border-t bg-slate-50/50 font-semibold">
              <tr className="border-b">
                <td colSpan={3} className="p-4 text-right text-amber-600">Waiting for approval by Admin:</td>
                <td className="p-4 text-right text-amber-600">
                  {transfersToAdmin.filter(t => !t.approved && (t.status === "held_by_admin" || t.status === "Held by Admin")).reduce((sum, t) => sum + Number(t.amount || 0), 0)}
                </td>
                <td></td>
              </tr>
              <tr>
                <td colSpan={3} className="p-4 text-right">Total Amount:</td>
                <td className="p-4 text-right">
                  {transfersToAdmin.reduce((sum, t) => sum + Number(t.amount || 0), 0)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </Table>
      </Card>

      <PublicAnalytics />
      </AppShell>
  );
}
