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
  Expense,
  Investment,
  MemberInvestmentStake,
  Role,
  Transaction,
  TreasurerTransfer,
  User,
} from "@/types";
import { useGoogleSheetSync } from "@/hooks/useGoogleSheetSync";

const STORAGE_KEY = "ameen-portal-state-v1";

export const REG_FEE = 10;
export const MONTHLY_FEE = 100;

export const monthKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

const rid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 10)}`;

function seed(): AppState {
   return {
     currentUserId: null,
     currentRole: "member",
     members: [],
     admins: [],
     transactions: [],
     investments: [],
     stakes: [],
     transfers: [],
     expenses: [],
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
  login: (name?: string, password?: string, mobile?: string, whatsapp?: string, collector?: string, nomineeName?: string, nomineeAddress?: string, nomineeContact?: string) => { ok: boolean; message: string };
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
  addExpense: (expense: { description: string; amount: number; category: string; notes?: string }) => void;
  deleteExpense: (expenseId: string) => void;
  addInvestment: (investment: { name: string; description: string; capitalDeployed: number; }) => void;
  updateInvestment: (id: string, investment: Investment) => void;
  missedMonthsCount: (memberId: string) => number;
  memberMonthlyPaid: (memberId: string, mk: string) => boolean;
  memberBalance: (memberId: string) => number;
  memberProfitShare: (memberId: string) => number;
  memberActiveInvestedCapital: (memberId: string) => number;
  totals: () => { totalCollected: number; totalActiveCapital: number; totalProfit: number; balance: number };
  resetSeed: () => void;
  triggerDataRefresh: () => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => load());

  // Persist state changes to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Set up real-time sync with Google Sheets using the enhanced sync hook
  const { manualRefresh } = useGoogleSheetSync({
    enabled: false, // Disabled automatic polling to stop constant refreshing
    pollInterval: 300000, // 300-second polling when active; uses ETags for bandwidth efficiency
    onDataUpdate: (syncedData) => {
      setState((prevState) => ({
        currentUserId: prevState.currentUserId,
        currentRole: prevState.currentRole,
        members: syncedData.members ?? prevState.members,
        admins: syncedData.admins ?? prevState.admins,
        transactions: syncedData.transactions ?? prevState.transactions,
        investments: syncedData.investments ?? prevState.investments,
        stakes: syncedData.stakes ?? prevState.stakes,
        transfers: syncedData.transfers ?? prevState.transfers,
        expenses: syncedData.expenses ?? prevState.expenses,
        pendingSignups: syncedData.pendingSignups ?? prevState.pendingSignups,
      }));
    },
    onError: (error) => {
      console.error("Failed to sync with Google Sheets:", error);
    },
  });

  const value = useMemo<AppStateContextValue>(() => {
    const currentMember = () => state.members.find((m) => m.id === state.currentUserId) ?? null;
    const currentAdmin = () => state.admins.find((a) => a.id === state.currentUserId) ?? null;

    const login = (name?: string, password?: string, mobile?: string, whatsapp?: string, collector?: string, nomineeName?: string, nomineeAddress?: string, nomineeContact?: string) => {
      // Sign-in mode: validate existing credentials
      if (!mobile && !whatsapp && !nomineeName) {
        // This is sign-in (no registration fields provided)
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
          } else {
            return { ok: false, message: "Incorrect password." };
          }
        }
        
        const adminById = state.admins.find((a) => a.id === name);
        if (adminById && password === "admin123") {
          setState((s) => ({ ...s, currentUserId: adminById.id, currentRole: "admin" }));
          return { ok: true, message: "Logged in as admin." };
        }
        
        return { ok: false, message: "Member ID or password is incorrect." };
      }
      
      // Sign-up mode: create new member
      const namePrefix = (name || "MEM").substring(0, 3).toUpperCase();
      const nextNumber = state.members.length + 1;
      const nextId = namePrefix + String(nextNumber).padStart(3, '0');
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
        nomineeName: nomineeName || "",
        nomineeAddress: nomineeAddress || "",
        nomineeContact: nomineeContact || "",
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
        fetch('/api/update-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sheet: 'Data', type: 'member', ...newMember }),
        }).then(async (res) => {
          if (res.ok) {
            triggerDataRefresh();
            setState((s) => ({
              ...s,
              members: [...s.members, newMember],
              currentUserId: newMember.id,
              currentRole: "member",
            }));
          }
        }).catch(err => console.error('Failed to persist new member:', err));
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
        amount: amount ?? MONTHLY_FEE,
        monthKey: mk ?? monthKey(now),
        paidAt: now.toISOString(),
        receiptNo: `R-${mk ?? monthKey(now)}-${Date.now().toString().slice(-4)}`,
        status: isCollector ? "held_by_collector" : "held_by_admin",
        transferredToTreasurer: false,
      };
      
      // Persist to Google Sheets with cache-busting headers
      const txData = {
        ...tx,
        type: 'transaction',
      };
      console.log('Persisting transaction to Google Sheets:', txData);
      fetch('/api/update-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        },
        body: JSON.stringify(txData),
      }).then(res => {
        console.log('Persistence response status:', res.status);
        return res.json().then(json => {
          console.log('Persistence response:', json);
          if (res.ok) {
            // Refresh will pick up changes via the sync hook's adaptive polling
          }
        });
      }).catch(err => console.error('Failed to persist transaction:', err));

      setState((s) => ({ ...s, transactions: [...s.transactions, tx] }));
      return tx;
    };

    const approvePayment = (transactionId: string, newAmount?: number) => {
      setState((s) => {
        const transaction = s.transactions.find(t => t.id === transactionId);
        if (!transaction) return s;
        
        const updatedTx = { ...transaction, amount: newAmount ?? transaction.amount };
        if (updatedTx.status === "held_by_collector") updatedTx.status = "held_by_admin";
        else if (updatedTx.status === "held_by_admin") {
          updatedTx.status = "confirmed";
          updatedTx.approved = true;
          updatedTx.transferredToTreasurer = true;
        }
        
        // Persist to Google Sheets
        fetch('/api/update-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
          body: JSON.stringify({ sheet: 'Data', ...updatedTx }),
        }).catch(err => console.error('Failed to update transaction:', err));
        
        return {
          ...s,
          members: s.members.map(m => 
            m.id === transaction.memberId && transaction.type === 'registration' 
              ? { ...m, registrationFeePaid: true } 
              : m
          ),
          transactions: s.transactions.map((t) => t.id === transactionId ? updatedTx : t),
        };
      });
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
      setState((s) => {
        const memberToRemove = s.members.find(m => m.id === memberId);
        if (!memberToRemove) return s;
        
        // Find and delete related admin/collector accounts from Google Sheets
        const relatedAdmins = s.admins.filter((a) => a.id === memberId || a.name === memberToRemove.name);
        relatedAdmins.forEach(admin => {
          fetch('/api/update-data', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            },
            body: JSON.stringify({ id: admin.id, name: admin.name }),
          }).catch(err => console.error('Failed to delete admin from sheet:', err));
        });

        // Also delete the member record from Google Sheets
        fetch('/api/update-data', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
          body: JSON.stringify({ id: memberId, name: memberToRemove.name }),
        }).catch(err => console.error('Failed to delete member from sheet:', err));

        // Remove the member and any related accounts (e.g., if they're also a collector)
        // Also remove all transactions and stakes associated with this member
        // If the deleted member is currently logged in, logout
        return {
          ...s,
          currentUserId: s.currentUserId === memberId ? null : s.currentUserId,
          currentRole: s.currentUserId === memberId ? "member" : s.currentRole,
          members: s.members.filter((m) => m.id !== memberId),
          admins: s.admins.filter((a) => a.id !== memberId && a.name !== memberToRemove.name),
          transactions: s.transactions.filter((t) => t.memberId !== memberId),
          stakes: s.stakes.filter((st) => st.memberId !== memberId),
        };
      });
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

    const addExpense = (expense: { description: string; amount: number; category: string; notes?: string }) => {
      const currentAdmin = state.admins.find(a => a.id === state.currentUserId);
      const newExpense: Expense = {
        id: rid("exp"),
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        date: new Date().toISOString(),
        addedBy: currentAdmin?.name || "Unknown",
        notes: expense.notes,
      };
      
      // Persist to Google Sheets immediately
      fetch('/api/update-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        },
        body: JSON.stringify({ sheet: 'Data', type: 'expense', ...newExpense }),
      }).catch(err => console.error('Failed to save expense to sheet:', err));
      
      setState((s) => ({ ...s, expenses: [...s.expenses, newExpense] }));
    };

    const deleteExpense = (expenseId: string) => {
      const expense = state.expenses.find(e => e.id === expenseId);
      
      // Remove from Google Sheets
      if (expense) {
        fetch('/api/update-data', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
          body: JSON.stringify({ id: expenseId }),
        }).catch(err => console.error('Failed to delete expense from sheet:', err));
      }
      
      setState((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== expenseId) }));
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

    const memberBalance = (memberId: string) => state.transactions.filter((t) => t.memberId === memberId && t.type === "monthly" && t.approved).reduce((s, t) => s + t.amount, 0);

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
      const totalCollected = state.transactions.filter(t => t.approved && t.type === 'monthly').reduce((s, t) => s + t.amount, 0);
      const totalActiveCapital = state.investments.filter((i) => i.status === "active").reduce((s, i) => s + i.capitalDeployed, 0);
      const totalProfit = state.investments.reduce((s, i) => s + i.profitEntries.reduce((p, e) => p + e.amount, 0), 0);
      return { totalCollected, totalActiveCapital, totalProfit, balance: totalCollected - totalActiveCapital };
    };

    const triggerDataRefresh = () => {
      manualRefresh();
    };

    const resetSeed = () => {
      if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
      setState(seed());
      
      // Clear all data from Google Sheets 'Data' sheet
      fetch('/api/update-data', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        },
        body: JSON.stringify({ action: 'clear_all' }),
      }).catch(err => console.error('Failed to clear Google Sheet data:', err));
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
      triggerDataRefresh,
      addExpense,
      deleteExpense,
    };
  }, [state]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}
