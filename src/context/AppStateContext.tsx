import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Admin,
  AppState,
  Investment,
  MemberInvestmentStake,
  Role,
  Transaction,
  TreasurerTransfer,
  User,
} from "@/types";

const STORAGE_KEY = "ameen-portal-state-v1";

export const FEES = { REG_FEE: 10, MONTHLY_FEE: 100 };

export const monthKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

const rid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 10)}`;

function seed(): AppState {
  const admins: Admin[] = [];

  const members: User[] = [];

  const investments: Investment[] = [];
  const stakes: MemberInvestmentStake[] = [];
  const transactions: Transaction[] = [];
  const transfers: TreasurerTransfer[] = [];

  return {
    currentUserId: null,
    currentRole: "member",
    members,
    admins,
    transactions,
    investments,
    stakes,
    transfers,
    pendingSignups: [],
  };
}

function load(): AppState {
  if (typeof window === "undefined") return seed();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const s = seed();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw) as AppState;
  } catch {
    return seed();
  }
}

interface AppStateContextValue {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  login: (name?: string, password?: string, mobile?: string, whatsapp?: string, collector?: string) => { ok: boolean; message: string };
  logout: () => void;
  setRole: (r: Role) => void;
  currentMember: () => User | null;
  currentAdmin: () => Admin | null;
  logPayment: (input: { memberId: string; adminId: string; type: "registration" | "monthly"; monthKey?: string; amount?: number; }) => Transaction;
  markTransferredToTreasurer: (adminId: string) => TreasurerTransfer | null;
  approvePayment: (transactionId: string, newAmount?: number) => void;
  rejectPayment: (transactionId: string) => void;
  promoteToAdmin: (memberId: string) => void;
  removeMember: (memberId: string) => void;
  transferMemberAccount: (fromId: string, toId: string) => void;
  renameMember: (memberId: string, newName: string) => void;
  updateMember: (memberId: string, updates: Partial<User>) => void;
  reassignMemberToCollector: (memberId: string, newCollector: Admin) => void;
  updateAdmin: (id: string, updates: Partial<Admin>) => void;
  addCollector: (collector: { name: string; mobile: string; whatsapp: string }) => void;
  removeCollector: (id: string) => void;
  addInvestment: (investment: { name: string; description: string; capitalDeployed: number; }) => void;
  updateInvestment: (id: string, investment: Investment) => void;
  missedMonthsCount: (memberId: string) => number;
  memberMonthlyPaid: (memberId: string, mk: string) => boolean;
  memberBalance: (memberId: string) => number;
  memberProfitShare: (memberId: string) => number;
  memberActiveInvestedCapital: (memberId: string) => number;
  totals: () => { totalCollected: number; totalActiveCapital: number; totalProfit: number; balance: number };
  resetSeed: () => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => load());

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo<AppStateContextValue>(() => {
    const currentMember = () => state.members.find((m) => m.id === state.currentUserId) ?? null;
    const currentAdmin = () => state.admins.find((a) => a.id === state.currentUserId) ?? null;

    const login = (name?: string, password?: string, mobile?: string, whatsapp?: string) => {
      const adminByName = state.admins.find((a) => a.name === name);
      if (adminByName) {
        setState((s) => ({ ...s, currentUserId: adminByName.id, currentRole: "admin" }));
        return { ok: true, message: "Logged in as admin." };
      }
      
      const member = state.members.find((m) => m.memberId === name || m.id === name);
      if (member) {
          if (member.password === password) {
            setState((s) => ({ ...s, currentUserId: member.id, currentRole: "member" }));
            return { ok: true, message: "Welcome back." };
          } else return { ok: false, message: "Incorrect password." };
      }
      
      const adminById = state.admins.find((a) => a.id === name);
      if (adminById && password === "admin123") {
        setState((s) => ({ ...s, currentUserId: adminById.id, currentRole: "admin" }));
        return { ok: true, message: "Logged in as admin." };
      }
      const maxId = state.members.reduce((max, m) => Math.max(max, parseInt(m.memberId)), 202600);
      const nextId = String(maxId + 1);
        const isFirstMember = state.members.length === 0;
      const newMember: User = {
        id: nextId,
        memberId: nextId,
        password: password || Math.random().toString().slice(2, 8),
        name: name?.trim() || "Member",
        mobile: mobile || "",
        whatsapp: whatsapp || "",
        collectorName: "",
        role: "member",
        adminId: "",
        registrationFeePaid: false,
        joinedAt: new Date().toISOString().slice(0, 10),
      };
      if (isFirstMember) {
        newMember.role = "admin";
        newMember.adminId = nextId;
        newMember.collectorName = name || "Member";
      }
      if (isFirstMember) {
        newMember.role = "admin";
        setState((s) => ({
          ...s,
          admins: [...s.admins, { id: newMember.id, name: newMember.name, role: "admin" }],
          members: [...s.members, newMember],
          currentUserId: newMember.id,
          currentRole: "admin",
        }));
      } else {
        setState((s) => ({
          ...s,
          members: [...s.members, newMember],
          currentUserId: newMember.id,
          currentRole: "member",
        }));
      }
      return { ok: true, message: `Account created${isFirstMember ? " as admin" : ""} — pending 10 QR registration fee approval.` };
    };

    const logout = () => setState((s) => ({ ...s, currentUserId: null, currentRole: "member" }));
    const setRole = (r: Role) => setState((s) => ({ ...s, currentRole: r }));

    const logPayment: AppStateContextValue["logPayment"] = ({ memberId, adminId, type, monthKey: mk, amount }) => {
      const now = new Date();
      const admin = state.admins.find(a => a.id === adminId);
      const isCollector = admin?.role === 'collector';
      const tx: Transaction = {
        id: rid("tx"),
        memberId,
        adminId,
        type,
        amount: amount ?? FEES.MONTHLY_FEE,
        monthKey: mk ?? monthKey(now),
        paidAt: now.toISOString(),
        receiptNo: `R-${mk ?? monthKey(now)}-${Date.now().toString().slice(-4)}`,
        status: isCollector ? "held_by_collector" : "held_by_admin",
        transferredToTreasurer: false,
      };
      
      // Persist to Google Sheets
      fetch('/api/update-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheet: 'Transactions', ...tx }),
      });

      setState((s) => ({ ...s, transactions: [...s.transactions, tx] }));
      return tx;
    };

    const approvePayment = (transactionId: string, newAmount?: number) => {
      setState((s) => ({
        ...s,
        transactions: s.transactions.map((t) => {
            if (t.id === transactionId) {
              const updated = { ...t, amount: newAmount ?? t.amount };
              if (updated.status === "held_by_collector") return { ...updated, status: "held_by_admin" };
              if (updated.status === "held_by_admin") return { ...updated, status: "confirmed", approved: true, transferredToTreasurer: true };
            }
          return t;
        }),
      }));
    };

    const rejectPayment = (transactionId: string) => {
      setState((s) => ({
        ...s,
        transactions: s.transactions.filter((t) => t.id !== transactionId),
      }));
    };

    const promoteToAdmin = (memberId: string) => {
      setState((s) => ({ ...s, members: s.members.map((m) => m.id === memberId ? { ...m, role: "admin" } : m) }));
    };

    const removeMember = (memberId: string) => {
      setState((s) => ({ ...s, members: s.members.filter((m) => m.id !== memberId) }));
    };

    const transferMemberAccount = (fromId: string, toId: string) => {
      setState((s) => {
        const fromM = s.members.find((m) => m.id === fromId);
        if (!fromM) return s;
        return {
          ...s,
          members: s.members.filter((m) => m.id !== fromId),
          transactions: s.transactions.map((t) => t.memberId === fromId ? { ...t, memberId: toId } : t),
          stakes: s.stakes.map((st) => st.memberId === fromId ? { ...st, memberId: toId } : st),
        };
      });
    };

    const renameMember = (memberId: string, newName: string) => {
      setState((s) => ({ ...s, members: s.members.map(m => m.id === memberId ? { ...m, name: newName } : m) }));
    };

    const updateMember = (memberId: string, updates: Partial<User>) => {
      setState((s) => ({ ...s, members: s.members.map(m => m.id === memberId ? { ...m, ...updates } : m) }));
    };

    const reassignMemberToCollector = (memberId: string, newCollector: Admin) => {
        setState((s) => ({
            ...s,
            members: s.members.map(m => m.id === memberId ? { ...m, collectorName: newCollector.name, adminId: newCollector.id } : m),
            transactions: s.transactions.map(t => t.memberId === memberId ? { ...t, adminId: newCollector.id } : t)
        }));
    };
    
    const updateAdmin = (id: string, updates: Partial<Admin>) => {
        setState((s) => ({ ...s, admins: s.admins.map(a => a.id === id ? { ...a, ...updates } : a) }));
    };

    const addInvestment = (investment: { name: string; description: string; capitalDeployed: number; }) => {
      setState((s) => {
        const invId = `inv_${Date.now()}`;
        const newInv: Investment = { id: invId, name: investment.name, description: investment.description, capitalDeployed: investment.capitalDeployed, profitEntries: [], status: "active" };
        const totalContributed = s.transactions.reduce((sum, t) => sum + t.amount, 0);
        const newStakes: MemberInvestmentStake[] = s.members.map(m => {
            const mContrib = s.transactions.filter(t => t.memberId === m.id).reduce((sum, t) => sum + t.amount, 0);
            return { memberId: m.id, investmentId: invId, sharePct: totalContributed > 0 ? (mContrib / totalContributed) * 100 : 0 };
        });
        return { ...s, investments: [...s.investments, newInv], stakes: [...s.stakes, ...newStakes] };
      });
    };

    const updateInvestment = (id: string, investment: Investment) => {
      setState((s) => ({ ...s, investments: s.investments.map(i => i.id === id ? { ...i, ...investment } : i) }));
    };

  const addCollector = (collector: { name: string; mobile: string; whatsapp: string }) => {
    setState((s) => ({ ...s, admins: [...s.admins, { id: `adm_${Date.now()}`, name: collector.name, role: "collector", mobile: collector.mobile, whatsapp: collector.whatsapp }] }));
  };

    const removeCollector = (id: string) => {
      setState((s) => ({ ...s, admins: s.admins.filter((a) => a.id !== id) }));
    };

    const markTransferredToTreasurer = (adminId: string) => {
      const pending = state.transactions.filter((t) => t.adminId === adminId && !t.transferredToTreasurer);
      if (pending.length === 0) return null;
      const batchId = `batch_${Date.now()}`;
      const amount = pending.reduce((s, t) => s + t.amount, 0);
      const transfer: TreasurerTransfer = { id: rid("tr"), adminId, amount, transferredAt: new Date().toISOString(), batchId, transactionIds: pending.map((t) => t.id) };
      setState((s) => ({
        ...s,
        transactions: s.transactions.map((t) => t.adminId === adminId && !t.transferredToTreasurer ? { ...t, transferredToTreasurer: true, transferBatchId: batchId } : t),
        transfers: [transfer, ...s.transfers],
      }));
      return transfer;
    };

    const memberMonthlyPaid = (memberId: string, mk: string) => state.transactions.some((t) => t.memberId === memberId && t.type === "monthly" && t.monthKey === mk);

    const missedMonthsCount = (memberId: string) => {
      const m = state.members.find((x) => x.id === memberId);
      if (!m) return 0;
      const start = new Date(m.joinedAt);
      const now = new Date();
      let missed = 0;
      const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 1);
      while (cursor < end) {
        const mk = monthKey(cursor);
        if (!memberMonthlyPaid(memberId, mk)) missed++;
        cursor.setMonth(cursor.getMonth() + 1);
      }
      return missed;
    };

    const memberBalance = (memberId: string) => state.transactions.filter((t) => t.memberId === memberId && t.type === "monthly").reduce((s, t) => s + t.amount, 0);

    const memberActiveInvestedCapital = (memberId: string) => state.stakes.filter((s) => s.memberId === memberId).reduce((sum, s) => {
          const inv = state.investments.find((i) => i.id === s.investmentId);
          if (!inv || inv.status !== "active") return sum;
          return sum + (inv.capitalDeployed * s.sharePct) / 100;
        }, 0);

    const memberProfitShare = (memberId: string) => state.stakes.filter((s) => s.memberId === memberId).reduce((sum, s) => {
          const inv = state.investments.find((i) => i.id === s.investmentId);
          if (!inv) return sum;
          const totalProfit = inv.profitEntries.reduce((p, e) => p + e.amount, 0);
          return sum + (totalProfit * s.sharePct) / 100;
        }, 0);

    const totals = () => {
      const totalCollected = state.transactions.filter(t => t.approved).reduce((s, t) => s + t.amount, 0);
      const totalActiveCapital = state.investments.filter((i) => i.status === "active").reduce((s, i) => s + i.capitalDeployed, 0);
      const totalProfit = state.investments.reduce((s, i) => s + i.profitEntries.reduce((p, e) => p + e.amount, 0), 0);
      return { totalCollected, totalActiveCapital, totalProfit, balance: totalCollected - totalActiveCapital };
    };

    const resetSeed = () => {
      if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
      setState(seed());
    };

    return {
      state,
      setState,
      login,
      logout,
      setRole,
      currentMember,
      currentAdmin,
      logPayment,
      markTransferredToTreasurer,
      promoteToAdmin,
      removeMember,
      transferMemberAccount,
      renameMember,
      updateMember,
      reassignMemberToCollector,
      updateAdmin,
      addInvestment,
      updateInvestment,
      addCollector,
      removeCollector,
      missedMonthsCount,
      memberMonthlyPaid,
      memberBalance,
      memberProfitShare,
      memberActiveInvestedCapital,
      totals,
      resetSeed,
      approvePayment,
      rejectPayment,
    };
  }, [state]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}
