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
import { useState, useMemo } from "react";
import { PrintableReport } from "./PrintableReport";
import { Trash2 } from "lucide-react";

export function AdminDashboard() {
  const {
    state,
    currentAdmin,
    logPayment,
    addInvestment,
    updateInvestment,
    approvePayment,
    memberMonthlyPaid,
    renameMember,
    updateMember,
    reassignMemberToCollector,
    updateAdmin,
    memberProfitShare,
    memberActiveInvestedCapital,
    addCollector,
    removeCollector,
    removeMember,
    addExpense,
    deleteExpense,
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
   const [memberForm, setMemberForm] = useState({ name: "", mobile: "", whatsapp: "", password: "", collectorName: "", nomineeName: "", nomineeAddress: "", nomineeContact: "" });
   const [editingCollector, setEditingCollector] = useState<any>(null);
   const [collectorForm, setCollectorForm] = useState({ name: "", mobile: "", whatsapp: "" });
   const [memberToRemove, setMemberToRemove] = useState<any>(null);
   const [expensesOpen, setExpensesOpen] = useState(false);
   const [expenseForm, setExpenseForm] = useState({ description: "", amount: "", category: "Operations", notes: "" });

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

  const allMembers = state.members;

  const pendingApprovals = useMemo(() => {
    if (a?.role !== "admin" && a?.role !== "collector") return [];
    if (a.role === 'admin') return state.transactions.filter(t => !t.approved && (t.status === 'held_by_admin' || t.status === 'held_by_collector'));
    // For collectors, match by adminId OR by collector name matching members they're assigned to
    return state.transactions.filter(t => {
      if (t.approved || t.status !== 'held_by_collector') return false;
      const member = state.members.find(m => m.id === t.memberId);
      return t.adminId === a.id || (member?.collectorName && member.collectorName.trim().toLowerCase() === a.name.trim().toLowerCase());
    });
  }, [state.transactions, a, state.members]);
  
  const collectedByMember = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of state.transactions.filter(t => !t.approved)) {
      map.set(t.memberId, (map.get(t.memberId) ?? 0) + t.amount);
    }
    return map;
  }, [state.transactions]);
    
  const recentReceipts = useMemo(() => state.transactions
    .filter((t) => t.adminId === a?.id || (a?.role === 'admin'))
    .sort((x, y) => (x.paidAt < y.paidAt ? 1 : -1))
    .slice(0, 15), [state.transactions, a]);

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
             nomineeAddress: memberForm.nomineeAddress,
             nomineeContact: memberForm.nomineeContact,
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
  }

  const MemberTable = ({ members, title }: { members: any[], title: string }) => (
    <Card className="p-5 mb-6 mt-6">
        <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">{title}</h2>
        </div>
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Collector</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Password</TableHead>
                <TableHead>Actions</TableHead>
                <TableHead className="text-right">Held</TableHead>
                <TableHead className="text-right">Invested</TableHead>
                <TableHead className="text-right">Profit Earned</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {members.map((m) => {
                const isPaid = memberMonthlyPaid(m.id, mkInput);
                return (
                <TableRow key={m.id}>
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
                                        </div>
                                    </div>
                                    {m.nomineeName && (
                                        <div className="border-t pt-4">
                                            <h4 className="font-semibold text-slate-900 mb-2">Nominee Information</h4>
                                            <div className="space-y-1 text-sm">
                                                <p><span className="font-medium text-slate-700">Name:</span> <span className="text-slate-600">{m.nomineeName}</span></p>
                                                <p><span className="font-medium text-slate-700">Address:</span> <span className="text-slate-600">{m.nomineeAddress}</span></p>
                                                <p><span className="font-medium text-slate-700">Contact:</span> <span className="text-slate-600">{m.nomineeContact}</span></p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </TableCell>
                    <TableCell>{m.collectorName || '—'}</TableCell>
                    <TableCell className="font-mono text-xs">{m.memberId}</TableCell>
                    <TableCell className="font-mono text-xs">{m.mobile}</TableCell>
                    <TableCell className="font-mono text-xs">{m.whatsapp}</TableCell>
                    <TableCell className="font-mono text-xs">{m.password}</TableCell>
                    <TableCell>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => {
                                 setEditingMember(m);
                                 setMemberForm({ 
                                     name: m.name, 
                                     mobile: m.mobile, 
                                     whatsapp: m.whatsapp, 
                                     password: m.password,
                                     collectorName: m.collectorName || "",
                                     nomineeName: m.nomineeName || "",
                                     nomineeAddress: m.nomineeAddress || "",
                                     nomineeContact: m.nomineeContact || ""
                                 });
                            }}>Edit</Button>
                            {a.role === 'admin' && (
                                <Button variant="destructive" size="sm" onClick={() => setMemberToRemove(m)}>Remove</Button>
                            )}
                        </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                        {fmt(state.transactions.filter(t => t.memberId === m.id && t.approved === true).reduce((sum, t) => sum + t.amount, 0))}
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
        </Table>
    </Card>
  );

  return (
    <AppShell
      title={`${a.name} · ${a.role === 'admin' ? 'Admin' : 'Collector'} Console`}
      subtitle={a.role === 'admin' ? "Log received payments, review your ledger, and transfer to the Core Treasurer." : "Log received payments, review your ledger, and transfer to the Admin."}
    >
      {(a.role === "admin" || a.role === "collector") && (
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
                              {a.role === 'collector' && <TableHead>Action</TableHead>}
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
                                  <TableCell>{c?.name ? `${c.name} (Collector)` : "—"}</TableCell>
                                   <TableCell>
                                {a.role === 'collector' && editingTx === t.id ? (
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
                              {a.role === 'collector' && (
                                <TableCell>
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
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setEditingTx(t.id);
                                        setEditAmount(t.amount.toString());
                                      }}
                                    >
                                      Approve
                                    </Button>
                                  )}
                                </TableCell>
                              )}
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

      {a.role === 'admin' && (
        <Card className="p-5 mb-6">
          <div className="mb-4 text-xs font-semibold uppercase text-blue-800">Admin: Manage Collectors</div>
          <div className="mb-4">
            <Label>Promote Member to Collector</Label>
            <select
                className="w-full rounded-md border p-2"
                onChange={(e) => {
                    const memberId = e.target.value;
                    if (memberId) {
                        const m = state.members.find(x => x.id === memberId);
                        const alreadyCollector = state.admins.find(a => a.name === m?.name && a.role === 'collector');
                        if (m) {
                            if (alreadyCollector) {
                                toast.error(`${m.name} is already a collector`);
                            } else {
                                addCollector({ name: m.name, mobile: m.mobile, whatsapp: m.whatsapp });
                                toast.success(`Promoted ${m.name} to collector`);
                            }
                        }
                        e.target.value = '';
                    }
                }}
            >
                <option value="">Select a member to promote...</option>
                {state.members.filter(m => !state.admins.some(a => a.name === m.name && a.role === 'collector')).map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                ))}
            </select>
          </div>
         
         <div className="flex flex-wrap gap-2">
           {state.admins.filter(admin => admin.role === 'collector').map(c => (
             <div key={c.id} className="flex gap-1">
                 <Button variant="secondary">{c.name}</Button>
                 <Button variant="destructive" size="sm" onClick={() => removeCollector(c.id)}>×</Button>
             </div>
           ))}
         </div>
       </Card>
       )}

      {a.role === 'admin' && (
        <div className="mb-4">
            <Button onClick={() => window.print()}>Print Member Report</Button>
            <PrintableReport state={state} />
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
                    <Input value={memberForm.name} onChange={e => setMemberForm({...memberForm, name: e.target.value})} placeholder="Full name" />
                </div>
                <div className="space-y-2">
                    <Label>Mobile</Label>
                    <Input value={memberForm.mobile} onChange={e => setMemberForm({...memberForm, mobile: e.target.value})} placeholder="Mobile number" />
                </div>
                <div className="space-y-2">
                    <Label>WhatsApp</Label>
                    <Input value={memberForm.whatsapp} onChange={e => setMemberForm({...memberForm, whatsapp: e.target.value})} placeholder="WhatsApp number" />
                </div>
                <div className="space-y-2">
                    <Label>Password</Label>
                    <Input value={memberForm.password} onChange={e => setMemberForm({...memberForm, password: e.target.value})} placeholder="Password" />
                </div>
                <div className="space-y-2">
                    <Label>Collector</Label>
                    <select value={memberForm.collectorName} onChange={e => setMemberForm({...memberForm, collectorName: e.target.value})} className="w-full rounded-md border p-2">
                        <option value="">Select a Collector</option>
                        {state.admins.filter(a => a.role === 'collector').map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div className="border-t pt-4 mt-4">
                    <Label className="font-semibold mb-3 block">Nominee Information</Label>
                    <div className="space-y-2">
                        <Label htmlFor="nomineeName">Nominee Name</Label>
                        <Input id="nomineeName" value={memberForm.nomineeName} onChange={e => setMemberForm({...memberForm, nomineeName: e.target.value})} placeholder="Full name" />
                    </div>
                    <div className="space-y-2 mt-3">
                        <Label htmlFor="nomineeAddress">Nominee Address</Label>
                        <Input id="nomineeAddress" value={memberForm.nomineeAddress} onChange={e => setMemberForm({...memberForm, nomineeAddress: e.target.value})} placeholder="Address" />
                    </div>
                    <div className="space-y-2 mt-3">
                        <Label htmlFor="nomineeContact">Nominee Contact</Label>
                        <Input id="nomineeContact" value={memberForm.nomineeContact} onChange={e => setMemberForm({...memberForm, nomineeContact: e.target.value})} placeholder="Contact number" />
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
                    <Input value={collectorForm.name} onChange={e => setCollectorForm({...collectorForm, name: e.target.value})} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Mobile</Label>
                    <Input value={collectorForm.mobile} onChange={e => setCollectorForm({...collectorForm, mobile: e.target.value})} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">WhatsApp</Label>
                    <Input value={collectorForm.whatsapp} onChange={e => setCollectorForm({...collectorForm, whatsapp: e.target.value})} className="col-span-3" />
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


      {a.role === 'admin' && (() => {
          const allCollectors = state.admins.filter(admin => admin.role === 'collector');
          const grandTotal = allCollectors.reduce((sum, collector) => {
              const collectorMembers = state.members.filter(m => m.collectorName && m.collectorName.trim().toLowerCase() === collector.name.trim().toLowerCase());
              const collectorTotal = collectorMembers.reduce((acc, m) => acc + (collectedByMember.get(m.id) ?? 0), 0);
              return sum + collectorTotal;
          }, 0);
          
          return (
              <>
                  {allCollectors.map(collector => {
                      const collectorMembers = state.members.filter(m => m.collectorName && m.collectorName.trim().toLowerCase() === collector.name.trim().toLowerCase());
                      const collectorTotal = collectorMembers.reduce((sum, m) => sum + (collectedByMember.get(m.id) ?? 0), 0);
                      const collectorId = state.admins.find(ad => ad.name === collector.name)?.id;
                      const collectorTransactions = state.transactions.filter(t => {
                          if (t.approved || t.status !== 'held_by_collector') return false;
                          const member = state.members.find(m => m.id === t.memberId);
                          return t.adminId === collectorId || (member?.collectorName && member.collectorName.trim().toLowerCase() === collector.name.trim().toLowerCase());
                      });
                      
                      return (
                          <div key={collector.id} className="mb-6 border rounded-lg p-4">
                              <div className="flex justify-between items-center mb-4">
                                  <h3 className="font-bold text-lg">{collector.name}</h3>
                                  <div className="flex items-center gap-3">
                                      <div className="font-bold text-emerald-700">Total: {fmt(collectorTotal)}</div>
                                      {collectorTransactions.length > 0 && (
                                          <Button
                                              size="sm"
                                              className="bg-emerald-600 hover:bg-emerald-700"
                                              onClick={() => {
                                                  collectorTransactions.forEach(t => {
                                                      approvePayment(t.id);
                                                  });
                                                  toast.success(`Approved all payments for ${collector.name}`);
                                              }}
                                          >
                                              Approve All
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
                                          <TableHead className="text-right">Held</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {collectorMembers.map(m => {
                                          const memberTransactions = state.transactions.filter(t => t.memberId === m.id && !t.approved);
                                          const months = [...new Set(memberTransactions.map(t => t.monthKey || 'N/A'))].map(mk => fmtMonthKey(mk)).join(', ');
                                          return (
                                              <TableRow key={m.id}>
                                                  <TableCell>{m.name}</TableCell>
                                                  <TableCell className="font-mono text-xs">{m.memberId}</TableCell>
                                                  <TableCell>{m.mobile}</TableCell>
                                                  <TableCell className="text-sm text-slate-600">{months || '—'}</TableCell>
                                                  <TableCell className="text-right">{fmt(collectedByMember.get(m.id) ?? 0)}</TableCell>
                                              </TableRow>
                                          );
                                      })}
                                  </TableBody>
                              </Table>
                              {(() => {
                                  const collectorId = state.admins.find(ad => ad.name === collector.name)?.id;
                                  const collectorAdminApprovals = state.transactions.filter(t => {
                                      if (t.approved || t.status !== 'held_by_admin') return false;
                                      const member = state.members.find(m => m.id === t.memberId);
                                      return t.adminId === collectorId || (member?.collectorName && member.collectorName.trim().toLowerCase() === collector.name.trim().toLowerCase());
                                  });
                                  return collectorAdminApprovals.length > 0 ? (
                                      <div className="mt-4 text-right">
                                          <Button
                                              size="sm"
                                              className="bg-emerald-600 hover:bg-emerald-700"
                                              onClick={() => {
                                                  collectorAdminApprovals.forEach(t => {
                                                      approvePayment(t.id);
                                                  });
                                                  toast.success(`Approved all payments for ${collector.name}`);
                                              }}
                                          >
                                              Approve All
                                          </Button>
                                      </div>
                                  ) : null;
                              })()}
                          </div>
                      );
                  })}
                  <Card className="p-4 mb-6 bg-emerald-50 border-2 border-emerald-200">
                      <div className="flex justify-between items-center">
                          <h3 className="font-bold text-lg text-emerald-900">All Collectors Total</h3>
                          <div className="font-bold text-2xl text-emerald-700">{fmt(grandTotal)}</div>
                      </div>
                  </Card>
              </>
          );
      })()}


      {a.role === "admin" && (
        <Card className="p-5 mb-6">
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
                    Total Expenses: {fmt(state.expenses.reduce((sum, e) => sum + e.amount, 0))}
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
                  onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                  placeholder="e.g., Office supplies, Event venue, etc."
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Category</Label>
                    <select 
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
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
                    <Label>Amount (QR)</Label>
                    <Input 
                      type="number"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                      placeholder="0"
                      required
                    />
                  </div>
                </div>
                <Label>Notes (Optional)</Label>
                <Input 
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({...expenseForm, notes: e.target.value})}
                  placeholder="Additional details..."
                />
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700">Add Expense</Button>
              </form>
            </div>
            </div>
        </Card>
      )}

      {a.role === "admin" && (
        <Card className="p-5 mb-6">
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
                                        setEditingInv({...editingInv, profitEntries: [...editingInv.profitEntries, newEntry]});
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

       <div className="grid gap-6 lg:grid-cols-2">
         <Card className="p-5">
           <h2 className="mb-3 font-semibold text-slate-900">Recent Receipts</h2>
           <div className="overflow-x-auto">
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Receipt</TableHead>
                   <TableHead>Member</TableHead>
                   <TableHead>Date</TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead className="text-right">Amount</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {recentReceipts.map((t: any) => {
                   const m = state.members.find((x) => x.id === t.memberId);
                   const statusLabel = t.status === 'held_by_collector' 
                     ? `Held by Collector` 
                     : t.status === 'held_by_admin' ? 'Held by Admin' : 'Confirmed';
                   return (
                     <TableRow key={t.id}>
                       <TableCell className="font-mono text-xs">
                         {t.receiptNo}
                       </TableCell>
                       <TableCell>{m?.name ?? "—"}</TableCell>
                       <TableCell>{fmtDate(t.paidAt)}</TableCell>
                       <TableCell>
                         <Badge variant={t.status === 'held_by_collector' ? 'secondary' : 'default'}>
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

       <div className="mt-6">
         <PublicAnalytics />
       </div>
     </AppShell>
  );
}
