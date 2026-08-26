import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { fmtMonthKey } from "@/lib/format";
import { toast } from "sonner";

interface MonthlyContributionsOverviewCardProps {
  members: any[];
  transactions: any[];
}

export function MonthlyContributionsOverviewCard({
  members,
  transactions,
}: MonthlyContributionsOverviewCardProps) {
  // Current date parameters for strict 15th-of-the-month cut-off rule
  const now = new Date();
  const todayDate = now.getDate();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
  const isBefore15th = todayDate < 15;

  // Active cycle cutoff month:
  // - If today < 15: previous month is the last active due month.
  // - If today >= 15: current month is included as active due month.
  const activeCycleCutoffMonthKey = useMemo(() => {
    if (isBefore15th) {
      let prevY = currentYear;
      let prevM = currentMonth - 1;
      if (prevM < 1) {
        prevM = 12;
        prevY--;
      }
      return `${prevY}-${String(prevM).padStart(2, "0")}`;
    }
    return currentMonthKey;
  }, [isBefore15th, currentYear, currentMonth, currentMonthKey]);

  // Format today's date into readable format e.g. "25/08/2026"
  const formattedTodayDate = useMemo(() => {
    const d = String(todayDate).padStart(2, "0");
    const m = String(currentMonth).padStart(2, "0");
    return `${d}/${m}/${currentYear}`;
  }, [todayDate, currentMonth, currentYear]);

  // Generate active cycle months starting from July 2026 (2026-07) up to (current month + 1 advance month) or max transaction month
  const cycleMonths = useMemo(() => {
    const startYear = 2026;
    const startMonth = 7;

    // Default target end date is current month + 1 (advance month)
    let endYear = currentYear;
    let endMonth = currentMonth + 1;
    if (endMonth > 12) {
      endMonth = 1;
      endYear++;
    }

    // Expand end date if there are transactions for even further future months
    for (const tx of transactions) {
      const mk = tx.monthKey || tx.month_paid_for || tx.for_month;
      if (mk) {
        const [y, mStr] = mk.split("-").map(Number);
        if (y && mStr) {
          if (y > endYear || (y === endYear && mStr > endMonth)) {
            endYear = y;
            endMonth = mStr;
          }
        }
      }
    }

    const months: string[] = [];
    let curY = startYear;
    let curM = startMonth;
    while (curY < endYear || (curY === endYear && curM <= endMonth)) {
      months.push(`${curY}-${String(curM).padStart(2, "0")}`);
      curM++;
      if (curM > 12) {
        curM = 1;
        curY++;
      }
    }
    return months;
  }, [transactions, currentYear, currentMonth]);

  // Helper to compute member due status with strict 15th cut-off rule
  const getMemberDueInfo = (m: any) => {
    const memberTxns = transactions.filter(
      (t) => t.memberId === m.id || t.memberId === m.memberId
    );

    const paymentMap = new Map<string, "confirmed" | "pending">();
    const paidAmountMap = new Map<string, number>();

    for (const tx of memberTxns) {
      const mk = tx.monthKey || tx.month_paid_for || tx.for_month;
      if (!mk) continue;
      const amt = Number(tx.amount || 0);
      const isApproved =
        tx.approved === true ||
        tx.status === "completed" ||
        tx.status === "confirmed";

      if (isApproved) {
        paymentMap.set(mk, "confirmed");
        paidAmountMap.set(mk, (paidAmountMap.get(mk) || 0) + amt);
      } else if (
        tx.status === "held_by_collector" ||
        tx.status === "held_by_admin" ||
        tx.status === "pending"
      ) {
        if (paymentMap.get(mk) !== "confirmed") {
          paymentMap.set(mk, "pending");
          paidAmountMap.set(mk, (paidAmountMap.get(mk) || 0) + amt);
        }
      }
    }

    const shares = Number(m.shares || m.shareCount || 1);
    const targetMonthly = shares * 100;

    // Strict Due Calculation (Strict 15th Cut-off, NO future months):
    // Only evaluate unpaid months up to activeCycleCutoffMonthKey (i.e. <= activeCycleCutoffMonthKey)
    const dueMonthsBeforeCutoff: string[] = [];

    cycleMonths.forEach((mk) => {
      if (mk <= activeCycleCutoffMonthKey) {
        const st = paymentMap.get(mk);
        const isPaidOrPending = st === "confirmed" || st === "pending";
        if (!isPaidOrPending) {
          dueMonthsBeforeCutoff.push(fmtMonthKey(mk));
        }
      }
    });

    const totalDueAmount = dueMonthsBeforeCutoff.length * targetMonthly;

    return {
      paymentMap,
      paidAmountMap,
      shares,
      targetMonthly,
      dueMonthsBeforeCutoff,
      totalDueAmount,
    };
  };

  // Pre-calculate all member statuses for clean rendering and accurate footer summaries
  const membersDueInfo = useMemo(() => {
    return members.map((m) => {
      const info = getMemberDueInfo(m);
      return { member: m, ...info };
    });
  }, [members, transactions, cycleMonths, activeCycleCutoffMonthKey]);

  // Aggregate footer totals across all active members
  const totalActiveShares = useMemo(() => {
    return membersDueInfo.reduce((sum, item) => sum + item.shares, 0);
  }, [membersDueInfo]);

  const totalMonthlyTargetExpected = useMemo(() => {
    return totalActiveShares * 100;
  }, [totalActiveShares]);

  const monthlyTotalsMap = useMemo(() => {
    const map = new Map<
      string,
      { totalPaid: number; paidCount: number; pendingCount: number; dueCount: number }
    >();

    cycleMonths.forEach((mk) => {
      let totalPaid = 0;
      let paidCount = 0;
      let pendingCount = 0;
      let dueCount = 0;

      membersDueInfo.forEach((item) => {
        const st = item.paymentMap.get(mk);
        const paidAmt = item.paidAmountMap.get(mk) || item.targetMonthly;
        if (st === "confirmed") {
          totalPaid += paidAmt;
          paidCount++;
        } else if (st === "pending") {
          pendingCount++;
        } else {
          dueCount++;
        }
      });

      map.set(mk, { totalPaid, paidCount, pendingCount, dueCount });
    });

    return map;
  }, [cycleMonths, membersDueInfo]);

  const grandTotalDueAmount = useMemo(() => {
    return membersDueInfo.reduce((sum, item) => sum + item.totalDueAmount, 0);
  }, [membersDueInfo]);

  const pendingRemindersCount = useMemo(() => {
    return membersDueInfo.filter((item) => item.totalDueAmount > 0).length;
  }, [membersDueInfo]);

  // Handle WhatsApp Reminder in Malayalam based strictly on 15th cut-off rule
  const handleWhatsAppReminder = (m: any) => {
    let rawWa = (m.whatsapp || m.mobile || "").replace(/\D/g, "");
    if (!rawWa) {
      toast.error("No WhatsApp / mobile number found for this member.");
      return;
    }
    if (rawWa.length === 10) {
      rawWa = "91" + rawWa;
    }

    const { dueMonthsBeforeCutoff, totalDueAmount } = getMemberDueInfo(m);

    if (totalDueAmount === 0 || dueMonthsBeforeCutoff.length === 0) {
      toast.info(`${m.name} has no outstanding dues.`);
      return;
    }

    const monthsStr = dueMonthsBeforeCutoff.join(", ");
    const messageText =
      `പ്രിയപ്പെട്ട ${m.name},\n` +
      `GRT അക്കൗണ്ടിൽ ${formattedTodayDate}-ലെ കണക്കുപ്രകാരം കുടിശ്ശികയുള്ള വിവരങ്ങൾ:\n` +
      `• കുടിശ്ശികയുള്ള മാസങ്ങൾ: ${monthsStr}\n` +
      `• ആകെ അടയ്ക്കാനുള്ള തുക: ₹${totalDueAmount}\n\n` +
      `ദയവായി ഉടൻ പേയ്‌മെന്റ് പൂർത്തിയാക്കുക: https://grtapp.in`;

    const encodedText = encodeURIComponent(messageText);
    window.open(`https://wa.me/${rawWa}?text=${encodedText}`, "_blank");
  };

  return (
    <Card className="p-5 mb-6 shadow-sm border border-slate-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>🗓️</span> Monthly Contributions Overview & WhatsApp Tracker
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track monthly payment statuses for members and send instant WhatsApp reminders.
            <span className="inline-block sm:ml-1 font-medium text-slate-600">
              (Current month is optional/grace period before the 15th)
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-emerald-700 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Paid ✓
          </span>
          <span className="flex items-center gap-1 text-purple-800 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block"></span> Paid (Advance) ✓
          </span>
          <span className="flex items-center gap-1 text-amber-700 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span> Pending ⏳
          </span>
          <span className="flex items-center gap-1 text-rose-700 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block"></span> Due ⚠️
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <Table className="min-w-full">
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[180px] font-bold text-slate-800">Member</TableHead>
              <TableHead className="w-[70px] text-center font-bold text-slate-800">Shares</TableHead>
              {cycleMonths.map((mk) => {
                const [year, month] = mk.split("-");
                const monthShort = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString(undefined, { month: "short" });
                const isAdvanceHeader = mk > activeCycleCutoffMonthKey;
                return (
                  <TableHead key={mk} className="text-center font-bold text-slate-800 min-w-[110px]">
                    <div>{monthShort} {year}</div>
                    {isAdvanceHeader && (
                      <div className="text-[10px] text-purple-600 font-medium font-mono uppercase">(Advance)</div>
                    )}
                  </TableHead>
                );
              })}
              <TableHead className="text-right font-bold text-slate-800 w-[110px]">Total Due</TableHead>
              <TableHead className="text-center font-bold text-slate-800 w-[160px]">WhatsApp Reminder</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {membersDueInfo.map(({ member: m, paymentMap, paidAmountMap, shares, targetMonthly, totalDueAmount }) => {
              return (
                <TableRow key={m.id} className="hover:bg-slate-50/80 transition-colors">
                  <TableCell className="font-medium text-slate-900 py-3">
                    <div className="font-semibold text-sm">{m.name}</div>
                    <div className="text-xs text-slate-500 font-mono">ID: {m.memberId}</div>
                  </TableCell>
                  <TableCell className="text-center font-semibold text-slate-700 text-xs">
                    {shares}
                  </TableCell>
                  {cycleMonths.map((mk) => {
                    const st = paymentMap.get(mk);
                    const paidAmt = paidAmountMap.get(mk) || targetMonthly;
                    const isFutureAdvanceMonth = mk > activeCycleCutoffMonthKey;

                    if (st === "confirmed") {
                      if (isFutureAdvanceMonth) {
                        return (
                          <TableCell key={mk} className="text-center py-2">
                            <Badge className="bg-purple-100 text-purple-900 border border-purple-300 font-semibold text-[10.5px] px-2 py-0.5 shadow-none hover:bg-purple-200">
                              Paid (Advance) ✓ - ₹{paidAmt}
                            </Badge>
                          </TableCell>
                        );
                      }
                      return (
                        <TableCell key={mk} className="text-center py-2">
                          <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-medium text-[11px] px-2 py-0.5 shadow-none hover:bg-emerald-200">
                            ✓ ₹{paidAmt}
                          </Badge>
                        </TableCell>
                      );
                    }
                    if (st === "pending") {
                      return (
                        <TableCell key={mk} className="text-center py-2">
                          <Badge className="bg-amber-100 text-amber-800 border border-amber-300 font-medium text-[11px] px-2 py-0.5 shadow-none hover:bg-amber-200">
                            ⏳ Pending
                          </Badge>
                        </TableCell>
                      );
                    }

                    if (isFutureAdvanceMonth) {
                      return (
                        <TableCell key={mk} className="text-center py-2">
                          <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-200 font-normal text-[10.5px] px-2 py-0.5 opacity-80">
                            Optional ₹{targetMonthly}
                          </Badge>
                        </TableCell>
                      );
                    }

                    return (
                      <TableCell key={mk} className="text-center py-2">
                        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 font-medium text-[11px] px-2 py-0.5">
                          ⚠️ ₹{targetMonthly}
                        </Badge>
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-right font-bold text-slate-900 text-sm">
                    {totalDueAmount > 0 ? (
                      <span className="text-rose-600 font-bold">₹{totalDueAmount}</span>
                    ) : (
                      <span className="text-emerald-600 font-bold">₹0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center py-2">
                    {totalDueAmount > 0 ? (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-2.5 py-1.5 h-auto shadow-xs flex items-center justify-center gap-1.5 w-full"
                        onClick={() => handleWhatsAppReminder(m)}
                      >
                        <MessageCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>Send Reminder</span>
                      </Button>
                    ) : (
                      <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 font-medium text-xs py-1 px-3.5 w-full text-center justify-center">
                        No Dues ✓
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter className="bg-slate-100/95 border-t-2 border-slate-300 font-semibold text-slate-900 sticky bottom-0">
            <TableRow className="border-t-2 border-slate-300 bg-slate-100 hover:bg-slate-100">
              <TableCell className="py-3.5 font-extrabold text-slate-900 text-sm">
                <div className="font-bold text-sm tracking-wide text-slate-900">TOTAL</div>
                <div className="text-[11px] font-normal text-slate-500">{members.length} Member{members.length !== 1 ? 's' : ''}</div>
              </TableCell>
              <TableCell className="text-center font-bold text-slate-900 py-3.5">
                <div className="text-sm font-extrabold text-slate-900">{totalActiveShares}</div>
                <div className="text-[10px] font-medium text-slate-500">Shares</div>
              </TableCell>
              {cycleMonths.map((mk) => {
                const stats = monthlyTotalsMap.get(mk) || { totalPaid: 0, paidCount: 0, pendingCount: 0, dueCount: 0 };
                const isAdvance = mk > activeCycleCutoffMonthKey;
                const pct = totalMonthlyTargetExpected > 0 ? Math.round((stats.totalPaid / totalMonthlyTargetExpected) * 100) : 0;
                return (
                  <TableCell key={mk} className="text-center py-3.5 px-2">
                    <div className={`text-xs font-bold ${stats.totalPaid > 0 ? (isAdvance ? "text-purple-900 font-extrabold" : "text-emerald-800 font-extrabold") : "text-slate-500"}`}>
                      ₹{stats.totalPaid.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                      {stats.paidCount}/{members.length} ({pct}%)
                    </div>
                  </TableCell>
                );
              })}
              <TableCell className="text-right font-extrabold text-sm py-3.5">
                <div className={grandTotalDueAmount > 0 ? "text-rose-600 font-extrabold text-sm" : "text-emerald-600 font-extrabold text-sm"}>
                  ₹{grandTotalDueAmount.toLocaleString()}
                </div>
                <div className="text-[10px] font-normal text-slate-500">Total Dues</div>
              </TableCell>
              <TableCell className="text-center py-3.5">
                {pendingRemindersCount > 0 ? (
                  <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300 font-bold text-xs py-1 px-2.5 w-full justify-center shadow-none">
                    {pendingRemindersCount} Pending Reminder{pendingRemindersCount !== 1 ? 's' : ''}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-bold text-xs py-1 px-2.5 w-full justify-center shadow-none">
                    All Cleared ✓
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </Card>
  );
}