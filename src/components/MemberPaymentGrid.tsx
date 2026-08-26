import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { fmtDate, fmtMonthKey } from "@/lib/format";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface MemberPaymentGridProps {
  member: any;
  transactions: any[];
}

export function MemberPaymentGrid({ member: m, transactions }: MemberPaymentGridProps) {
  // Fetch all receipt / transaction records for this member
  const memberTxns = transactions.filter(
    (t) => t.memberId === m.id || t.memberId === m.memberId
  );

  // Build payment map by month key (e.g. "2026-07")
  const paymentMap = new Map<string, {
    status: 'confirmed' | 'pending' | 'unpaid';
    amount: number;
    receiptNo?: string;
    paidAt?: string;
    statusLabel?: string;
  }>();

  for (const tx of memberTxns) {
    const mk = tx.monthKey || tx.month_paid_for || tx.for_month;
    if (!mk) continue;

    const amt = Number(tx.amount || 0);
    const isApproved = tx.approved === true || tx.status === 'completed' || tx.status === 'confirmed';
    const isPending = !isApproved && (tx.status === 'held_by_collector' || tx.status === 'held_by_admin' || tx.status === 'pending');

    const existing = paymentMap.get(mk);
    if (isApproved) {
      paymentMap.set(mk, {
        status: 'confirmed',
        amount: (existing?.amount || 0) + amt,
        receiptNo: tx.receiptNo || tx.id,
        paidAt: tx.paidAt,
        statusLabel: 'Confirmed'
      });
    } else if (isPending && existing?.status !== 'confirmed') {
      paymentMap.set(mk, {
        status: 'pending',
        amount: (existing?.amount || 0) + amt,
        receiptNo: tx.receiptNo || tx.id,
        paidAt: tx.paidAt,
        statusLabel: 'Pending Approval'
      });
    }
  }

  // Generate cycle months starting from launch (July 2026 / 2026-07) to current month or latest transaction month
  const startYear = 2026;
  const startMonth = 7; // July 2026
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  let endYear = currentYear;
  let endMonth = currentMonth;

  for (const mk of paymentMap.keys()) {
    const [y, mStr] = mk.split('-').map(Number);
    if (y && mStr) {
      if (y > endYear || (y === endYear && mStr > endMonth)) {
        endYear = y;
        endMonth = mStr;
      }
    }
  }

  const gridMonths: string[] = [];
  let curY = startYear;
  let curM = startMonth;
  while (curY < endYear || (curY === endYear && curM <= endMonth)) {
    const mk = `${curY}-${String(curM).padStart(2, '0')}`;
    gridMonths.push(mk);
    curM++;
    if (curM > 12) {
      curM = 1;
      curY++;
    }
  }

  const targetMonthly = Number(m?.shares || m?.shareCount || 1) * 100;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h4 className="font-semibold text-slate-900 text-sm">
          Monthly Payment History Grid
        </h4>
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-emerald-700 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Paid / Confirmed
          </span>
          <span className="flex items-center gap-1 text-amber-700 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span> Pending Approval
          </span>
          <span className="flex items-center gap-1 text-slate-500 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block"></span> Unpaid / Due
          </span>
        </div>
      </div>

      <TooltipProvider delayDuration={100}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {gridMonths.map((mk) => {
            const rec = paymentMap.get(mk);
            const status = rec ? rec.status : 'unpaid';
            const [year, month] = mk.split('-');
            const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString(undefined, { month: 'short' });

            let tileClasses = "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300";
            let statusBadge = null;

            if (status === 'confirmed') {
              tileClasses = "border-emerald-300 bg-emerald-50/90 text-emerald-900 hover:bg-emerald-100/80 shadow-xs";
              statusBadge = (
                <div className="flex items-center gap-0.5 text-emerald-700 font-bold text-[11px]">
                  <span>✓</span>
                  <span>₹{rec?.amount}</span>
                </div>
              );
            } else if (status === 'pending') {
              tileClasses = "border-amber-300 bg-amber-50/90 text-amber-900 hover:bg-amber-100/80 shadow-xs";
              statusBadge = (
                <div className="flex items-center gap-0.5 text-amber-700 font-semibold text-[10px]">
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span>Pending</span>
                </div>
              );
            } else {
              statusBadge = (
                <div className="text-slate-400 text-[10px] font-medium">
                  Unpaid
                </div>
              );
            }

            const fullMonthTitle = fmtMonthKey(mk);
            const tooltipText = rec ? (
              <div className="text-xs space-y-1">
                <p className="font-semibold border-b border-slate-700 pb-1">{fullMonthTitle}</p>
                <p>Status: <span className={status === 'confirmed' ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>{rec.statusLabel}</span></p>
                <p>Amount: ₹{rec.amount}</p>
                {rec.receiptNo && <p className="font-mono text-[10px] text-slate-300">Receipt ID: {rec.receiptNo}</p>}
                {rec.paidAt && <p className="text-[10px] text-slate-300">Date: {fmtDate(rec.paidAt)}</p>}
              </div>
            ) : (
              <div className="text-xs">
                <p className="font-semibold">{fullMonthTitle}</p>
                <p className="text-slate-300">Status: Unpaid / Due (₹{targetMonthly})</p>
              </div>
            );

            return (
              <Tooltip key={mk}>
                <TooltipTrigger asChild>
                  <div
                    className={`rounded-lg border p-2.5 transition-all cursor-pointer flex flex-col justify-between ${tileClasses}`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-xs">{monthName} {year}</span>
                      {status === 'confirmed' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      )}
                      {status === 'pending' && (
                        <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      )}
                      {status === 'unpaid' && (
                        <AlertCircle className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between">
                      {statusBadge}
                      {rec?.receiptNo && (
                        <span className="font-mono text-[9px] text-slate-400 max-w-[80px] truncate" title={rec.receiptNo}>
                          {rec.receiptNo}
                        </span>
                      )}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-slate-900 text-white p-2.5 rounded shadow-lg">
                  {tooltipText}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}
