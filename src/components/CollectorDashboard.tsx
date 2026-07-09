import { useMemo, useState } from "react";
import { useAppState, monthKey } from "@/context/AppStateContext";
import { AppShell } from "./AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PublicAnalytics } from "./PublicAnalytics";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmt as qr, fmtDateTime } from "@/lib/format";
import { toast } from "sonner";

export function CollectorDashboard() {
  const {
    state,
    currentAdmin,
    memberMonthlyPaid,
    logPayment,
    approvePayment,
    rejectPayment,
  } = useAppState();

  const a = currentAdmin();
  const [mkInput, setMkInput] = useState<string>(monthKey(new Date()));

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
    return state.transactions.filter(t => !t.approved && (t.adminId === a.id || t.status === 'held_by_collector'));
  }, [state.transactions, a]);

  const myTransfers = useMemo(() => state.transfers
    .filter((t) => t.adminId === a?.id || (a?.role === 'admin'))
    .sort((x, y) => (x.transferredAt < y.transferredAt ? 1 : -1)), [state.transfers, a]);

  if (!a || (a.role !== "collector" && a.role !== "admin" as string)) return null;

    return (
      <AppShell
        title={`${a.name} · Collector Portal`}
        subtitle="Manage your assigned members and approve pending payments."
      >
        <Card className="p-5 mb-6">
            <h2 className="mb-3 font-semibold text-slate-900">
            Pending Approvals
            </h2>
            {pendingApprovals.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Receipt</TableHead>
                            <TableHead>Member</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pendingApprovals.map(t => (
                            <TableRow key={t.id}>
                                <TableCell>{t.receiptNo}</TableCell>
                                <TableCell>{state.members.find(m => m.id === t.memberId)?.name}</TableCell>
                                <TableCell>{qr(t.amount)}</TableCell>
                                <TableCell className="flex gap-2">
                                    <Button size="sm" onClick={() => {
                                        approvePayment(t.id);
                                        toast.success("Approved");
                                    }}>Approve</Button>
                                    <Button size="sm" variant="destructive" onClick={() => {
                                        rejectPayment(t.id);
                                        toast.success("Rejected");
                                    }}>Reject</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : <p className="text-sm text-slate-500">No pending approvals.</p>}
        </Card>

        <Card className="p-5 mb-6">
            <h2 className="mb-3 font-semibold text-slate-900">
            My Registered Members
            </h2>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Tokens</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {myMembers.map((m) => {
                const isPaid = memberMonthlyPaid(m.id, mkInput);
                return (
                    <TableRow key={m.id}>
                    <TableCell>
                        <div className="font-medium text-slate-900">{m.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{m.memberId}</div>
                    </TableCell>
                    <TableCell>
                        {isPaid ? "Paid" : "Not Paid"}
                    </TableCell>
                    </TableRow>
                );
                })}
            </TableBody>
            </Table>
        </Card>

        <Card className="p-5 mb-6">
        <h2 className="mb-3 font-semibold text-slate-900">
          Transfer History to Admin
        </h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Receipts</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {myTransfers.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-xs">{t.batchId}</TableCell>
                <TableCell>{fmtDateTime(t.transferredAt)}</TableCell>
                <TableCell>{t.transactionIds.length}</TableCell>
                <TableCell className="text-right font-semibold">
                  {qr(t.amount)}
                </TableCell>
                <TableCell>
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                    Transferred
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {myTransfers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-slate-500">
                  No transfers yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <PublicAnalytics />
      </AppShell>
  );
}
