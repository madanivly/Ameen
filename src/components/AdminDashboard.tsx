import { useAppState, monthKey } from "@/context/AppStateContext";
import { AppShell } from "./AppShell";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PublicAnalytics } from "./PublicAnalytics";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmt, fmtDate } from "@/lib/format";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { PrintableReport } from "./PrintableReport";

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
  const [memberForm, setMemberForm] = useState({ name: "", mobile: "", whatsapp: "", password: "", collectorName: "" });
  const [editingCollector, setEditingCollector] = useState<any>(null);
  const [collectorForm, setCollectorForm] = useState({ name: "", mobile: "", whatsapp: "" });

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
    return state.transactions.filter(t => !t.approved && t.status === 'held_by_collector' && (t.adminId === a.id));
  }, [state.transactions, a]);
  
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
                {a.role !== 'admin' && <TableHead>Tokens</TableHead>}
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
                            <DialogContent>
                                <DialogHeader><DialogTitle>Member Profile</DialogTitle></DialogHeader>
                                <div className="flex items-center gap-4">
                                    {m.profilePhoto ? <img src={m.profilePhoto} alt="Profile" className="w-20 h-20 rounded-full object-cover" /> : <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">No Photo</div>}
                                    <div>
                                        <h3 className="text-xl font-bold">{m.name}</h3>
                                        <p className="text-slate-600">Mobile: {m.mobile}</p>
                                        <p className="text-slate-600">WhatsApp: {m.whatsapp}</p>
                                    </div>
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
                        <Button variant="ghost" size="sm" onClick={() => {
                            setEditingMember(m);
                            setMemberForm({ 
                                name: m.name, 
                                mobile: m.mobile, 
                                whatsapp: m.whatsapp, 
                                password: m.password,
                                collectorName: m.collectorName || ""
                            });
                        }}>Edit</Button>
                    </TableCell>
                    {a.role !== 'admin' && (
                        <TableCell>
                            <Button variant={isPaid ? "default" : "outline"} size="sm" onClick={() => {
                                if (!isPaid) {
                                    logPayment({ memberId: m.id, adminId: a.id, type: "monthly", monthKey: mkInput });
                                    toast.success(`Marked ${m.name} as paid for ${mkInput}`);
                                }
                            }}>
                                {isPaid ? "Paid" : "Mark as Collected"}
                            </Button>
                        </TableCell>
                    )}
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
      title={`${a.name} · Collector Console`}
      subtitle="Log received payments, review your ledger, and transfer to the Core Treasurer."
    >
      <PublicAnalytics />

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
        <DialogContent>
            <DialogHeader><DialogTitle>Edit Member Details</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Name</Label>
                    <Input value={memberForm.name} onChange={e => setMemberForm({...memberForm, name: e.target.value})} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Mobile</Label>
                    <Input value={memberForm.mobile} onChange={e => setMemberForm({...memberForm, mobile: e.target.value})} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">WhatsApp</Label>
                    <Input value={memberForm.whatsapp} onChange={e => setMemberForm({...memberForm, whatsapp: e.target.value})} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Password</Label>
                    <Input value={memberForm.password} onChange={e => setMemberForm({...memberForm, password: e.target.value})} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Collector</Label>
                    <select value={memberForm.collectorName} onChange={e => setMemberForm({...memberForm, collectorName: e.target.value})} className="col-span-3 rounded-md border p-2">
                        <option value="">Select a Collector</option>
                        {state.admins.filter(a => a.role === 'collector').map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <Button onClick={handleMemberUpdate}>Save Changes</Button>
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
                        if (m) {
                            addCollector({ name: m.name, mobile: m.mobile, whatsapp: m.whatsapp });
                            toast.success(`Promoted ${m.name} to collector`);
                        }
                    }
                }}
            >
                <option value="">Select a member to promote...</option>
                {state.members.map(m => (
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

      {a.role === 'admin' && state.admins.filter(admin => admin.role === 'collector').map(collector => {
          const collectorMembers = state.members.filter(m => m.collectorName && m.collectorName.trim().toLowerCase() === collector.name.trim().toLowerCase());
          const collectorTotal = collectorMembers.reduce((sum, m) => sum + (collectedByMember.get(m.id) ?? 0), 0);
          return (
              <div key={collector.id} className="mb-6 border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg">{collector.name}</h3>
                      <div className="font-bold text-emerald-700">Total: {fmt(collectorTotal)}</div>
                  </div>
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Member</TableHead>
                              <TableHead>ID</TableHead>
                              <TableHead>Mobile</TableHead>
                              <TableHead className="text-right">Held</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {collectorMembers.map(m => (
                              <TableRow key={m.id}>
                                  <TableCell>{m.name}</TableCell>
                                  <TableCell className="font-mono text-xs">{m.memberId}</TableCell>
                                  <TableCell>{m.mobile}</TableCell>
                                  <TableCell className="text-right">{fmt(collectedByMember.get(m.id) ?? 0)}</TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </div>
          )
      })}

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
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentReceipts.map((t: any) => {
                  const m = state.members.find((x) => x.id === t.memberId);
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs">
                        {t.receiptNo}
                      </TableCell>
                      <TableCell>{m?.name ?? "—"}</TableCell>
                      <TableCell>{fmtDate(t.paidAt)}</TableCell>
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

        {(a.role === "admin" || a.role === "collector") && (
        <Card className="p-5">
          <h2 className="mb-3 font-semibold text-slate-900">
            Pending Approvals
          </h2>
          {pendingApprovals.length > 0 ? (
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
                                  <TableCell>{c?.name ? `${c.name} (Collector)` : "—"}</TableCell>
                                  <TableCell>
                                {editingTx === t.id ? (
                                  <input 
                                    type="number" 
                                    className="w-20 rounded border p-1 text-sm" 
                                    value={editAmount} 
                                    onChange={(e) => setEditAmount(e.target.value)} 
                                  />
                                ) : fmt(t.amount)}
                              </TableCell>
                                  <TableCell>
                                  <Button size="sm" onClick={() => {
                                    if (editingTx === t.id) {
                                      approvePayment(t.id, parseFloat(editAmount));
                                      setEditingTx(null);
                                      if (t.status === 'held_by_admin') {
                                        toast.success(`Approved and Receipt ${t.receiptNo} Generated`);
                                      } else {
                                        toast.success("Approved to Admin");
                                      }
                                    } else {
                                      setEditingTx(t.id);
                                      setEditAmount(t.amount.toString());
                                    }
                                  }}>
                                    {editingTx === t.id ? 'Save & Approve' : 'Edit & Approve'}
                                  </Button>
                               </TableCell>
                           </TableRow>
                             )})}
                      </TableBody>
                  </Table>
          ) : <p className="text-sm text-slate-500">No pending approvals.</p>}
        </Card>
      )}
      </div>
    </AppShell>
  );
}
