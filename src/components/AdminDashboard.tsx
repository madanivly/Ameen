import { useAppState, monthKey } from "@/context/AppStateContext";
import { AppShell } from "./AppShell";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { fmt, fmtDate, fmtMonthKey } from "@/lib/format";
import { toast } from "sonner";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PrintableReport } from "./PrintableReport";
import { MemberProfilePrint } from "./MemberProfilePrint";
import { Trash2, MessageCircle, Printer, Download, FileSpreadsheet } from "lucide-react";
import { RoleSwitcher } from "./RoleSwitcher";
import html2pdf from "html2pdf.js";
import * as XLSX from "xlsx";

export function AdminDashboard() {
  const {
    state,
    currentAdmin,
    logPayment,
    addInvestment,
    updateInvestment,
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
    refreshData,
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
  const [newAdminPassword, setNewAdminPassword] = useState("");

  // Track which member's profile we want to print
  const [printingMember, setPrintingMember] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

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

  const recentReceipts = useMemo(() => state.transactions
    .filter((t) => t.adminId === a?.id || (a?.role === 'admin'))
    .sort((x, y) => (x.paidAt < y.paidAt ? 1 : -1))
    .slice(0, 15), [state.transactions, a]);

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
      `Login link: https://grt.madanimedia.com/\n\n` +
      `For assistance, contact your collector or Convenor\n\n` +
      `— GRT Portal`
    );
    window.open(`https://wa.me/${wa}?text=${text}`, '_blank');
  };

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
  const exportMembersToExcel = (membersToExport: any[], reportTitle = "Members_Report") => {
    try {
      const data = membersToExport.map((m, idx) => {
        const isCol = m.isCollector || m.role === 'collector' || state.admins.some(adm => adm.role === 'collector' && (adm.id === m.id || (adm.name && m.name && adm.name.trim().toLowerCase() === m.name.trim().toLowerCase())));
        const heldAmount = state.transactions
          .filter(t => (t.memberId === m.id || t.memberId === m.memberId) && (t.approved === true || t.status === "completed"))
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        const activeInvested = memberActiveInvestedCapital(m.id);
        const profitEarned = memberProfitShare(m.id);

        return {
          "S.No": idx + 1,
          "Member Name": m.name,
          "Member ID": m.memberId,
          "Role/Status": isCol ? "Collector" : "Member",
          "Assigned Collector": m.collectorName || "Unassigned",
          "Mobile": m.mobile || "",
          "WhatsApp": m.whatsapp || "",
          "Shares": m.shares || 1,
          "Monthly Obligation": (m.shares || 1) * 100,
          "Password": m.password || "",
          "Nominee Name": m.nomineeName || "",
          "Nominee Relation": m.nomineeRelation || "",
          "Nominee Address": m.nomineeAddress || "",
          "Nominee Contact": m.nomineeContact || "",
          "Total Contributions": heldAmount,
          "Invested Capital": activeInvested,
          "Profit Share": profitEarned,
          "Joined Date": m.joinedAt ? fmtDate(m.joinedAt) : "",
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Members");

      // Auto-fit column widths
      const colWidths = Object.keys(data[0] || {}).map(key => ({
        wch: Math.max(key.length, ...data.map(row => String(row[key as keyof typeof row] || '').length)) + 2
      }));
      worksheet["!cols"] = colWidths;

      const fileName = `${reportTitle}_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast.success(`Exported ${membersToExport.length} members to Excel`);
    } catch (err) {
      console.error("Failed to export Excel:", err);
      toast.error("Failed to export Excel report. Please try again.");
    }
  };
  const exportAllDataToExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // 1. Members Sheet
      const membersData = state.members.map((m, idx) => {
        const isCol = m.isCollector || m.role === 'collector' || state.admins.some(adm => adm.role === 'collector' && (adm.id === m.id || (adm.name && m.name && adm.name.trim().toLowerCase() === m.name.trim().toLowerCase())));
        const heldAmount = state.transactions
          .filter(t => (t.memberId === m.id || t.memberId === m.memberId) && (t.approved === true || t.status === "completed"))
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        return {
          "S.No": idx + 1,
          "Member Name": m.name,
          "Member ID": m.memberId,
          "Role": isCol ? "Collector" : "Member",
          "Collector Assigned": m.collectorName || "",
          "Mobile": m.mobile || "",
          "WhatsApp": m.whatsapp || "",
          "Shares": m.shares || 1,
          "Password": m.password || "",
          "Nominee Name": m.nomineeName || "",
          "Nominee Contact": m.nomineeContact || "",
          "Total Contribution": heldAmount,
          "Invested Capital": memberActiveInvestedCapital(m.id),
          "Profit Earned": memberProfitShare(m.id),
        };
      });
      const membersSheet = XLSX.utils.json_to_sheet(membersData);
      XLSX.utils.book_append_sheet(workbook, membersSheet, "Members");

      // 2. Transactions Sheet
      const transactionsData = state.transactions.map((t, idx) => {
        const m = state.members.find(x => x.id === t.memberId);
        return {
          "S.No": idx + 1,
          "Receipt No": t.receiptNo || "",
          "Member Name": m?.name || "",
          "Member ID": m?.memberId || t.memberId || "",
          "Collector Name": t.collectorName || m?.collectorName || "",
          "Type": t.type,
          "Month Key": t.monthKey || "",
          "Amount": t.amount,
          "Status": t.status,
          "Approved": t.approved ? "Yes" : "No",
          "Date": t.paidAt ? new Date(t.paidAt).toLocaleString() : "",
        };
      });
      const txSheet = XLSX.utils.json_to_sheet(transactionsData);
      XLSX.utils.book_append_sheet(workbook, txSheet, "Transactions");

      // 3. Investments Sheet
      const investmentsData = state.investments.map((inv, idx) => ({
        "S.No": idx + 1,
        "Name": inv.name,
        "Description": inv.description || "",
        "Capital Deployed": inv.capitalDeployed,
        "Status": inv.status || "active",
        "Total Profit": (inv.profitEntries || []).reduce((acc, p) => acc + (Number(p.amount) || 0), 0),
      }));
      const invSheet = XLSX.utils.json_to_sheet(investmentsData);
      XLSX.utils.book_append_sheet(workbook, invSheet, "Investments");

      // 4. Expenses Sheet
      const expensesData = (state.expenses || []).map((exp, idx) => ({
        "S.No": idx + 1,
        "Description": exp.description,
        "Category": exp.category || "General",
        "Amount": exp.amount,
        "Added By": exp.addedBy || "",
        "Date": exp.date ? fmtDate(exp.date) : "",
        "Notes": exp.notes || "",
      }));
      const expSheet = XLSX.utils.json_to_sheet(expensesData);
      XLSX.utils.book_append_sheet(workbook, expSheet, "Expenses");

      const fileName = `GRT_Full_Database_Export_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast.success(`Full Admin Excel report downloaded successfully`);
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
                    <DialogContent className="max-h-[80vh] overflow-y-auto">
                      <DialogHeader><DialogTitle>Member Profile</DialogTitle></DialogHeader>
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          {m.profilePhoto ? <img src={m.profilePhoto} alt="Profile" className="w-20 h-20 rounded-full object-cover flex-shrink-0" /> : <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0">No Photo</div>}
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
          <h2 className="mb-3 font-semibold text-slate-900">Recent Receipts</h2>
          <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Collector</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentReceipts.map((t: any) => {
                  const m = state.members.find((x) => x.id === t.memberId);
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
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {a.role === "admin" && (
        <Card className="p-5 mb-6 mt-6">
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3">
            <div className="mb-2 text-xs font-semibold uppercase text-amber-800">
              Admin: Manage Official Expenses
            </div>
            <div className="space-y-3">
              {state.expenses.length > 0 && (
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
                      {state.expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((exp) => (
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
                    Total Expenses: {fmt(state.expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0))}
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

      <div className="mt-6">
        <PublicAnalytics />
      </div>

    </AppShell>
  );
}
