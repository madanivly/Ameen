import { useState } from "react";
import { useAppState, monthKey } from "@/context/AppStateContext";
import { AppShell } from "./AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmt, fmtDate, fmtMonthKey } from "@/lib/format";
import { PublicAnalytics } from "./PublicAnalytics";
import { AlertTriangle, Lock, TrendingUp, Wallet, Briefcase } from "lucide-react";
import { toast } from "sonner";

export function MemberDashboard() {
   const {
     state,
     currentMember,
     memberBalance,
     memberProfitShare,
     memberActiveInvestedCapital,
     missedMonthsCount,
      memberMonthlyPaid,
      logPayment,
      reassignMemberToCollector,
      updateMember,
      refreshData,
    } = useAppState();

   const m = currentMember();
   if (!m) return null;

   const balance = memberBalance(m.id);
   const profit = memberProfitShare(m.id);
   const activeCapital = memberActiveInvestedCapital(m.id);
   const missed = missedMonthsCount(m.id);
   const delinquent = missed > 4;
   const admin = state.admins.find((a) => a.name === m.collectorName);
   const collectorName = admin?.name || "Not assigned";
   const collectorMobile = admin?.mobile || "Not provided";
   const collectorWhatsapp = admin?.whatsapp || "Not provided";
   const isCollector = m.role === "collector";

   const [isEditOpen, setIsEditOpen] = useState(false);
   const [isChooseCollectorOpen, setIsChooseCollectorOpen] = useState(false);
   const [selectedCollectorId, setSelectedCollectorId] = useState(admin?.id || "");
   const [name, setName] = useState(m.name);
   const [mobile, setMobile] = useState(m.mobile);
   const [whatsapp, setWhatsapp] = useState(m.whatsapp);
   const [nomineeName, setNomineeName] = useState(m.nomineeName || "");
   const [nomineeAddress, setNomineeAddress] = useState(m.nomineeAddress || "");
   const [nomineeContact, setNomineeContact] = useState(m.nomineeContact || "");

  
  // Allow regular members to log their own payments only if they have an assigned collector
  const canLogPayment = !!m.adminId && m.adminId !== "adm_ali"; // assuming adm_ali is the system treasurer and collector needs to be assigned

  const myTx = state.transactions
    .filter((t) => t.memberId === m.id)
    .sort((a, b) => (a.paidAt < b.paidAt ? 1 : -1));

  const myStakes = state.stakes.filter((s) => s.memberId === m.id);

   // Build 24-month range: 12 months past + 12 months future (starting from next month)
   const months: string[] = [];
   const cursor = new Date();
   cursor.setDate(1);
   // Go back 12 months from today
   for (let i = 0; i < 12; i++) {
     months.unshift(monthKey(cursor));
     cursor.setMonth(cursor.getMonth() - 1);
   }
   // Now go forward 12 months from next month
   cursor.setMonth(cursor.getMonth() + 13); // Move to next month (13 because we went back 12)
   for (let i = 0; i < 12; i++) {
     months.push(monthKey(cursor));
     cursor.setMonth(cursor.getMonth() + 1);
   }


  return (
      <AppShell
        title={`Welcome, ${m.name.split(" ")[0]}`}
        subtitle={`Assigned collector: ${collectorName} | Mobile: ${collectorMobile} | WhatsApp: ${collectorWhatsapp}`}
        actions={null}
      >
        <div className="mb-4">
            <Button variant="outline" onClick={refreshData}>Refresh Data</Button>
        </div>
        <Card className="mb-6 p-5">
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                  {m.profilePhoto ? <img src={m.profilePhoto} alt="Profile" className="w-20 h-20 rounded-full object-cover" /> : <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">No Photo</div>}
                  <div>
                      <h3 className="text-xl font-bold">{m.name}</h3>
                      <p className="text-slate-600 font-mono text-sm">ID: {m.memberId}</p>
                      <p className="text-slate-600">Mobile: {m.mobile}</p>
                      <p className="text-slate-600">WhatsApp: {m.whatsapp}</p>
                      {m.nomineeName && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <p className="text-xs font-semibold text-slate-700 uppercase">Nominee</p>
                          <p className="text-slate-600">Name: {m.nomineeName}</p>
                          <p className="text-slate-600">Address: {m.nomineeAddress}</p>
                          <p className="text-slate-600">Contact: {m.nomineeContact}</p>
                        </div>
                      )}
                  </div>
              </div>
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline">Edit Profile</Button>
                </DialogTrigger>
                <DialogContent className="max-h-[80vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Edit Profile</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                    <Label>Profile Photo</Label>
                    <Input type="file" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                const base64String = reader.result as string;
                                updateMember(m.id, { profilePhoto: base64String });
                            };
                            reader.readAsDataURL(file);
                        }
                    }} />
                    <Label>Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
                    <Label>Mobile</Label>
                    <Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="Mobile" />
                    <Label>WhatsApp</Label>
                    <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp" />
                    
                    <div className="border-t pt-4 mt-4">
                      <h3 className="font-semibold text-slate-900 mb-3">Nominee Information</h3>
                      <Label>Nominee Full Name</Label>
                      <Input value={nomineeName} onChange={(e) => setNomineeName(e.target.value)} placeholder="Nominee Name" />
                      <Label className="mt-3">Nominee Address</Label>
                      <Input value={nomineeAddress} onChange={(e) => setNomineeAddress(e.target.value)} placeholder="Nominee Address" />
                      <Label className="mt-3">Nominee Contact Number</Label>
                      <Input value={nomineeContact} onChange={(e) => setNomineeContact(e.target.value)} placeholder="+974..." />
                    </div>

                     <Button onClick={() => {
                         updateMember(m.id, { name, mobile, whatsapp, nomineeName, nomineeAddress, nomineeContact });
                         setIsEditOpen(false);
                         toast.success("Details updated.");
                     }}>Save Changes</Button>
                     </div>
                 </DialogContent>
                 </Dialog>
                 
                 <Dialog open={isChooseCollectorOpen} onOpenChange={setIsChooseCollectorOpen}>
                   <DialogTrigger asChild>
                       <Button variant="outline" className="ml-2">Choose Collector</Button>
                   </DialogTrigger>
                   <DialogContent>
                       <DialogHeader><DialogTitle>Select Your Collector</DialogTitle></DialogHeader>
                       <div className="space-y-3">
                         <Label>Available Collectors</Label>
                         <select 
                           value={selectedCollectorId} 
                           onChange={(e) => setSelectedCollectorId(e.target.value)}
                           className="w-full border rounded-md p-2"
                         >
                           <option value="">Select a collector...</option>
                           {state.admins.filter(a => a.role === 'collector').map(c => (
                             <option key={c.id} value={c.id}>{c.name}</option>
                           ))}
                         </select>
                         <Button onClick={() => {
                           if (!selectedCollectorId) {
                             toast.error("Please select a collector");
                             return;
                           }
                           const collector = state.admins.find(a => a.id === selectedCollectorId);
                           if (collector) {
                             reassignMemberToCollector(m.id, collector);
                             setIsChooseCollectorOpen(false);
                             toast.success(`Assigned to collector: ${collector.name}`);
                           }
                         }}>Confirm Selection</Button>
                       </div>
                   </DialogContent>
                 </Dialog>
           </div>
       </Card>
      {delinquent && (
        <Card className="mb-6 border-red-300 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
            <div>
              <div className="font-bold text-red-800">
                Subject to membership termination by committee review.
              </div>
              <div className="mt-1 text-sm text-red-700">
                You have {missed} missed monthly deposits. Please settle outstanding
                dues immediately.
              </div>
            </div>
          </div>
        </Card>
      )}

      {canLogPayment && (
      <Card className="p-5 mb-6">
        <h2 className="mb-3 font-semibold text-slate-900">
          {isCollector ? "My Registered Members · Log Payment" : "Log My Payment"}
        </h2>
        <form
          className="grid gap-3 sm:grid-cols-4 mb-6"
          onSubmit={(e) => {
            e.preventDefault();
            const memberId = (isCollector ? (document.getElementById("m-id") as HTMLSelectElement)?.value : m.id) ?? "";
            if (!memberId) return;
            const month = (document.getElementById("m-month") as HTMLInputElement).value;
            const amount = parseInt((document.getElementById("m-amount") as HTMLInputElement).value) || 0;
            
            if (state.transactions.some(t => t.memberId === memberId && t.monthKey === month && t.type === 'monthly')) {
                toast.error(`Payment for this month already exists.`);
                return;
            }

            logPayment({ memberId, adminId: m.adminId || "", type: 'monthly', monthKey: month, amount });
            toast.success(`Payment pending approval by collector.`);
          }}
        >
          {isCollector && (
            <div className="sm:col-span-2">
              <select id="m-id" className="w-full border rounded p-2">
                {state.members
                  .filter((mem) => mem.adminId === m.id || (mem.adminId && state.admins.find((a) => a.id === mem.adminId)?.name === m.name) || (m.name && mem.collectorName && mem.collectorName.trim().toLowerCase() === m.name.trim().toLowerCase()))
                  .map((mem) => (
                    <option key={mem.id} value={mem.id}>{mem.name} ({mem.collectorName || 'No Collector'})</option>
                  ))}
              </select>
            </div>
          )}
           <select id="m-month" defaultValue={monthKey(new Date())} className="w-full border rounded p-2">
             {months.map((mk) => (
               <option key={mk} value={mk}>
                 {fmtMonthKey(mk)}
               </option>
             ))}
           </select>
          <Input
            id="m-amount"
            required
            type="number"
            defaultValue="100"
          />
          <Button type="submit" className={isCollector ? "" : "sm:col-span-2"}>Submit Payment</Button>
        </form>
      </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          label="Total Contributed"
          value={fmt(balance)}
        />
        <StatCard
          icon={<Briefcase className="h-4 w-4" />}
          label="Active Invested Capital (yours)"
          value={fmt(activeCapital)}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Profit Share Earned"
          value={fmt(profit)}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">
              Monthly Contribution Tracker
            </h2>
            <div className="text-xs text-slate-500">Due by the 15th · 100</div>
          </div>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
            {months.map((mk) => {
              const paid = memberMonthlyPaid(m.id, mk);
              const [year, month] = mk.split('-');
              const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString(undefined, { month: 'short' });
              return (
                <div
                  key={mk}
                  className={`rounded-md border p-2 text-center text-xs transition-colors ${
                    paid
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-slate-50 text-slate-500"
                  }`}
                  title={fmtMonthKey(mk)}
                >
                  <div className="font-mono text-[10px] opacity-70">{monthName}</div>
                  <div className="font-mono text-[9px] opacity-60">{year.slice(2)}</div>
                  <div className="mt-0.5 font-semibold">{paid ? "✓" : "—"}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-xs text-slate-500">
            {missed} missed months since joining.
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 font-semibold text-slate-900">Your Business Stakes</h2>
          {myStakes.length === 0 && (
            <div className="text-sm text-slate-500">
              You have no active investment stakes yet.
            </div>
          )}
          <div className="space-y-3">
            {myStakes.map((s) => {
              const inv = state.investments.find((i) => i.id === s.investmentId);
              if (!inv) return null;
              return (
                <div
                  key={s.investmentId}
                  className="rounded-md border border-slate-200 p-3"
                >
                   <div className="flex items-center justify-between">
                    <div className="font-medium text-slate-900">{inv.name}</div>
                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                      {s.sharePct}%
                    </Badge>
                  </div>
                  <div className="text-xs text-emerald-700">
                    Investing in: {inv.name}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">{inv.description}</div>
                  <div className="mt-2 flex justify-between text-xs">
                    <span className="text-slate-500">
                      Your capital:{" "}
                      <span className="font-semibold text-slate-900">
                        {fmt((inv.capitalDeployed * s.sharePct) / 100)}
                      </span>
                    </span>
                    <span className="text-emerald-700">
                      Profit:{" "}
                      <span className="font-semibold">
                        {fmt((inv.profitEntries.reduce((p, e) => p + e.amount, 0) * s.sharePct) / 100)}
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <h2 className="mb-3 font-semibold text-slate-900">Your Payment History</h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt No.</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myTx.map((t) => {
                const c = state.admins.find(a => a.id === t.adminId);
                const statusLabel = t.status === 'held_by_collector' 
                  ? `Held by Collector (${m.collectorName || 'Unknown'})` 
                  : t.status === 'held_by_admin' ? 'Held by Admin' : 'Confirmed';
                
                return (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.receiptNo}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        t.type === "registration"
                          ? "border-amber-200 bg-amber-50 text-amber-800"
                          : "border-emerald-200 bg-emerald-50 text-emerald-800"
                      }
                    >
                      {t.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{t.monthKey ?? "—"}</TableCell>
                  <TableCell>{fmtDate(t.paidAt)}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {fmt(t.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.status === 'held_by_collector' ? 'secondary' : 'default'}>
                      {statusLabel}
                    </Badge>
                  </TableCell>
                </TableRow>
                );
              })}
              {myTx.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-slate-500">
                    No payments logged yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="mt-8">
        <PublicAnalytics />
      </div>
    </AppShell>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="border-slate-200 p-5 transition-shadow hover:shadow-md">
      <div className="flex items-center gap-2 text-emerald-700">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-2 text-3xl font-bold text-slate-900">{value}</div>
    </Card>
  );
}
