import { useAppState, monthKey, REG_FEE } from "@/context/AppStateContext";
import { AppShell } from "./AppShell";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PublicAnalytics } from "./PublicAnalytics";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmt, fmtDate, fmtMonthKey, getProfilePhotoUrl } from "@/lib/format";
import { toast } from "sonner";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PrintableReport } from "./PrintableReport";
import { MemberProfilePrint } from "./MemberProfilePrint";
import { MemberPaymentGrid } from "./MemberPaymentGrid";
import { MonthlyContributionsOverviewCard } from "./MonthlyContributionsOverviewCard";
import { Trash2, MessageCircle, Printer, Download, FileSpreadsheet, CheckCircle2, Clock, AlertCircle, Pencil, Search, Filter, ChevronLeft, ChevronRight, X, ShieldCheck, Plus, Receipt } from "lucide-react";
import { RoleSwitcher } from "./RoleSwitcher";
import html2pdf from "html2pdf.js";
import ExcelJS from "exceljs";

export function AdminDashboard() {
  const {
    state,
    currentAdmin,
    logPayment,
    addInvestment,
    updateInvestment,
    updatePaymentAmount,
    updatePaymentMonth,
    markTransferredToTreasurer,
    approvePayment,
    rejectPayment,
    memberMonthlyPaid,
    renameMember,
    updateMember,
    reassignMemberToCollector,
    updateAdmin,
    memberProfitShare,
    memberActiveInvestedCapital,
    updateAdminPassword,
    removeMember,
    addExpense,
    deleteExpense,
    addAdminExpense,
    refreshData,
    totals,
  } = useAppState();

  const a = currentAdmin();
  const isCollector = a?.role === 'collector';
  const [mkInput, setMkInput] = useState<string>(monthKey(new Date()));
  const [invName, setInvName] = useState<string>("");
  const [invDesc, setInvDesc] = useState<string>("");
  const [invCap, setInvCap] = useState<string>("");
  const [invProfit, setInvProfit] = useState<string>("");
  const [colName, setColName] = useState<string>("");
  const [colMobile, setColMobile] = useState<string>("");
  const [colWhatsapp, setColWhatsapp] = useState<string>("");
  const [editingInv, setEditingInv] = useState<any>(null);
  const [editingTx, setEditingTx] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");
  const [editingMember, setEditingMember] = useState<any>(null);
  const [memberForm, setMemberForm] = useState<{
    name: string;
    mobile: string;
    whatsapp: string;
    password?: string;
    collectorName: string;
    nomineeName: string;
    nomineeRelation: string;
    nomineeAddress: string;
    nomineeContact: string;
    shares: number;
  }>({
    name: "",
    mobile: "",
    whatsapp: "",
    password: "",
    collectorName: "",
    nomineeName: "",
    nomineeRelation: "",
    nomineeAddress: "",
    nomineeContact: "",
    shares: 1,
  });
  const [editingCollector, setEditingCollector] = useState<any>(null);
  const [collectorForm, setCollectorForm] = useState({ name: "", mobile: "", whatsapp: "" });
  const [selectedPromoteId, setSelectedPromoteId] = useState("");
  const [promotedMembers, setPromotedMembers] = useState<any[]>([]);
  const [memberToRemove, setMemberToRemove] = useState<any>(null);
  const [expensesOpen, setExpensesOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ description: "", amount: "", category: "Operations", notes: "" });
  const [adminExpenseOpen, setAdminExpenseOpen] = useState(false);
  const [adminExpenseForm, setAdminExpenseForm] = useState({ description: "", amount: "", category: "Administrative", notes: "", date: new Date().toISOString().slice(0, 10) });
  const [adminExpenseReceiptFile, setAdminExpenseReceiptFile] = useState<File | null>(null);
  const [adminExpenseUploading, setAdminExpenseUploading] = useState(false);
  const [newAdminPassword, setNewAdminPassword] = useState("");

  // Track which member's profile we want to print
  const [printingMember, setPrintingMember] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Edit Payment Month State
  const [editingReceiptMonth, setEditingReceiptMonth] = useState<any | null>(null);
  const [selectedNewMonthKey, setSelectedNewMonthKey] = useState<string>("");
  const [isSavingMonth, setIsSavingMonth] = useState<boolean>(false);

  // Receipt Search, Filter & Pagination State
  const [receiptSearchQuery, setReceiptSearchQuery] = useState<string>("");
  const [receiptMonthFilter, setReceiptMonthFilter] = useState<string>("all");
  const [receiptStatusFilter, setReceiptStatusFilter] = useState<string>("all");
  const [receiptPage, setReceiptPage] = useState<number>(1);
  const [receiptsPerPage, setReceiptsPerPage] = useState<number>(10);

  const monthOptions = useMemo(() => {
    const opts: { key: string; label: string }[] = [];
    for (let year = 2025; year <= 2028; year++) {
      for (let month = 1; month <= 12; month++) {
        const key = `${year}-${String(month).padStart(2, "0")}`;
        opts.push({ key, label: fmtMonthKey(key) });
      }
    }
    return opts;
  }, []);

  const handleOpenEditMonth = (t: any) => {
    setEditingReceiptMonth(t);
    const existingMk = t.monthKey || (t.month_paid_for ? parseMonthNameToKey(t.month_paid_for) : "");
    setSelectedNewMonthKey(existingMk || "2026-07");
  };

  function parseMonthNameToKey(nameStr: string): string {
    if (!nameStr) return "2026-07";
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length === 2) {
      const mIdx = months.findIndex(m => m.toLowerCase() === parts[0].toLowerCase());
      if (mIdx !== -1) {
        return `${parts[1]}-${String(mIdx + 1).padStart(2, '0')}`;
      }
    }
    return "2026-07";
  }

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

  const [searchTerm, setSearchTerm] = useState("");

  const loadPromotedMembers = useCallback(async () => {
    const response = await fetch('/api/api.php?endpoint=fetch-collectors', {
      cache: 'no-store',
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Unable to load promoted collectors');
    }
    const collectors = Array.isArray(result.data)
      ? result.data.filter((member: any) => Number(member?.isCollector) === 1 || member?.isCollector === true)
      : [];
    setPromotedMembers(collectors);
  }, []);

  useEffect(() => {
    void loadPromotedMembers().catch((error) => {
      console.error('Failed to load promoted collectors:', error);
      toast.error('Unable to load promoted collectors');
    });
  }, [loadPromotedMembers]);

  const promotedMemberIds = useMemo(
    () => new Set(promotedMembers.map((member) => member.id)),
    [promotedMembers],
  );

  const promotableMembers = useMemo(
    () =>
      state.members.filter(
        (member) =>
          !promotedMemberIds.has(member.id) &&
          String(member.id).toUpperCase() !== 'ADM001' &&
          String(member.id).toLowerCase() !== 'admin' &&
          String(member.memberId || '').toUpperCase() !== 'ADM001' &&
          String(member.memberId || '').toLowerCase() !== 'admin' &&
          (member.role ?? '').toLowerCase() !== 'admin',
      ),
    [state.members, promotedMemberIds],
  );

  const setCollectorStatus = async (memberId: string, isCollector: boolean) => {
    const targetMember = state.members.find((x) => x.id === memberId);
    if (
      String(memberId).toUpperCase() === 'ADM001' ||
      String(memberId).toLowerCase() === 'admin' ||
      (targetMember && (targetMember.role ?? '').toLowerCase() === 'admin')
    ) {
      throw new Error('Admin account cannot be promoted or modified through the promotion system.');
    }
    const response = await fetch('/api/api.php?endpoint=set-collector-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: memberId, isCollector }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Collector status update failed');
    }
    setPromotedMembers(Array.isArray(result.data) ? result.data : []);
    await refreshData();
  };

  const allMembers = useMemo(() => {
    if (!searchTerm) {
      return state.members;
    }
    return state.members.filter(
      (m) =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.memberId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [state.members, searchTerm]);

  const pendingApprovals = useMemo(() => {
    if (a?.role !== "admin" && a?.role !== "collector") return [];
    if (a.role === 'admin') return state.transactions.filter(t => !t.approved && t.status === 'held_by_admin');
    return state.transactions.filter(t => {
      if (t.approved || t.status !== 'held_by_collector') return false;
      const member = state.members.find(m => m.id === t.memberId);
      return t.adminId === a.id || (member?.collectorName && member.collectorName.trim().toLowerCase() === a.name.trim().toLowerCase());
    });
  }, [state.transactions, a, state.members]);

  const collectedByMember = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of state.transactions.filter(t => !t.approved && t.status === 'held_by_admin')) {
      map.set(t.memberId, (map.get(t.memberId) ?? 0) + Number(t.amount || 0));
    }
    return map;
  }, [state.transactions]);

  const availableReceiptMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    state.transactions.forEach((t) => {
      if (t.monthKey && t.monthKey !== 'N/A') {
        monthsSet.add(t.monthKey);
      }
    });
    for (let yr = 2025; yr <= 2028; yr++) {
      for (let mo = 1; mo <= 12; mo++) {
        monthsSet.add(`${yr}-${String(mo).padStart(2, "0")}`);
      }
    }
    return Array.from(monthsSet).sort().reverse();
  }, [state.transactions]);

  const filteredReceipts = useMemo(() => {
    const q = receiptSearchQuery.trim().toLowerCase();

    return state.transactions
      .filter((t) => {
        // Access control: admins see all, collectors see their assigned transactions
        if (a?.role !== 'admin' && t.adminId !== a?.id) {
          return false;
        }

        const m = state.members.find((x) => x.id === t.memberId || x.memberId === t.memberId);
        const collectorName =
          m?.collectorName ||
          state.admins.find((x) => x.id === t.adminId)?.name ||
          state.members.find((x) => x.id === t.adminId)?.name ||
          "";

        // 1. Text Search Filter (Member Name, Member ID, Receipt ID, Collector Name)
        if (q) {
          const receiptNo = String(t.receiptNo || t.id || "").toLowerCase();
          const memberName = String(m?.name || "").toLowerCase();
          const memberIdStr = String(m?.memberId || t.memberId || "").toLowerCase();
          const colName = String(collectorName).toLowerCase();

          const matchesQuery =
            receiptNo.includes(q) ||
            memberName.includes(q) ||
            memberIdStr.includes(q) ||
            colName.includes(q);

          if (!matchesQuery) return false;
        }

        // 2. Month Filter
        if (receiptMonthFilter !== "all") {
          const tMonthKey = t.monthKey || "";
          const monthDisplay = (t.month_paid_for || t.for_month || t.contribution_month || "").toLowerCase();
          if (tMonthKey !== receiptMonthFilter && !monthDisplay.includes(receiptMonthFilter.toLowerCase())) {
            return false;
          }
        }

        // 3. Status Filter
        if (receiptStatusFilter !== "all") {
          const isApproved = t.approved || t.status === 'completed';
          const isHeldByAdmin = !isApproved && (t.status === 'held_by_admin' || t.status === 'Held by Admin');
          const isHeldByCollector = !isApproved && !isHeldByAdmin && (
            t.status === 'held_by_collector' ||
            t.status?.startsWith('Held with') ||
            t.status?.startsWith('Held by Collector')
          );

          if (receiptStatusFilter === "confirmed" && !isApproved) return false;
          if (receiptStatusFilter === "held_collector" && !isHeldByCollector) return false;
          if (receiptStatusFilter === "held_admin" && !isHeldByAdmin) return false;
          if (receiptStatusFilter === "pending" && (isApproved || isHeldByAdmin || isHeldByCollector)) return false;
        }

        return true;
      })
      .sort((x, y) => (x.paidAt < y.paidAt ? 1 : -1));
  }, [state.transactions, state.members, state.admins, a, receiptSearchQuery, receiptMonthFilter, receiptStatusFilter]);

  useEffect(() => {
    setReceiptPage(1);
  }, [receiptSearchQuery, receiptMonthFilter, receiptStatusFilter, receiptsPerPage]);

  const totalReceiptsCount = filteredReceipts.length;
  const totalPages = Math.max(1, Math.ceil(totalReceiptsCount / receiptsPerPage));
  const paginatedReceipts = useMemo(() => {
    const startIdx = (receiptPage - 1) * receiptsPerPage;
    return filteredReceipts.slice(startIdx, startIdx + receiptsPerPage);
  }, [filteredReceipts, receiptPage, receiptsPerPage]);

  // WhatsApp credential message
  const sendCredentialWhatsApp = (m: any) => {
    const wa = (m.whatsapp || m.mobile || '').replace(/\D/g, '');
    if (!wa) {
      toast.error('No WhatsApp / mobile number found for this member.');
      return;
    }
    const text = encodeURIComponent(
      `Assalamu Alaikum ${m.name},\n\n` +
      `Welcome to GRT Portal! Here are your login credentials:\n\n` +
      ` Member ID: ${m.memberId}\n` +
      ` Password: ${m.password || '(contact admin)'}\n\n` +
      `Please log in and update your profile photo at your earliest convenience.\n\n` +
      `Login link: https://grtapp.in/\n\n` +
      `For assistance, contact your collector or Convenor\n\n` +
      `— GRT Portal`
    );
    window.open(`https://wa.me/${wa}?text=${text}`, '_blank');
  };

  // WhatsApp payment reminder message (in Malayalam)
  const sendWhatsAppReminder = useCallback((m: any) => {
    let rawWa = (m.whatsapp || m.mobile || '').replace(/\D/g, '');
    if (!rawWa) {
      toast.error('No WhatsApp / mobile number found for this member.');
      return;
    }
    if (rawWa.length === 10) {
      rawWa = '91' + rawWa;
    }

    const memberTxns = state.transactions.filter(
      (t) => t.memberId === m.id || t.memberId === m.memberId
    );

    const paymentMap = new Map<string, 'confirmed' | 'pending'>();
    for (const tx of memberTxns) {
      const mk = tx.monthKey || tx.month_paid_for || tx.for_month;
      if (!mk) continue;
      const isApproved = tx.approved === true || tx.status === 'completed' || tx.status === 'confirmed';
      if (isApproved) {
        paymentMap.set(mk, 'confirmed');
      } else if (tx.status === 'held_by_collector' || tx.status === 'held_by_admin' || tx.status === 'pending') {
        if (paymentMap.get(mk) !== 'confirmed') {
          paymentMap.set(mk, 'pending');
        }
      }
    }

    const startYear = 2026;
    const startMonth = 7;
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

    const dueMonths: string[] = [];
    const pendingMonths: string[] = [];
    let curY = startYear;
    let curM = startMonth;

    while (curY < endYear || (curY === endYear && curM <= endMonth)) {
      const mk = `${curY}-${String(curM).padStart(2, '0')}`;
      const st = paymentMap.get(mk);
      if (!st) {
        dueMonths.push(fmtMonthKey(mk));
      } else if (st === 'pending') {
        pendingMonths.push(fmtMonthKey(mk));
      }
      curM++;
      if (curM > 12) {
        curM = 1;
        curY++;
      }
    }

    const shares = Number(m.shares || m.shareCount || 1);
    const monthlyTarget = shares * 100;
    const totalUnpaidCount = dueMonths.length;
    const totalDueAmount = totalUnpaidCount * monthlyTarget;

    let messageText = '';
    if (totalUnpaidCount > 0) {
      const monthsStr = dueMonths.join(', ');
      messageText =
        `നമസ്കാരം ${m.name},\n\n` +
        `GRT മാസവരിസംഖ്യയുടെ വിവരങ്ങൾ:\n` +
        `• അടയ്ക്കാനുള്ള മാസം: ${monthsStr}\n` +
        `• ആകെ അടയ്ക്കേണ്ട തുക: ₹${totalDueAmount}\n\n` +
        `ദയവായി പേയ്മെന്റ് പൂർത്തിയാക്കി ആപ്പിൽ അപ്ഡേറ്റ് ചെയ്യുമല്ലോ.\n\n` +
        `App Link: https://grtapp.in\n\n` +
        `— GRT Admin Team`;
    } else if (pendingMonths.length > 0) {
      const pendingStr = pendingMonths.join(', ');
      messageText =
        `നമസ്കാരം ${m.name},\n\n` +
        `താങ്കളുടെ GRT മാസവരിസംഖ്യ (${pendingStr}) കൺഫർമേഷനായി കാത്തിരിക്കുകയാണ്.\n\n` +
        `App Link: https://grtapp.in\n\n` +
        `— GRT Admin Team`;
    } else {
      messageText =
        `നമസ്കാരം ${m.name},\n\n` +
        `താങ്കളുടെ GRT മാസവരിസംഖ്യകൾ എല്ലാം അടച്ചുതീർത്തിട്ടുണ്ട്. നന്ദി!\n\n` +
        `App Link: https://grtapp.in\n\n` +
        `— GRT Admin Team`;
    }

    const encodedText = encodeURIComponent(messageText);
    window.open(`https://wa.me/${rawWa}?text=${encodedText}`, '_blank');
  }, [state.transactions]);

  const trackerCycleMonths = useMemo(() => {
    const startYear = 2026;
    const startMonth = 7;
    const now = new Date();
    let endYear = now.getFullYear();
    let endMonth = now.getMonth() + 1;

    for (const tx of state.transactions) {
      const mk = tx.monthKey || tx.month_paid_for || tx.for_month;
      if (mk) {
        const [y, mStr] = mk.split('-').map(Number);
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
      months.push(`${curY}-${String(curM).padStart(2, '0')}`);
      curM++;
      if (curM > 12) {
        curM = 1;
        curY++;
      }
    }
    return months;
  }, [state.transactions]);

  // Handle printing member profile
  const handlePrintMemberProfile = (m: any) => {
    setPrintingMember(m);
    // Give state time to render the hidden print component
    setTimeout(() => {
      window.print();
      // We don't clear it immediately so the print dialog has time to capture it
      // In a real robust app, you might listen to afterprint
      setTimeout(() => setPrintingMember(null), 1000);
    }, 100);
  };

  // Export data to Excel
  const exportMembersToExcel = async (membersToExport: any[], reportTitle = "Members_Report") => {
    try {
      const activeMembers = membersToExport.filter((m: any) => m.status !== 'deleted');
      const data = activeMembers.map((m, idx) => {
        const isCol = m.isCollector || m.role === 'collector' || state.admins.some(adm => adm.role === 'collector' && (adm.id === m.id || (adm.name && m.name && adm.name.trim().toLowerCase() === m.name.trim().toLowerCase())));
        const heldAmount = state.transactions
          .filter(t => (t.memberId === m.id || t.memberId === m.memberId) && (t.approved === true || t.status === "completed"))
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        const activeInvested = memberActiveInvestedCapital(m.id);
        const profitEarned = memberProfitShare(m.id);

        return {
          "S.No": idx + 1,
          "Member Name": m.name,
          "Member ID": m.memberId || m.id,
          "Role/Status": isCol ? "Collector" : "Member",
          "Assigned Collector": m.collectorName || "Unassigned",
          "Mobile": m.mobile || "",
          "WhatsApp": m.whatsapp || "",
          "Shares": m.shares || 1,
          "Monthly Obligation (₹)": (m.shares || 1) * 100,
          "Password": m.password || "",
          "Nominee Name": m.nomineeName || "",
          "Nominee Relation": m.nomineeRelation || "",
          "Nominee Address": m.nomineeAddress || "",
          "Nominee Contact": m.nomineeContact || "",
          "Total Contributions (₹)": heldAmount,
          "Invested Capital (₹)": activeInvested,
          "Profit Share (₹)": profitEarned,
          "Joined Date": m.joinedAt ? fmtDate(m.joinedAt) : "",
        };
      });

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "GRT Community Fund System";
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet("Members");
      worksheet.views = [{ showGridLines: true }];

      if (data.length > 0) {
        const keys = Object.keys(data[0]);
        worksheet.columns = keys.map(k => ({
          header: k,
          key: k,
          width: Math.min(Math.max(k.length, ...data.map(r => String(r[k as keyof typeof r] || '').length)) + 4, 40)
        }));

        const headerRow = worksheet.getRow(1);
        headerRow.height = 28;
        headerRow.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0F172A' }
          };
          cell.font = {
            name: 'Segoe UI',
            size: 11,
            bold: true,
            color: { argb: 'FFFFFFFF' }
          };
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        });

        data.forEach((rowObj: any, rIdx: number) => {
          const r = worksheet.addRow(keys.map(k => rowObj[k]));
          r.height = 22;
          r.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
            };
            cell.font = { name: 'Segoe UI', size: 10 };
            cell.alignment = { vertical: 'middle' };
            if (rIdx % 2 === 1) {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF8FAFC' }
              };
            }
          });
        });
      }

      const fileName = `${reportTitle}_${new Date().toISOString().split("T")[0]}.xlsx`;
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      window.URL.revokeObjectURL(url);

      toast.success(`Exported ${activeMembers.length} members to Excel`);
    } catch (err) {
      console.error("Failed to export Excel:", err);
      toast.error("Failed to export Excel report. Please try again.");
    }
  };
  // ─── Full Database Excel Export (ExcelJS Multi-Sheet Workbook) ───────────────
  const generateSummarySheetData = (activeMembers: any[]) => {
    const totalShares = activeMembers.reduce((sum, m) => sum + Number(m.shares || 1), 0);
    const monthlyTarget = totalShares * 100;
    const t = totals();
    const totalExpenses = (state.expenses || []).filter(e => e.source !== 'admin_fund').reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const activeCollectors = state.admins.filter(adm => adm.role === 'collector').length + activeMembers.filter(m => m.isCollector || m.role === 'collector').length;

    return [
      { "Metric / KPI Card": "REPORT METADATA", "Details / Value": "" },
      { "Metric / KPI Card": "Report Title", "Details / Value": "GRT Community Investment Fund - Master Executive Summary" },
      { "Metric / KPI Card": "Export Date & Time", "Details / Value": new Date().toLocaleString() },
      { "Metric / KPI Card": "Launch Cycle Cutoff", "Details / Value": "2026-07 (Cutoff Day: 15th of each month)" },
      { "Metric / KPI Card": "", "Details / Value": "" },

      { "Metric / KPI Card": "MEMBERSHIP & COLLECTOR KPIS", "Details / Value": "" },
      { "Metric / KPI Card": "Total Active Members", "Details / Value": activeMembers.length },
      { "Metric / KPI Card": "Total Active Collectors", "Details / Value": activeCollectors },
      { "Metric / KPI Card": "Total Committed Shares", "Details / Value": totalShares },
      { "Metric / KPI Card": "Monthly Contribution Pledge (₹)", "Details / Value": monthlyTarget },
      { "Metric / KPI Card": "", "Details / Value": "" },

      { "Metric / KPI Card": "FINANCIAL & TREASURY KPIS", "Details / Value": "" },
      { "Metric / KPI Card": "Total Monthly Contributions Collected (₹)", "Details / Value": t.totalCollected },
      { "Metric / KPI Card": "Total Active Invested Capital (₹)", "Details / Value": t.totalActiveCapital },
      { "Metric / KPI Card": "Total Business Profit Generated (₹)", "Details / Value": t.totalProfit },
      { "Metric / KPI Card": "Total Official Expenses (₹)", "Details / Value": totalExpenses },
      { "Metric / KPI Card": "Net Available Treasury Balance (₹)", "Details / Value": t.balance - totalExpenses },
      { "Metric / KPI Card": "Total Approved Transactions", "Details / Value": state.transactions.filter(tx => tx.approved || tx.status === 'completed').length },
      { "Metric / KPI Card": "Total Active Investments / Ventures", "Details / Value": state.investments.filter(i => i.status === 'active').length },
      { "Metric / KPI Card": "", "Details / Value": "" },

      { "Metric / KPI Card": "ACTIVE SYSTEM RULES & POLICIES", "Details / Value": "" },
      { "Metric / KPI Card": "Monthly Cutoff Date Rule", "Details / Value": "Due date is the 15th of every month. Payments on or after the 15th are due immediately." },
      { "Metric / KPI Card": "Advance Cutoff Logic", "Details / Value": "Months after the current active cutoff are classified as Advance/Optional payments." },
      { "Metric / KPI Card": "Share Pledge Formula", "Details / Value": "1 Share = ₹100 / month. Monthly pledge = Shares × ₹100." },
      { "Metric / KPI Card": "", "Details / Value": "" },

      { "Metric / KPI Card": "BADGE COLOR LEGEND & STATUS DEFINITIONS", "Details / Value": "" },
      { "Metric / KPI Card": "Paid / Confirmed Badge (Green)", "Details / Value": "Confirmed payment received for regular active cycle month." },
      { "Metric / KPI Card": "Advance Paid Badge (Purple)", "Details / Value": "Payment received ahead of cycle cutoff month." },
      { "Metric / KPI Card": "Held Badge (Amber)", "Details / Value": "Payment collected by Collector/Admin awaiting final approval." },
      { "Metric / KPI Card": "Due Badge (Soft Red)", "Details / Value": "Unpaid contribution past the 15th cutoff date (Calculated in Total Due)." },
    ];
  };

  const generateMonthlyMatrixData = (activeMembers: any[]) => {
    const now = new Date();
    const todayDate = now.getDate();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
    const isBefore15th = todayDate < 15;

    let activeCycleCutoffMonthKey = currentMonthKey;
    if (isBefore15th) {
      let prevY = currentYear;
      let prevM = currentMonth - 1;
      if (prevM < 1) {
        prevM = 12;
        prevY--;
      }
      activeCycleCutoffMonthKey = `${prevY}-${String(prevM).padStart(2, "0")}`;
    }

    const startYear = 2026;
    const startMonth = 7;
    let endYear = currentYear;
    let endMonth = currentMonth + 1;
    if (endMonth > 12) {
      endMonth = 1;
      endYear++;
    }
    for (const tx of state.transactions) {
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

    const matrixCycleMonths: string[] = [];
    let curY = startYear;
    let curM = startMonth;
    while (curY < endYear || (curY === endYear && curM <= endMonth)) {
      matrixCycleMonths.push(`${curY}-${String(curM).padStart(2, "0")}`);
      curM++;
      if (curM > 12) {
        curM = 1;
        curY++;
      }
    }

    return activeMembers.map((m, idx) => {
      const memberTxns = state.transactions.filter(
        (tx) => tx.memberId === m.id || tx.memberId === m.memberId
      );

      const paymentMap = new Map<string, "confirmed" | "pending">();
      const paidAmountMap = new Map<string, number>();

      for (const tx of memberTxns) {
        const mk = tx.monthKey || tx.month_paid_for || tx.for_month;
        if (!mk) continue;
        const amt = Number(tx.amount || 0);
        const isApproved = tx.approved === true || tx.status === "completed" || tx.status === "confirmed";
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

      const dueMonthsBeforeCutoff: string[] = [];
      matrixCycleMonths.forEach((mk) => {
        if (mk <= activeCycleCutoffMonthKey) {
          const st = paymentMap.get(mk);
          if (st !== "confirmed" && st !== "pending") {
            dueMonthsBeforeCutoff.push(mk);
          }
        }
      });

      const totalDueAmount = dueMonthsBeforeCutoff.length * targetMonthly;
      const totalPaidAmount = memberTxns
        .filter((tx) => tx.approved === true || tx.status === "completed")
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

      const row: Record<string, any> = {
        "S.No": idx + 1,
        "Member Name": m.name,
        "Member ID": m.memberId || m.id,
        "Collector": m.collectorName || "Unassigned",
        "Shares": shares,
        "Monthly Pledge (₹)": targetMonthly,
      };

      matrixCycleMonths.forEach((mk) => {
        const [yr, mo] = mk.split("-");
        const monthHeader = new Date(parseInt(yr), parseInt(mo) - 1, 1).toLocaleDateString(undefined, { month: "short", year: "numeric" });
        const isAdvance = mk > activeCycleCutoffMonthKey;
        const headerLabel = isAdvance ? `${monthHeader} (Adv)` : monthHeader;

        const st = paymentMap.get(mk);
        const paidAmt = paidAmountMap.get(mk) || targetMonthly;

        if (st === "confirmed") {
          row[headerLabel] = isAdvance ? `Advance Paid (₹${paidAmt})` : `Paid (₹${paidAmt})`;
        } else if (st === "pending") {
          row[headerLabel] = `Held (₹${paidAmt})`;
        } else {
          if (isAdvance) {
            row[headerLabel] = `Optional (₹${targetMonthly})`;
          } else {
            row[headerLabel] = `Due (₹${targetMonthly})`;
          }
        }
      });

      row["Total Due (₹)"] = totalDueAmount;
      row["Total Paid (₹)"] = totalPaidAmount;
      row["Status"] = dueMonthsBeforeCutoff.length === 0 ? "Up to date" : `${dueMonthsBeforeCutoff.length} Month(s) Due`;

      return row;
    });
  };


  const exportAllDataToExcel = async () => {
    try {
      const activeMembers = state.members.filter((m: any) => m.status !== 'deleted');
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "GRT Community Fund System";
      workbook.created = new Date();

      const darkHeaderFill: ExcelJS.Fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F172A' }
      };
      const sectionHeaderFill: ExcelJS.Fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' }
      };
      const zebraFill: ExcelJS.Fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8FAFC' }
      };
      const headerFont: Partial<ExcelJS.Font> = {
        name: 'Segoe UI',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFFFF' }
      };
      const thinBorder: Partial<ExcelJS.Borders> = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      const paidFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
      const paidFont: Partial<ExcelJS.Font> = { color: { argb: 'FF065F46' }, bold: true, size: 10 };

      const advanceFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDE9FE' } };
      const advanceFont: Partial<ExcelJS.Font> = { color: { argb: 'FF5B21B6' }, bold: true, size: 10 };

      const heldFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
      const heldFont: Partial<ExcelJS.Font> = { color: { argb: 'FF92400E' }, bold: true, size: 10 };

      const dueFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
      const dueFont: Partial<ExcelJS.Font> = { color: { argb: 'FF991B1B' }, bold: true, size: 10 };

      // ─── 1. Sheet 1: Executive Summary ───────────────────────────
      const summarySheet = workbook.addWorksheet("Executive Summary");
      summarySheet.views = [{ showGridLines: true }];
      const summaryData = generateSummarySheetData(activeMembers);

      summarySheet.columns = [
        { header: "Metric / KPI Card", key: "col1", width: 45 },
        { header: "Details / Value", key: "col2", width: 75 }
      ];

      const headerRow1 = summarySheet.getRow(1);
      headerRow1.height = 28;
      headerRow1.eachCell((cell) => {
        cell.fill = darkHeaderFill;
        cell.font = headerFont;
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      });

      summaryData.forEach((item: any, idx: number) => {
        const r = summarySheet.addRow([item["Metric / KPI Card"], item["Details / Value"]]);
        r.height = 22;
        const isSection = !item["Details / Value"] && item["Metric / KPI Card"] && item["Metric / KPI Card"] !== "";

        r.eachCell((cell) => {
          cell.border = thinBorder;
          cell.alignment = { vertical: 'middle' };
          if (isSection) {
            cell.fill = sectionHeaderFill;
            cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
          } else {
            cell.font = { name: 'Segoe UI', size: 10 };
            if (idx % 2 === 1) cell.fill = zebraFill;
          }
        });

        const valStr = String(item["Metric / KPI Card"]);
        if (valStr.includes("Paid / Confirmed")) {
          r.getCell(1).fill = paidFill; r.getCell(1).font = paidFont;
        } else if (valStr.includes("Advance Paid")) {
          r.getCell(1).fill = advanceFill; r.getCell(1).font = advanceFont;
        } else if (valStr.includes("Held Badge")) {
          r.getCell(1).fill = heldFill; r.getCell(1).font = heldFont;
        } else if (valStr.includes("Due Badge")) {
          r.getCell(1).fill = dueFill; r.getCell(1).font = dueFont;
        }
      });

      // ─── 2. Sheet 2: Combined Monthly Matrix ─────────────────────
      const matrixSheet = workbook.addWorksheet("Combined Monthly Matrix");
      matrixSheet.views = [{ showGridLines: true }];
      const matrixData = generateMonthlyMatrixData(activeMembers);

      if (matrixData.length > 0) {
        const matrixKeys = Object.keys(matrixData[0]);
        matrixSheet.columns = matrixKeys.map(k => ({
          header: k,
          key: k,
          width: Math.min(Math.max(k.length, ...matrixData.map(r => String(r[k] || '').length)) + 4, 35)
        }));

        const mHeaderRow = matrixSheet.getRow(1);
        mHeaderRow.height = 28;
        mHeaderRow.eachCell((cell) => {
          cell.fill = darkHeaderFill;
          cell.font = headerFont;
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        matrixData.forEach((rowObj: any, rIdx: number) => {
          const rowValues = matrixKeys.map(k => rowObj[k]);
          const r = matrixSheet.addRow(rowValues);
          r.height = 22;

          r.eachCell((cell) => {
            cell.border = thinBorder;
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.font = { name: 'Segoe UI', size: 10 };

            if (rIdx % 2 === 1) cell.fill = zebraFill;

            const val = String(cell.value || '');
            if (val.startsWith("Paid (")) {
              cell.fill = paidFill; cell.font = paidFont;
            } else if (val.startsWith("Advance Paid (")) {
              cell.fill = advanceFill; cell.font = advanceFont;
            } else if (val.startsWith("Held (")) {
              cell.fill = heldFill; cell.font = heldFont;
            } else if (val.startsWith("Due (")) {
              cell.fill = dueFill; cell.font = dueFont;
            }
          });
        });
      }

      // ─── 3. Sheet 3: All Members Directory ────────────────────────
      const directorySheet = workbook.addWorksheet("All Members Directory");
      directorySheet.views = [{ showGridLines: true }];
      const directoryData = activeMembers.map((m, idx) => {
        const isCol = m.isCollector || m.role === 'collector' || state.admins.some(adm => adm.role === 'collector' && (adm.id === m.id || (adm.name && m.name && adm.name.trim().toLowerCase() === m.name.trim().toLowerCase())));
        const heldAmount = state.transactions
          .filter(t => (t.memberId === m.id || t.memberId === m.memberId) && (t.approved === true || t.status === "completed"))
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        return {
          "S.No": idx + 1,
          "Member Name": m.name,
          "Member ID": m.memberId || m.id,
          "Role": isCol ? "Collector" : "Member",
          "Collector Assigned": m.collectorName || "Unassigned",
          "Mobile": m.mobile || "",
          "WhatsApp": m.whatsapp || "",
          "Shares": m.shares || 1,
          "Monthly Pledge (₹)": (m.shares || 1) * 100,
          "Total Contributions (₹)": heldAmount,
          "Invested Capital (₹)": memberActiveInvestedCapital(m.id),
          "Profit Earned (₹)": memberProfitShare(m.id),
          "Password": m.password || "",
          "Nominee Name": m.nomineeName || "",
          "Nominee Relation": m.nomineeRelation || "",
          "Nominee Address": m.nomineeAddress || "",
          "Nominee Contact": m.nomineeContact || "",
          "Joined Date": m.joinedAt ? fmtDate(m.joinedAt) : "",
        };
      });

      if (directoryData.length > 0) {
        const dirKeys = Object.keys(directoryData[0]);
        directorySheet.columns = dirKeys.map(k => ({
          header: k,
          key: k,
          width: Math.min(Math.max(k.length, ...directoryData.map(r => String(r[k as keyof typeof r] || '').length)) + 4, 40)
        }));

        const dHeaderRow = directorySheet.getRow(1);
        dHeaderRow.height = 28;
        dHeaderRow.eachCell((cell) => {
          cell.fill = darkHeaderFill;
          cell.font = headerFont;
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        });

        directoryData.forEach((rowObj: any, rIdx: number) => {
          const r = directorySheet.addRow(dirKeys.map(k => rowObj[k]));
          r.height = 22;
          r.eachCell((cell) => {
            cell.border = thinBorder;
            cell.font = { name: 'Segoe UI', size: 10 };
            cell.alignment = { vertical: 'middle' };
            if (rIdx % 2 === 1) cell.fill = zebraFill;
          });
        });
      }

      // ─── 4. Sheet 4: All Receipts History ─────────────────────────
      const receiptsSheet = workbook.addWorksheet("All Receipts History");
      receiptsSheet.views = [{ showGridLines: true }];
      const receiptsData = state.transactions.map((t, idx) => {
        const m = state.members.find(x => x.id === t.memberId || x.memberId === t.memberId);
        return {
          "S.No": idx + 1,
          "Receipt ID": t.receiptNo || t.id || "",
          "Member Name": m?.name || "",
          "Member ID": m?.memberId || t.memberId || "",
          "Collector Name": t.collectorName || m?.collectorName || "",
          "Type": t.type || "monthly",
          "For Month (Target Month)": t.for_month || t.month_paid_for || (t.monthKey ? fmtMonthKey(t.monthKey) : ""),
          "Month Key": t.monthKey || "",
          "Amount (₹)": t.amount,
          "Status": t.status,
          "Approved": t.approved ? "Yes" : "No",
          "Payment Date": t.paidAt ? new Date(t.paidAt).toLocaleString() : "",
        };
      });

      if (receiptsData.length > 0) {
        const rxKeys = Object.keys(receiptsData[0]);
        receiptsSheet.columns = rxKeys.map(k => ({
          header: k,
          key: k,
          width: Math.min(Math.max(k.length, ...receiptsData.map(r => String(r[k as keyof typeof r] || '').length)) + 4, 35)
        }));

        const rxHeaderRow = receiptsSheet.getRow(1);
        rxHeaderRow.height = 28;
        rxHeaderRow.eachCell((cell) => {
          cell.fill = darkHeaderFill;
          cell.font = headerFont;
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        });

        receiptsData.forEach((rowObj: any, rIdx: number) => {
          const r = receiptsSheet.addRow(rxKeys.map(k => rowObj[k]));
          r.height = 22;
          r.eachCell((cell) => {
            cell.border = thinBorder;
            cell.font = { name: 'Segoe UI', size: 10 };
            cell.alignment = { vertical: 'middle' };
            if (rIdx % 2 === 1) cell.fill = zebraFill;
          });
        });
      }

      // ─── 5. Investments Sheet ─────────────────────────────────────
      const investmentsSheet = workbook.addWorksheet("Investments");
      investmentsSheet.views = [{ showGridLines: true }];
      const investmentsData = state.investments.map((inv, idx) => ({
        "S.No": idx + 1,
        "Investment Name": inv.name,
        "Description": inv.description || "",
        "Capital Deployed (₹)": inv.capitalDeployed,
        "Status": inv.status || "active",
        "Total Profit (₹)": (inv.profitEntries || []).reduce((acc, p) => acc + (Number(p.amount) || 0), 0),
      }));

      if (investmentsData.length > 0) {
        const invKeys = Object.keys(investmentsData[0]);
        investmentsSheet.columns = invKeys.map(k => ({
          header: k,
          key: k,
          width: Math.min(Math.max(k.length, ...investmentsData.map(r => String(r[k as keyof typeof r] || '').length)) + 4, 40)
        }));

        const iHeaderRow = investmentsSheet.getRow(1);
        iHeaderRow.height = 28;
        iHeaderRow.eachCell((cell) => {
          cell.fill = darkHeaderFill;
          cell.font = headerFont;
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        });

        investmentsData.forEach((rowObj: any, rIdx: number) => {
          const r = investmentsSheet.addRow(invKeys.map(k => rowObj[k]));
          r.height = 22;
          r.eachCell((cell) => {
            cell.border = thinBorder;
            cell.font = { name: 'Segoe UI', size: 10 };
            cell.alignment = { vertical: 'middle' };
            if (rIdx % 2 === 1) cell.fill = zebraFill;
          });
        });
      }

      // ─── 6. Expenses Sheet ────────────────────────────────────────
      const expensesSheet = workbook.addWorksheet("Expenses");
      expensesSheet.views = [{ showGridLines: true }];
      const expensesData = (state.expenses || []).map((exp, idx) => ({
        "S.No": idx + 1,
        "Description": exp.description,
        "Category": exp.category || "General",
        "Amount (₹)": exp.amount,
        "Added By": exp.addedBy || "",
        "Date": exp.date ? fmtDate(exp.date) : "",
        "Notes": exp.notes || "",
      }));

      if (expensesData.length > 0) {
        const expKeys = Object.keys(expensesData[0]);
        expensesSheet.columns = expKeys.map(k => ({
          header: k,
          key: k,
          width: Math.min(Math.max(k.length, ...expensesData.map(r => String(r[k as keyof typeof r] || '').length)) + 4, 35)
        }));

        const eHeaderRow = expensesSheet.getRow(1);
        eHeaderRow.height = 28;
        eHeaderRow.eachCell((cell) => {
          cell.fill = darkHeaderFill;
          cell.font = headerFont;
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        });

        expensesData.forEach((rowObj: any, rIdx: number) => {
          const r = expensesSheet.addRow(expKeys.map(k => rowObj[k]));
          r.height = 22;
          r.eachCell((cell) => {
            cell.border = thinBorder;
            cell.font = { name: 'Segoe UI', size: 10 };
            cell.alignment = { vertical: 'middle' };
            if (rIdx % 2 === 1) cell.fill = zebraFill;
          });
        });
      }

      const fileName = `GRT_Full_Database_Export_${new Date().toISOString().split("T")[0]}.xlsx`;
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      window.URL.revokeObjectURL(url);

      toast.success(`Full Database Export (${activeMembers.length} members across all sheets) downloaded successfully`);
    } catch (err) {
      console.error("Failed full export Excel:", err);
      toast.error("Failed to generate full Excel export.");
    }
  };

  if (!a) return null;

  const submitInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invName || !invCap) return;
    if (editingInv) {
      updateInvestment(editingInv.id, {
        ...editingInv,
        name: invName,
        description: invDesc,
        capitalDeployed: parseFloat(invCap),
      });
      toast.success(`Updated investment: ${invName}`);
      setEditingInv(null);
    } else {
      addInvestment({
        name: invName,
        description: invDesc,
        capitalDeployed: parseFloat(invCap),
      });
      toast.success(`Created investment: ${invName}`);
    }
    setInvName("");
    setInvDesc("");
    setInvCap("");
    setInvProfit("");
  };

  const handleMemberUpdate = () => {
    if (!editingMember) return;

    const newCollector = state.admins.find(a => a.name === memberForm.collectorName);

    if (newCollector) {
      reassignMemberToCollector(editingMember.id, newCollector);
      updateMember(editingMember.id, {
        name: memberForm.name,
        mobile: memberForm.mobile,
        whatsapp: memberForm.whatsapp,
        password: memberForm.password,
        nomineeName: memberForm.nomineeName,
        nomineeRelation: memberForm.nomineeRelation,
        nomineeAddress: memberForm.nomineeAddress,
        nomineeContact: memberForm.nomineeContact,
        shares: memberForm.shares,
      });
    } else {
      updateMember(editingMember.id, memberForm);
    }

    toast.success("Member details and transactions updated");
    setEditingMember(null);
  };

  const handleCollectorUpdate = () => {
    if (!editingCollector) return;
    updateAdmin(editingCollector.id, collectorForm);
    toast.success("Collector details updated");
    setEditingCollector(null);
  };

  const MemberTable = ({ members, title }: { members: any[], title: string }) => (
    <Card className="p-5 mb-6 mt-6 bg-pink-50 border-pink-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <Button
          variant="outline"
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white border-none flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          onClick={() => exportMembersToExcel(members, title.replace(/\s+/g, "_"))}
        >
          <FileSpreadsheet className="h-4 w-4" />
          Export Table to Excel
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">S.No</TableHead>
            <TableHead>Member</TableHead>
            <TableHead>Collector Status</TableHead>
            <TableHead>Assigned Collector</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Mobile</TableHead>
            <TableHead>WhatsApp</TableHead>
            <TableHead>Shares</TableHead>
            <TableHead>Password</TableHead>
            <TableHead>Actions</TableHead>
            <TableHead className="text-right">Held</TableHead>
            <TableHead className="text-right">Invested</TableHead>
            <TableHead className="text-right">Profit Earned</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((m, idx) => {
            const isPaid = memberMonthlyPaid(m.id, mkInput);
            const isCol = m.isCollector || m.role === 'collector' || state.admins.some(adm => adm.role === 'collector' && (adm.id === m.id || (adm.name && m.name && adm.name.trim().toLowerCase() === m.name.trim().toLowerCase())));
            return (
              <TableRow key={m.id}>
                <TableCell className="font-mono text-xs text-slate-500">{idx + 1}</TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="font-medium text-slate-900 cursor-pointer hover:underline">{m.name}</div>
                    </DialogTrigger>
                    <DialogContent className="max-h-[85vh] sm:max-w-2xl overflow-y-auto">
                      <DialogHeader><DialogTitle>Member Profile</DialogTitle></DialogHeader>
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          {m.profilePhoto ? <img src={getProfilePhotoUrl(m.profilePhoto)} alt="Profile" className="w-20 h-20 rounded-full object-cover flex-shrink-0" /> : <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0">No Photo</div>}
                          <div className="flex-1">
                            <h3 className="text-xl font-bold">{m.name}</h3>
                            <p className="text-slate-600 font-mono text-sm">ID: {m.memberId}</p>
                            <p className="text-slate-600">Mobile: {m.mobile}</p>
                            <p className="text-slate-600">WhatsApp: {m.whatsapp}</p>
                            <p className="text-slate-600 font-medium">Shares: {m.shares || 1}</p>
                          </div>
                        </div>
                        {m.nomineeName && (
                          <div className="border-t pt-4">
                            <h4 className="font-semibold text-slate-900 mb-2">Nominee Information</h4>
                            <div className="space-y-1 text-sm">
                              <p><span className="font-medium text-slate-700">Name:</span> <span className="text-slate-600">{m.nomineeName}</span></p>
                              {m.nomineeRelation && <p><span className="font-medium text-slate-700">Relation:</span> <span className="text-slate-600">{m.nomineeRelation}</span></p>}
                              <p><span className="font-medium text-slate-700">Address:</span> <span className="text-slate-600">{m.nomineeAddress}</span></p>
                              <p><span className="font-medium text-slate-700">Contact:</span> <span className="text-slate-600">{m.nomineeContact}</span></p>
                            </div>
                          </div>
                        )}
                        <div className="border-t pt-4">
                          <MemberPaymentGrid member={m} transactions={state.transactions} />
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
                <TableCell>
                  {isCol ? (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">Collector</Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-500">Member</Badge>
                  )}
                </TableCell>
                <TableCell>{m.collectorName || '—'}</TableCell>
                <TableCell className="font-mono text-xs">{m.memberId}</TableCell>
                <TableCell className="font-mono text-xs">{m.mobile}</TableCell>
                <TableCell className="font-mono text-xs">{m.whatsapp}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-medium whitespace-nowrap">
                    {m.shares || 1} Share{Number(m.shares || 1) > 1 ? 's' : ''} ({Number(m.shares || 1) * 100}/mo)
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">{m.password}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    <Button variant="ghost" size="sm" onClick={() => {
                      setEditingMember(m);
                      setMemberForm({
                        name: m.name,
                        mobile: m.mobile,
                        whatsapp: m.whatsapp,
                        password: m.password,
                        collectorName: m.collectorName || "",
                        nomineeName: m.nomineeName || "",
                        nomineeRelation: m.nomineeRelation || "",
                        nomineeAddress: m.nomineeAddress || "",
                        nomineeContact: m.nomineeContact || "",
                        shares: m.shares ?? 1,
                      });
                    }}>Edit</Button>
                    {/* Print profile button */}
                    <Button
                      variant="outline"
                      size="sm"
                      title="Print Profile"
                      onClick={() => handlePrintMemberProfile(m)}
                    >
                      <Printer className="h-3.5 w-3.5" />
                    </Button>
                    {/* Send credentials via WhatsApp */}
                    <Button
                      variant="outline"
                      size="sm"
                      title="Send Credentials via WhatsApp"
                      className="text-green-700 border-green-300 hover:bg-green-50"
                      onClick={() => sendCredentialWhatsApp(m)}
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                    </Button>
                    {a.role === 'admin' && (
                      <Button variant="destructive" size="sm" onClick={() => setMemberToRemove(m)}>Remove</Button>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {fmt(state.transactions.filter(t => (t.memberId === m.id || t.memberId === m.memberId) && (t.approved === true || t.status === "completed")).reduce((sum, t) => sum + (Number(t.amount) || 0), 0))}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {fmt(memberActiveInvestedCapital(m.id))}
                </TableCell>
                <TableCell className="text-right font-semibold text-emerald-600">
                  {fmt(memberProfitShare(m.id))}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <tfoot className="border-t bg-slate-50/50 font-semibold">
          <tr>
            <td colSpan={7} className="p-4 text-right">Total Active Shares:</td>
            <td className="p-4 text-left">
              <div>{members.reduce((acc, m) => acc + Number(m.shares || 1), 0)} Shares</div>
              <div className="text-xs text-slate-500 font-normal">
                ({members.reduce((acc, m) => acc + Number(m.shares || 1), 0) * 100} / mo)
              </div>
            </td>
            <td colSpan={5}></td>
          </tr>
        </tfoot>
      </Table>
    </Card>
  );

  return (
    <AppShell
      title={`${a.name} · ${a.role === 'admin' ? 'Admin' : 'Collector'} Console`}
      subtitle={a.role === 'admin' ? "Log received payments, review your ledger, and transfer to the Core Treasurer." : "Log received payments, review your ledger, and transfer to the Admin."}
    >
      {/* Hidden printable member profile — only rendered when a member is selected */}
      {printingMember && (
        <MemberProfilePrint
          member={printingMember}
          transactions={state.transactions}
        />
      )}

      {a.role === 'collector' && (
        <Card className="p-5 mb-6">
          <h2 className="mb-3 font-semibold text-slate-900">
            Pending Approvals
          </h2>
          {pendingApprovals.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Collector</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingApprovals.map((t: any) => {
                    const m = state.members.find(x => x.id === t.memberId);
                    const c = state.admins.find(x => x.id === t.adminId);
                    return (
                      <TableRow key={t.id}>
                        <TableCell>{t.receiptNo}</TableCell>
                        <TableCell>
                          <div className="font-medium">{m?.name}</div>
                          <div className="font-mono text-xs text-slate-500">{m?.memberId}</div>
                        </TableCell>
                        <TableCell>{c?.name ? `${c.name} (Collector)` : m?.collectorName ? `${m.collectorName} (Collector)` : "—"}</TableCell>
                        <TableCell>
                          {editingTx === t.id ? (
                            <input
                              type="number"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              className="w-16 rounded border p-1 text-sm"
                            />
                          ) : (
                            fmt(t.amount)
                          )}
                        </TableCell>
                        <TableCell className="flex gap-2">
                          {editingTx === t.id ? (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => {
                                  approvePayment(t.id, editAmount ? parseInt(editAmount) : undefined);
                                  setEditingTx(null);
                                  toast.success("Payment approved");
                                }}
                              >
                                ✓
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingTx(null)}
                              >
                                ✕
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setEditingTx(t.id);
                                  setEditAmount(t.amount.toString());
                                }}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  rejectPayment(t.id);
                                  toast.success("Payment rejected");
                                }}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </>
          ) : (
            <div className="text-sm text-slate-500">No pending approvals.</div>
          )}
        </Card>
      )}

      {a.role === 'admin' && (() => {
        // Include master admin as a valid collector
        const allCollectors = [
          ...state.members.filter(m => m.isCollector),
          { id: 'admin', name: a.name, isCollector: true, memberId: 'ADM001' }
        ];
        const grandTotal = allCollectors.reduce((sum, collector) => {
          const collectorTxns = state.transactions.filter((t) => {
            const m = state.members.find((x) => x.id === t.memberId);
            // Handle admin transactions (when they act as a collector)
            if (collector.id === 'admin') {
              return t.adminId === a.id || (m?.collectorName && a.name && m.collectorName.trim().toLowerCase() === a.name.trim().toLowerCase());
            }
            return (
              (m?.collectorName && collector.name && m.collectorName.trim().toLowerCase() === collector.name.trim().toLowerCase()) ||
              (m?.adminId && m.adminId === collector.id) ||
              t.adminId === collector.id ||
              (t.collectorName && collector.name && t.collectorName.trim().toLowerCase() === collector.name.trim().toLowerCase())
            );
          });
          // Only count unapproved/held_by_admin payments in grand total
          const collectorTotal = collectorTxns
            .filter((t) => !t.approved && t.status === 'held_by_admin')
            .reduce((acc, t) => acc + Number(t.amount || 0), 0);
          return sum + collectorTotal;
        }, 0);

        return (
          <>
            <div className="rounded-xl bg-amber-50 border-2 border-amber-200 p-5 mb-6 mt-8">
            <div className="mb-4 text-xl font-bold text-amber-900 border-b border-amber-300 pb-2">Pending to Approve</div>
            {allCollectors.map(collector => {
              const collectorMembers = state.members.filter(m => {
                if (collector.id === 'admin') {
                  return m.adminId === a.id || (m.collectorName && a.name && m.collectorName.trim().toLowerCase() === a.name.trim().toLowerCase());
                }
                return m.collectorName && collector.name && m.collectorName.trim().toLowerCase() === collector.name.trim().toLowerCase();
              });
              const collectorTxns = state.transactions.filter((t) => {
                const m = state.members.find((x) => x.id === t.memberId);
                if (collector.id === 'admin') {
                  return t.adminId === a.id || (m?.collectorName && a.name && m.collectorName.trim().toLowerCase() === a.name.trim().toLowerCase());
                }
                return (
                  (m?.collectorName && collector.name && m.collectorName.trim().toLowerCase() === collector.name.trim().toLowerCase()) ||
                  (m?.adminId && m.adminId === collector.id) ||
                  t.adminId === collector.id ||
                  (t.collectorName && collector.name && t.collectorName.trim().toLowerCase() === collector.name.trim().toLowerCase())
                );
              });
              // Collector total = only unapproved (held_by_admin) payments
              const collectorTotal = collectorTxns
                .filter((t) => !t.approved && t.status === 'held_by_admin')
                .reduce((sum, t) => sum + Number(t.amount || 0), 0);

              const collectorId = collector.id;
              // Pending admin approvals for this collector
              const collectorAdminApprovals = state.transactions.filter(t => {
                if (t.approved || t.status !== 'held_by_admin') return false;
                const member = state.members.find(m => m.id === t.memberId);
                if (collector.id === 'admin') {
                   return t.adminId === a.id || (member?.collectorName && a.name && member.collectorName.trim().toLowerCase() === a.name.trim().toLowerCase());
                }
                return t.adminId === collectorId || (member?.collectorName && collector.name && member.collectorName.trim().toLowerCase() === collector.name.trim().toLowerCase());
              });

              return (
                <div key={collector.id} className="mb-6 border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">{collector.name}</h3>
                    <div className="flex items-center gap-3">
                      {collectorTotal > 0 && (
                        <div className="font-bold text-amber-600">Total Unapproved: {fmt(collectorTotal)}</div>
                      )}
                      {collectorAdminApprovals.length > 0 && (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => {
                            collectorAdminApprovals.forEach(t => {
                              approvePayment(t.id);
                            });
                            toast.success(`Approved all ${collectorAdminApprovals.length} payments for ${collector.name}`);
                          }}
                        >
                          Approve All ({collectorAdminApprovals.length})
                        </Button>
                      )}
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Mobile</TableHead>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Pending (Held)</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {collectorMembers.map(m => {
                        const memberPendingTxns = state.transactions.filter(t => t.memberId === m.id && !t.approved && t.status === 'held_by_admin');
                        // Filter out members who don't have any pending transactions
                        if (memberPendingTxns.length === 0) return null;
                        
                        const months = [...new Set(memberPendingTxns.map(t => t.monthKey || 'N/A'))].map(mk => fmtMonthKey(mk)).join(', ');
                        const pendingAmt = memberPendingTxns.reduce((s, t) => s + Number(t.amount || 0), 0);
                        return (
                          <TableRow key={m.id}>
                            <TableCell>{m.name}</TableCell>
                            <TableCell className="font-mono text-xs">{m.memberId}</TableCell>
                            <TableCell>{m.mobile}</TableCell>
                            <TableCell className="text-sm text-slate-600">{months || '—'}</TableCell>
                            <TableCell className="text-right font-semibold">{pendingAmt > 0 ? fmt(pendingAmt) : '—'}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                  onClick={() => {
                                    memberPendingTxns.forEach(t => approvePayment(t.id));
                                    toast.success(`Approved payments for ${m.name}`);
                                  }}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    memberPendingTxns.forEach(t => rejectPayment(t.id));
                                    toast.success(`Rejected payments for ${m.name}`);
                                  }}
                                >
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              );
            })}
            {grandTotal >= 0 && (
              <Card className="p-4 mb-2 bg-white border border-amber-300">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg text-amber-900">All Collectors — Unapproved Total</h3>
                  <div className="font-bold text-2xl text-amber-700">{fmt(grandTotal)}</div>
                </div>
              </Card>
            )}
            </div>
          </>
        );
      })()}

      {a.role === 'admin' && (
        <Card className="p-5 mb-4">
          <div className="mb-4 text-xs font-semibold uppercase text-blue-800">Admin: Manage Active Collectors</div>
          <div className="mb-4">
            <Label className="mb-2 block">Promote Member to Collector</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                className="w-full sm:flex-1 rounded-md border p-2 text-sm"
                value={selectedPromoteId}
                onChange={(e) => setSelectedPromoteId(e.target.value)}
              >
                <option value="">Select a member to promote...</option>
                {promotableMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.memberId})</option>
                ))}
              </select>
              <Button
                type="button"
                disabled={!selectedPromoteId}
                onClick={async () => {
                  if (!selectedPromoteId) return;
                  const m = state.members.find(x => x.id === selectedPromoteId);
                  if (!m) return;
                  try {
                    await setCollectorStatus(m.id, true);
                    toast.success(`Promoted ${m.name} to collector`);
                    setSelectedPromoteId("");
                  } catch (error) {
                    console.error('Failed to promote member:', error);
                    toast.error('Could not promote this member. Please try again.');
                  }
                }}
              >
                Promote
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {promotedMembers.map(c => (
              <div key={c.id} className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-md text-sm font-medium text-emerald-900">
                <span>{c.name} ({c.memberId})</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 ml-1"
                  onClick={async () => {
                    try {
                      await setCollectorStatus(c.id, false);
                      toast.success(`Removed collector privileges from ${c.name}`);
                    } catch (error) {
                      console.error('Failed to remove collector privileges:', error);
                      toast.error('Could not remove collector privileges.');
                    }
                  }}
                >
                  ×
                </Button>
              </div>
            ))}
            {promotedMembers.length === 0 && (
              <div className="text-sm text-slate-500 italic">No members currently promoted to collector.</div>
            )}
          </div>
        </Card>
      )}

      {a.role === 'admin' && (
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <Button onClick={() => {
            window.print();
          }}>Print Members Report</Button>
          <PrintableReport state={state} />
          <Button
            variant="default"
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
            onClick={exportAllDataToExcel}
          >
            <Download className="h-4 w-4" />
            Export Full Database to Excel
          </Button>
        </div>
      )}

      {/* Monthly Contributions Overview Matrix */}
      <MonthlyContributionsOverviewCard
        members={a.role === 'admin' ? allMembers : myMembers}
        transactions={state.transactions}
      />

      {a.role === 'admin' && (
        <div className="mb-4">
          <Input
            placeholder="Search members by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {a.role === 'admin' ? (
        <MemberTable members={allMembers} title="All Registered Members" />
      ) : (
        <MemberTable members={myMembers} title="My Registered Members" />
      )}

      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto w-full max-w-md">
          <DialogHeader><DialogTitle>Edit Member Details</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={memberForm.name} onChange={e => setMemberForm({ ...memberForm, name: e.target.value })} placeholder="Full name" />
            </div>
            <div className="space-y-2">
              <Label>Mobile</Label>
              <Input value={memberForm.mobile} onChange={e => setMemberForm({ ...memberForm, mobile: e.target.value })} placeholder="Mobile number" />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp</Label>
              <Input value={memberForm.whatsapp} onChange={e => setMemberForm({ ...memberForm, whatsapp: e.target.value })} placeholder="WhatsApp number" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input value={memberForm.password} onChange={e => setMemberForm({ ...memberForm, password: e.target.value })} placeholder="Password" />
            </div>
            <div className="space-y-2">
              <Label>Shares</Label>
              <select
                className="w-full rounded-md border p-2 focus:border-slate-400 focus:outline-none"
                value={memberForm.shares}
                onChange={e => setMemberForm({ ...memberForm, shares: parseInt(e.target.value) || 1 })}
              >
                <option value={1}>1 Share (100 / month)</option>
                <option value={2}>2 Shares (200 / month)</option>
                <option value={3}>3 Shares (300 / month)</option>
                <option value={4}>4 Shares (400 / month)</option>
                <option value={5}>5 Shares (500 / month)</option>
                <option value={6}>6 Shares (600 / month)</option>
                <option value={7}>7 Shares (700 / month)</option>
                <option value={8}>8 Shares (800 / month)</option>
                <option value={9}>9 Shares (900 / month)</option>
                <option value={10}>10 Shares (1000 / month)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Collector</Label>
              <select value={memberForm.collectorName} onChange={e => setMemberForm({ ...memberForm, collectorName: e.target.value })} className="w-full rounded-md border p-2">
                <option value="">Select a Collector</option>
                {state.admins.filter(adm => adm.role === 'admin').map(adm => (
                  <option key={adm.id} value={adm.name}>{adm.name} (Admin)</option>
                ))}
                {state.members.filter(m => m.isCollector).map(c => (
                  <option key={c.id} value={c.name}>{c.name} (Collector)</option>
                ))}
              </select>
            </div>
            <div className="border-t pt-4 mt-4">
              <Label className="font-semibold mb-3 block">Nominee Information</Label>
              <div className="space-y-2">
                <Label htmlFor="editNomineeName">Nominee Name</Label>
                <Input id="editNomineeName" value={memberForm.nomineeName} onChange={e => setMemberForm({ ...memberForm, nomineeName: e.target.value })} placeholder="Full name" />
              </div>
              <div className="space-y-2 mt-3">
                <Label htmlFor="editNomineeRelation">Relation with Nominee</Label>
                <Input id="editNomineeRelation" value={memberForm.nomineeRelation} onChange={e => setMemberForm({ ...memberForm, nomineeRelation: e.target.value })} placeholder="e.g., Wife" />
              </div>
              <div className="space-y-2 mt-3">
                <Label htmlFor="editNomineeAddress">Nominee Address</Label>
                <Input id="editNomineeAddress" value={memberForm.nomineeAddress} onChange={e => setMemberForm({ ...memberForm, nomineeAddress: e.target.value })} placeholder="Address" />
              </div>
              <div className="space-y-2 mt-3">
                <Label htmlFor="editNomineeContact">Nominee Contact</Label>
                <Input id="editNomineeContact" value={memberForm.nomineeContact} onChange={e => setMemberForm({ ...memberForm, nomineeContact: e.target.value })} placeholder="Contact number" />
              </div>
            </div>
            <Button onClick={handleMemberUpdate} className="w-full mt-4">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingCollector} onOpenChange={(open) => !open && setEditingCollector(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Collector Details</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Name</Label>
              <Input value={collectorForm.name} onChange={e => setCollectorForm({ ...collectorForm, name: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Mobile</Label>
              <Input value={collectorForm.mobile} onChange={e => setCollectorForm({ ...collectorForm, mobile: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">WhatsApp</Label>
              <Input value={collectorForm.whatsapp} onChange={e => setCollectorForm({ ...collectorForm, whatsapp: e.target.value })} className="col-span-3" />
            </div>
            <Button onClick={handleCollectorUpdate}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingReceiptMonth} onOpenChange={(open) => !open && setEditingReceiptMonth(null)}>
        <DialogContent className="w-full max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Payment Month</DialogTitle>
          </DialogHeader>
          {editingReceiptMonth && (
            <div className="space-y-4 py-2">
              <div className="rounded-md border bg-slate-50 p-3 space-y-1.5 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Receipt No:</span>
                  <span className="font-mono font-semibold">{editingReceiptMonth.receiptNo || editingReceiptMonth.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Member:</span>
                  <span className="font-semibold">
                    {state.members.find(m => m.id === editingReceiptMonth.memberId || m.memberId === editingReceiptMonth.memberId)?.name || editingReceiptMonth.memberId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount:</span>
                  <span className="font-semibold">₹{editingReceiptMonth.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Month:</span>
                  <span className="font-medium text-slate-900">
                    {editingReceiptMonth.month_paid_for || editingReceiptMonth.for_month || (editingReceiptMonth.monthKey ? fmtMonthKey(editingReceiptMonth.monthKey) : '—')}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editMonthSelect">Select New Target Month</Label>
                <select
                  id="editMonthSelect"
                  value={selectedNewMonthKey}
                  onChange={(e) => setSelectedNewMonthKey(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-sm focus:border-slate-500 focus:outline-none"
                >
                  {monthOptions.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label} ({opt.key})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingReceiptMonth(null)}
                  disabled={isSavingMonth}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (!editingReceiptMonth || !selectedNewMonthKey) return;
                    setIsSavingMonth(true);
                    try {
                      const ok = await updatePaymentMonth(editingReceiptMonth.id, selectedNewMonthKey);
                      if (ok !== false) {
                        toast.success("Payment month updated successfully");
                        setEditingReceiptMonth(null);
                        await refreshData();
                      } else {
                        toast.error("Failed to update payment month");
                      }
                    } catch (err: any) {
                      console.error("Error saving payment month:", err);
                      toast.error(err?.message || "An error occurred while updating payment month");
                    } finally {
                      setIsSavingMonth(false);
                    }
                  }}
                  disabled={isSavingMonth}
                >
                  {isSavingMonth ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <span className="font-semibold">{memberToRemove?.name}</span> ({memberToRemove?.memberId})? This action will delete all associated transactions and records. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (memberToRemove) {
                  removeMember(memberToRemove.id);
                  toast.success(`Removed member: ${memberToRemove.name}`);
                  setMemberToRemove(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid gap-6">
        <Card className="p-5 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="font-semibold text-slate-900 text-lg">Recent Receipts</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {totalReceiptsCount === 0
                  ? "No receipts found"
                  : `Showing ${Math.min((receiptPage - 1) * receiptsPerPage + 1, totalReceiptsCount)} - ${Math.min(receiptPage * receiptsPerPage, totalReceiptsCount)} of ${totalReceiptsCount} receipts`}
              </p>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Text Search Input */}
              <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search receipt, member, collector..."
                  value={receiptSearchQuery}
                  onChange={(e) => setReceiptSearchQuery(e.target.value)}
                  className="pl-9 pr-7 h-9 text-xs"
                />
                {receiptSearchQuery && (
                  <button
                    onClick={() => setReceiptSearchQuery("")}
                    className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Month Filter */}
              <select
                value={receiptMonthFilter}
                onChange={(e) => setReceiptMonthFilter(e.target.value)}
                className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="all">All Months</option>
                {availableReceiptMonths.map((mk) => (
                  <option key={mk} value={mk}>
                    {fmtMonthKey(mk)} ({mk})
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={receiptStatusFilter}
                onChange={(e) => setReceiptStatusFilter(e.target.value)}
                className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="all">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="held_collector">Held with Collector</option>
                <option value="held_admin">Held by Admin</option>
                <option value="pending">Pending</option>
              </select>

              {/* Clear Filters Button */}
              {(receiptSearchQuery || receiptMonthFilter !== "all" || receiptStatusFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReceiptSearchQuery("");
                    setReceiptMonthFilter("all");
                    setReceiptStatusFilter("all");
                  }}
                  className="h-9 px-2 text-xs text-slate-500 hover:text-slate-900"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Collector</TableHead>
                  <TableHead>For Month</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedReceipts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-xs text-slate-500">
                      No receipts match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedReceipts.map((t: any) => {
                    const m = state.members.find((x) => x.id === t.memberId || x.memberId === t.memberId);
                    // Resolve collector name from multiple sources
                    const collectorName =
                      m?.collectorName ||
                      state.admins.find(x => x.id === t.adminId)?.name ||
                      state.members.find(x => x.id === t.adminId)?.name ||
                      "—";
                    // Unified status logic — same across all dashboards
                    const isApproved = t.approved || t.status === 'completed';
                    const isHeldByAdmin = !isApproved && (t.status === 'held_by_admin' || t.status === 'Held by Admin');
                    const isHeldByCollector = !isApproved && !isHeldByAdmin && (
                      t.status === 'held_by_collector' ||
                      t.status?.startsWith('Held with') ||
                      t.status?.startsWith('Held by Collector')
                    );
                    const statusLabel = isApproved
                      ? 'Confirmed'
                      : isHeldByAdmin
                      ? 'Held by Admin'
                      : isHeldByCollector
                      ? `Held with ${collectorName}`
                      : t.status || 'Pending';
                    const badgeVariant: 'default' | 'secondary' | 'outline' = isApproved
                      ? 'default'
                      : isHeldByAdmin
                      ? 'secondary'
                      : 'outline';
                    const monthDisplay = t.month_paid_for || t.for_month || t.contribution_month || (t.monthKey ? fmtMonthKey(t.monthKey) : '—');
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-xs">
                          {t.receiptNo}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{m?.name ?? "—"}</div>
                          <div className="font-mono text-xs text-slate-500">{m?.memberId ?? t.memberId}</div>
                        </TableCell>
                        <TableCell className="text-sm">{collectorName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                              {monthDisplay}
                            </Badge>
                            {a?.role === 'admin' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-slate-400 hover:text-slate-800 hover:bg-slate-100 p-0"
                                onClick={() => handleOpenEditMonth(t)}
                                title="Edit Payment Month"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(t.paidAt).toLocaleString('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</TableCell>
                        <TableCell>
                          <Badge variant={badgeVariant}>
                            {statusLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {fmt(t.amount)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls & Item Counter */}
          {totalReceiptsCount > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                Showing <span className="font-medium text-slate-700">{Math.min((receiptPage - 1) * receiptsPerPage + 1, totalReceiptsCount)}</span> to{" "}
                <span className="font-medium text-slate-700">{Math.min(receiptPage * receiptsPerPage, totalReceiptsCount)}</span> of{" "}
                <span className="font-medium text-slate-700">{totalReceiptsCount}</span> receipts
              </div>

              <div className="flex items-center gap-4">
                {/* Items per page selector */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span>Per page:</span>
                  <select
                    value={receiptsPerPage}
                    onChange={(e) => setReceiptsPerPage(Number(e.target.value))}
                    className="h-8 rounded border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                {/* Page Navigation */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setReceiptPage((p) => Math.max(1, p - 1))}
                      disabled={receiptPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-slate-600 px-2 font-medium">
                      Page {receiptPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setReceiptPage((p) => Math.min(totalPages, p + 1))}
                      disabled={receiptPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      {a.role === "admin" && (
        <Card className="p-5 mb-6 mt-6">
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3">
            <div className="mb-2 text-xs font-semibold uppercase text-amber-800">
              Admin: Manage Official Expenses
            </div>
            <div className="space-y-3">
              {state.expenses.filter(e => e.source !== 'admin_fund').length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-semibold text-amber-900 mb-2">Recent Expenses</div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Added By</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {state.expenses.filter(e => e.source !== 'admin_fund').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((exp) => (
                        <TableRow key={exp.id}>
                          <TableCell>{exp.description}</TableCell>
                          <TableCell>{exp.category}</TableCell>
                          <TableCell>{fmtDate(exp.date)}</TableCell>
                          <TableCell className="text-right font-semibold">{fmt(exp.amount)}</TableCell>
                          <TableCell>{exp.addedBy}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                deleteExpense(exp.id);
                                toast.success("Expense deleted");
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-3 text-right font-bold text-amber-900">
                    Total Expenses: {fmt(state.expenses.filter(e => e.source !== 'admin_fund').reduce((sum, e) => sum + Number(e.amount || 0), 0))}
                  </div>
                </div>
              )}
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!expenseForm.description || !expenseForm.amount) {
                  toast.error("Please fill in all required fields");
                  return;
                }
                addExpense({
                  description: expenseForm.description,
                  amount: parseFloat(expenseForm.amount),
                  category: expenseForm.category,
                  notes: expenseForm.notes,
                });
                setExpenseForm({ description: "", amount: "", category: "Operations", notes: "" });
                toast.success("Expense added successfully");
              }} className="grid gap-2 border-t pt-3">
                <Label>Description</Label>
                <Input
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="e.g., Office supplies, Event venue, etc."
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Category</Label>
                    <select
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                      className="w-full border rounded p-2 text-sm"
                    >
                      <option value="Operations">Operations</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Event">Event</option>
                      <option value="Administrative">Administrative</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      placeholder="0"
                      required
                    />
                  </div>
                </div>
                <Label>Notes (Optional)</Label>
                <Input
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  placeholder="Additional details..."
                />
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700">Add Expense</Button>
              </form>
            </div>
          </div>
        </Card>
      )}

      {a.role === "admin" && (
        <Card className="p-5 mb-6 mt-6">
          <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3">
            <div className="mb-2 text-xs font-semibold uppercase text-blue-800">
              Admin: Manage Investments
            </div>
            <div className="mb-4 grid gap-2">
              {state.investments.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between gap-2 rounded-md border bg-white p-2 text-sm">
                  <span>{inv.name}</span>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditingInv(inv);
                        setInvName(inv.name);
                        setInvDesc(inv.description);
                        setInvCap(inv.capitalDeployed.toString());
                      }}>Edit</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Investment</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={submitInvestment} className="grid gap-2">
                        <input placeholder="Name" value={invName} onChange={(e) => setInvName(e.target.value)} className="rounded-md border p-2" />
                        <input placeholder="Description" value={invDesc} onChange={(e) => setInvDesc(e.target.value)} className="rounded-md border p-2" />
                        <input type="number" placeholder="Capital Deployed" value={invCap} onChange={(e) => setInvCap(e.target.value)} className="rounded-md border p-2" />
                        <div className="text-sm font-semibold text-slate-700">Profit Entries:</div>
                        {editingInv?.profitEntries.map((p: any) => (
                          <div key={p.id} className="text-sm">{new Date(p.date).toLocaleDateString()}: {fmt(p.amount)}</div>
                        ))}
                        <input type="number" placeholder="New Profit Amount" value={invProfit} onChange={(e) => setInvProfit(e.target.value)} className="rounded-md border p-2" />
                        <Button type="button" onClick={() => {
                          const newEntry = { id: crypto.randomUUID(), amount: parseFloat(invProfit), date: new Date().toISOString() };
                          updateInvestment(editingInv.id, {
                            ...editingInv,
                            profitEntries: [...editingInv.profitEntries, newEntry]
                          });
                          setEditingInv({ ...editingInv, profitEntries: [...editingInv.profitEntries, newEntry] });
                          setInvProfit("");
                          toast.success("Added profit entry");
                        }}>Add Profit Entry</Button>
                        <Button type="submit">Update Investment</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
            <form onSubmit={submitInvestment} className="grid grid-cols-2 gap-2">
              <input placeholder="Name" value={invName} onChange={(e) => setInvName(e.target.value)} className="rounded-md border p-2 text-sm" />
              <input placeholder="Description" value={invDesc} onChange={(e) => setInvDesc(e.target.value)} className="rounded-md border p-2 text-sm" />
              <input type="number" placeholder="Capital Deployed" value={invCap} onChange={(e) => setInvCap(e.target.value)} className="rounded-md border p-2 text-sm" />
              <Button type="submit" className="col-span-2 w-full">Add Investment</Button>
            </form>
          </div>
        </Card>
      )}


      {/* ── Administrative Fund Card (Admin-only, hidden from public) ── */}
      {a.role === "admin" && (() => {
        const activeMembers = state.members.filter(m => ((m as any).status !== 'deleted') && (m.role !== 'admin'));
        const activeMemberCount = activeMembers.length;
        const registrationFund = activeMemberCount * REG_FEE;
        const adminExpenses = state.expenses.filter(e => e.source === 'admin_fund');
        const totalAdminExpenses = adminExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
        const netAdminBalance = registrationFund - totalAdminExpenses;

        const handleAdminExpenseSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!adminExpenseForm.description || !adminExpenseForm.amount) {
            toast.error("Please fill in all required fields");
            return;
          }
          setAdminExpenseUploading(true);
          let receiptUrl = "";
          if (adminExpenseReceiptFile) {
            try {
              const fd = new FormData();
              fd.append("receipt", adminExpenseReceiptFile);
              const res = await fetch("/api/expenses.php", { method: "POST", body: fd });
              const data = await res.json();
              if (data.success) receiptUrl = data.url;
            } catch (err) { console.error("Receipt upload failed:", err); }
          }
          addAdminExpense({
            description: adminExpenseForm.description,
            amount: parseFloat(adminExpenseForm.amount),
            category: adminExpenseForm.category,
            notes: adminExpenseForm.notes,
            date: adminExpenseForm.date,
            receiptPhoto: receiptUrl,
          });
          setAdminExpenseForm({ description: "", amount: "", category: "Administrative", notes: "", date: new Date().toISOString().slice(0, 10) });
          setAdminExpenseReceiptFile(null);
          setAdminExpenseUploading(false);
          setAdminExpenseOpen(false);
          toast.success("Administrative expense recorded");
        };

        return (
          <Card className="p-5 mb-6 mt-6 border-purple-200 bg-purple-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-purple-700" />
                <div className="text-sm font-bold uppercase tracking-wide text-purple-800">
                  Administrative Fund & Expense Management
                  <span className="ml-2 text-xs font-normal text-purple-600 normal-case">(Admin-only · Private)</span>
                </div>
              </div>
              <Button size="sm" className="bg-purple-700 hover:bg-purple-800 text-white flex gap-1.5 items-center" onClick={() => setAdminExpenseOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Add Admin Expense
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg border border-purple-200 bg-white p-3 text-center">
                <div className="text-xs text-purple-600 uppercase tracking-wide mb-1 font-semibold">Total Registration Fund Collected</div>
                <div className="text-xl font-bold text-purple-800">{fmt(registrationFund)}</div>
                <div className="text-xs text-slate-500 mt-0.5">{activeMemberCount} active members × ₹{REG_FEE}</div>
              </div>
              <div className="rounded-lg border border-purple-200 bg-white p-3 text-center">
                <div className="text-xs text-purple-600 uppercase tracking-wide mb-1 font-semibold">Total Admin Expenses</div>
                <div className="text-xl font-bold text-red-700">{fmt(totalAdminExpenses)}</div>
                <div className="text-xs text-slate-500 mt-0.5">{adminExpenses.length} expense{adminExpenses.length !== 1 ? 's' : ''} logged</div>
              </div>
              <div className="rounded-lg border border-purple-200 bg-white p-3 text-center">
                <div className="text-xs text-purple-600 uppercase tracking-wide mb-1 font-semibold">Available Administrative Balance</div>
                <div className={`text-xl font-bold ${netAdminBalance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{fmt(netAdminBalance)}</div>
                <div className="text-xs text-slate-500 mt-0.5">Registration fund − admin expenses</div>
              </div>
            </div>
            {adminExpenses.length > 0 && (
              <div className="mt-2">
                <div className="text-xs font-semibold text-purple-800 mb-2">Admin Expense History</div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Added By</TableHead>
                      <TableHead>Receipt</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((exp) => (
                      <TableRow key={exp.id}>
                        <TableCell>{exp.description}</TableCell>
                        <TableCell>{exp.category}</TableCell>
                        <TableCell>{fmtDate(exp.date)}</TableCell>
                        <TableCell>{exp.addedBy}</TableCell>
                        <TableCell>
                          {exp.receiptPhoto ? (
                            <a href={exp.receiptPhoto} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                              <Receipt className="h-3 w-3" /> View
                            </a>
                          ) : <span className="text-xs text-slate-400">None</span>}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-red-700">{fmt(exp.amount)}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="destructive" onClick={() => { deleteExpense(exp.id); toast.success("Admin expense deleted"); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <Dialog open={adminExpenseOpen} onOpenChange={setAdminExpenseOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-purple-800">
                    <ShieldCheck className="h-5 w-5" /> Add Administrative Expense
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAdminExpenseSubmit} className="grid gap-3">
                  <div>
                    <Label>Description / Title</Label>
                    <Input value={adminExpenseForm.description} onChange={e => setAdminExpenseForm({ ...adminExpenseForm, description: e.target.value })} placeholder="e.g., Print materials, Meeting hall booking" required />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Category</Label>
                      <select value={adminExpenseForm.category} onChange={e => setAdminExpenseForm({ ...adminExpenseForm, category: e.target.value })} className="w-full border rounded p-2 text-sm">
                        <option value="Administrative">Administrative</option>
                        <option value="Stationery">Stationery</option>
                        <option value="Communication">Communication</option>
                        <option value="Event">Event</option>
                        <option value="Travel">Travel</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <Label>Amount (₹)</Label>
                      <Input type="number" min="0" step="0.01" value={adminExpenseForm.amount} onChange={e => setAdminExpenseForm({ ...adminExpenseForm, amount: e.target.value })} placeholder="0" required />
                    </div>
                  </div>
                  <div>
                    <Label>Expense Date</Label>
                    <Input type="date" value={adminExpenseForm.date} onChange={e => setAdminExpenseForm({ ...adminExpenseForm, date: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Notes (Optional)</Label>
                    <Input value={adminExpenseForm.notes} onChange={e => setAdminExpenseForm({ ...adminExpenseForm, notes: e.target.value })} placeholder="Additional details..." />
                  </div>
                  <div>
                    <Label>Receipt / Invoice / Bill Photo (Optional)</Label>
                    <input type="file" accept="image/*,application/pdf" className="w-full border rounded p-2 text-sm" onChange={e => setAdminExpenseReceiptFile(e.target.files?.[0] ?? null)} />
                    {adminExpenseReceiptFile && <div className="text-xs text-slate-500 mt-1">{adminExpenseReceiptFile.name}</div>}
                  </div>
                  <Button type="submit" className="bg-purple-700 hover:bg-purple-800" disabled={adminExpenseUploading}>
                    {adminExpenseUploading ? "Uploading..." : "Record Admin Expense"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </Card>
        );
      })()}

      <div className="mt-6">
        <PublicAnalytics />
      </div>

    </AppShell>
  );
}
