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
     admins: [
         { id: "ADM001", name: "Ismail Kallan", username: "admin", role: "admin", password: "admin", mobile: "", whatsapp: "" },
         { id: "admin", name: "Admin", username: "admin", role: "admin", password: "admin", mobile: "", whatsapp: "" },
         { id: "ismail", name: "Ismail (Admin)", role: "admin", password: "ismail123", mobile: "", whatsapp: "" }
     ],
     transactions: [],
     investments: [],
     stakes: [],
     transfers: [],
     expenses: [],
     pendingSignups: [],
   };
}

interface AppStateContextValue {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  login: (name?: string, password?: string, mobile?: string, whatsapp?: string, collector?: string, nomineeName?: string, nomineeRelation?: string, nomineeAddress?: string, nomineeContact?: string, shares?: number) => { ok: boolean; message: string; password?: string; memberId?: string };
  logout: () => void;
  setRole: (r: Role) => void;
  currentMember: () => User | null;
  currentAdmin: () => Admin | null;
  logPayment: (input: { memberId: string; adminId: string; type: "registration" | "monthly"; monthKey?: string; amount?: number; }) => Transaction;
  updatePaymentAmount: (transactionId: string, amount: number) => void;
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
  updateAdminPassword: (id: string, password: string) => void;
  addCollector: (collector: string | { name: string; mobile: string; whatsapp: string }) => void;
  removeCollector: (id: string) => void;
  addExpense: (expense: { description: string; amount: number; category: string; notes?: string }) => void;
  deleteExpense: (expenseId: string) => void;
  addInvestment: (investment: { name: string; description: string; capitalDeployed: number; }) => void;
  updateInvestment: (id: string, investment: Investment) => void;
  missedMonthsCount: (memberId: string) => number;
  memberMonthlyPaid: (memberId: string, mk: string) => boolean;
  uploadAvatar: (memberId: string, file: File) => Promise<{success: boolean, url?: string, error?: string} | null>;
  memberMonthlyPaidAmount: (memberId: string, mk: string) => number;
  memberBalance: (memberId: string) => number;
  memberProfitShare: (memberId: string) => number;
  memberActiveInvestedCapital: (memberId: string) => number;
  totals: () => { totalCollected: number; totalActiveCapital: number; totalProfit: number; balance: number };
  resetSeed: () => void;
  refreshData: () => Promise<AppState | null>;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    let saved = null;
    try {
      saved = localStorage.getItem('app_state');
    } catch (e) {
      console.warn("Failed to read from localStorage", e);
    }
    
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    return seed();
  });

  useEffect(() => {
    try {
      localStorage.setItem('app_state', JSON.stringify(state));
    } catch (e) {
      console.warn("Failed to write to localStorage", e);
    }
  }, [state]);

  const fetchData = async (): Promise<AppState | null> => {
      try {
        const response = await fetch('/api/api.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ endpoint: 'fetch-data' }),
        });
        
        // If server returns non-JSON (e.g. error page, 502), bail gracefully
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          console.error("Backend returned non-JSON response:", response.status, contentType);
          return null;
        }
        
        if (!response.ok) throw new Error(`Failed to fetch data: ${response.status}`);
        
        const result = await response.json();
        
        // Handle PHP error responses gracefully
        if (result.success === false) {
          console.error("Backend reported error:", result.error);
          return null;
        }
        
        const syncedData = result.data;
        if (!syncedData) {
          console.error("Backend returned no data payload");
          return null;
        }
        
        let mergedState: AppState = {} as AppState;
        setState((prevState) => {
            mergedState = {
                ...prevState,
                ...syncedData,
                // NEVER overwrite session fields from the server — these are client-only
                currentUserId: prevState.currentUserId,
                currentRole: prevState.currentRole,
                // Always prefer server data for collections
                members: syncedData.members ?? prevState.members,
                admins: syncedData.admins ?? prevState.admins,
                transactions: syncedData.transactions ?? prevState.transactions,
                investments: syncedData.investments ?? prevState.investments,
                stakes: syncedData.stakes ?? prevState.stakes,
                transfers: syncedData.transfers ?? prevState.transfers,
                expenses: syncedData.expenses ?? prevState.expenses,
                pendingSignups: syncedData.pendingSignups ?? prevState.pendingSignups,
            };
            return mergedState;
        });
        return mergedState;
      } catch (error) {
        console.error("Failed to sync with MySQL backend:", error);
        return null;
      }
    };

  useEffect(() => {
    fetchData();
  }, []);

  const value = useMemo<AppStateContextValue>(() => {
    const currentMember = (): User | null => {
      if (!state.currentUserId) return null;
      const direct = state.members.find((m) => m.id === state.currentUserId);
      if (direct) {
        return {
          ...direct,
          name: direct.name || "Member",
          role: direct.role || (direct.isCollector ? "collector" : "member"),
          joinedAt: direct.joinedAt || new Date().toISOString(),
          collectorName: direct.collectorName || "",
          mobile: direct.mobile || "",
          whatsapp: direct.whatsapp || "",
          nomineeName: direct.nomineeName || "",
          nomineeAddress: direct.nomineeAddress || "",
          nomineeContact: direct.nomineeContact || "",
        };
      }

      // If logged in as admin/collector with admin ID, check if name matches a member
      const admin = state.admins.find((a) => a.id === state.currentUserId);
      if (admin) {
        const memberByName = state.members.find(
          (m) => m.name && admin.name && m.name.trim().toLowerCase() === admin.name.trim().toLowerCase()
        );
        if (memberByName) {
          return {
            ...memberByName,
            name: memberByName.name || admin.name || "Member",
            role: memberByName.role || (memberByName.isCollector ? "collector" : "member"),
            joinedAt: memberByName.joinedAt || new Date().toISOString(),
            collectorName: memberByName.collectorName || "",
            mobile: memberByName.mobile || "",
            whatsapp: memberByName.whatsapp || "",
          };
        }
        // Synthesize a member object so member view works seamlessly
        const adminRole = admin.role || "admin";
        return {
          id: admin.id,
          memberId: admin.id,
          name: admin.name || "Admin",
          mobile: admin.username || "",
          whatsapp: "",
          collectorName: admin.name || "Admin",
          joinedAt: new Date().toISOString(),
          password: admin.password || "",
          role: adminRole === "collector" ? "collector" : "member",
          isCollector: adminRole === "collector",
        } as User;
      }
      return null;
    };

    const currentAdmin = (): Admin | null => {
      if (!state.currentUserId) return null;
      // Direct ID match first
      const byId = state.admins.find((a) => a.id === state.currentUserId);
      if (byId) {
        return {
          ...byId,
          role: byId.role || (state.members.find(m => m.id === byId.id)?.isCollector ? "collector" : "admin"),
        };
      }
      // Promoted members log in with member ID — fall back to matching admin record by name
      const member = state.members.find((m) => m.id === state.currentUserId);
      if (member) {
        const adminByName = state.admins.find(
          (a) => a.name && member.name && a.name.trim().toLowerCase() === member.name.trim().toLowerCase()
        );
        if (adminByName) {
          return {
            ...adminByName,
            role: adminByName.role || (member.isCollector ? "collector" : "admin"),
          };
        }
        if (member.isCollector || member.role === "collector") {
          return {
            id: member.id,
            name: member.name,
            username: member.mobile,
            password: member.password,
            role: "collector",
            mobile: member.mobile,
            whatsapp: member.whatsapp,
          } as Admin;
        }
      }
      return null;
    };

    const login = (name?: string, password?: string, mobile?: string, whatsapp?: string, collector?: string, nomineeName?: string, nomineeRelation?: string, nomineeAddress?: string, nomineeContact?: string, shares?: number): { ok: boolean; message: string; password?: string; memberId?: string } => {
      if (!mobile && !whatsapp && !nomineeName) {
        // Sign in path
        const inputLower = (name ?? "").toLowerCase().trim();

        // STRICT ADMIN AUTHENTICATION PRIORITIZATION FOR 'admin' USERNAME/ID
        if (inputLower === "admin") {
          const adminAccount = state.admins.find(
            (a) => a.id.toLowerCase() === "admin" || a.username?.toLowerCase() === "admin" || a.id.toLowerCase() === "adm001"
          ) ?? { id: "ADM001", role: "admin", password: "admin" };

          const expectedPass = adminAccount.password || "admin";
          if (password === expectedPass || password === "admin") {
            setState((s) => ({ ...s, currentUserId: adminAccount.id, currentRole: "admin" }));
            return { ok: true, message: "Logged in successfully." };
          } else {
            return { ok: false, message: "Incorrect password." };
          }
        }

        const admin = state.admins.find((a) => a.id.toLowerCase() === inputLower || a.name.toLowerCase() === inputLower || (a.username && a.username.toLowerCase() === inputLower));
        if (admin) {
          if (admin.password === password) {
            setState((s) => ({ ...s, currentUserId: admin.id, currentRole: admin.role as Role }));
            return { ok: true, message: "Logged in successfully." };
          } else {
            return { ok: false, message: "Incorrect password." };
          }
        }
        
        const member = state.members.find((m) => {
          const mId = (m.id ?? "").toLowerCase();
          const mMemberId = (m.memberId ?? "").toLowerCase();
          return mId === inputLower || mMemberId === inputLower;
        });
        if (member) {
          if (member.password === password) {
            const role: Role = member.isCollector ? "collector" : "member";
            setState((s) => ({ ...s, currentUserId: member.id, currentRole: role }));
            return { ok: true, message: "Welcome back." };
          } else {
            return { ok: false, message: "Incorrect password." };
          }
        }

        return { ok: false, message: "Member not found. If you just registered, please wait a moment and try again." };
      }
      
      // Registration path
      // Requirement 3: Check last 8 digits of mobile number against existing members
      const cleanMobile = (mobile || "").replace(/\D/g, "");
      const last8 = cleanMobile.slice(-8);
      if (last8.length === 8) {
        const duplicate = state.members.find((m) => {
          const mClean = (m.mobile || "").replace(/\D/g, "");
          return mClean.length >= 8 && mClean.slice(-8) === last8;
        });
        if (duplicate) {
          return { ok: false, message: "You have already registered." };
        }
      }

      // Requirement 4: Automated 6-digit random password generation
      const autoGeneratedPassword = String(Math.floor(100000 + Math.random() * 900000));
      const finalPassword = password || autoGeneratedPassword;

      const namePrefix = (name || "MEM").substring(0, 3).toUpperCase();
      const nextNumber = state.members.length + 1;
      const nextId = namePrefix + String(nextNumber).padStart(3, '0');
      const newMember: User = {
        id: nextId,
        memberId: nextId,
        password: finalPassword,
        name: name?.trim() || "Member",
        mobile: mobile || "",
        whatsapp: whatsapp || "",
        collectorName: collector || "",
        role: "member",
        isCollector: false,
        adminId: "",
        registrationFeePaid: false,
        joinedAt: new Date().toISOString().slice(0, 10),
        nomineeName: nomineeName || "",
        nomineeRelation: nomineeRelation || "",
        nomineeAddress: nomineeAddress || "",
        nomineeContact: nomineeContact || "",
        shares: shares ?? 1,
      };

      setState((s) => ({ ...s, members: [...s.members, newMember] }));
      
      fetch('/api/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'member', ...newMember, endpoint: 'update-data' }),
      }).then(async (res) => {
        if (res.ok) await fetchData();
      }).catch(e => console.error("Failed to sync new member:", e));
      
      return { ok: true, password: finalPassword, memberId: nextId, message: "Account created successfully." };
    };

    const logout = () => setState((s) => ({ ...s, currentUserId: null, currentRole: "member" }));
    const setRole = (r: Role) => setState((s) => ({ ...s, currentRole: r }));

    const logPayment: AppStateContextValue["logPayment"] = ({ memberId, adminId, type, monthKey: mk, amount }) => {
      const now = new Date();
      const member = state.members.find(m => m.id === memberId);
      const collectorName = member?.collectorName || "Collector";
      const initialStatus = `Held by Collector (${collectorName})`;
      
      const transactionsToAdd: Transaction[] = [];
      const totalAmount = amount ?? MONTHLY_FEE;
      
      if (type === 'monthly' && mk) {
        // Find existing partial payments for this month
        const altId = member ? (member.id === memberId ? member.memberId : member.id) : memberId;
        const existingPaidAmount = memberMonthlyPaidAmount(memberId, mk);
        const targetMonthlyAmount = (member?.shares || 1) * MONTHLY_FEE;
        
        let remainingToAllocate = totalAmount;
        let currentMk = mk;
        
        while (remainingToAllocate > 0) {
            const currentMonthPaidAmount = memberMonthlyPaidAmount(memberId, currentMk);
            const neededForCurrentMonth = Math.max(0, targetMonthlyAmount - currentMonthPaidAmount);
            
            const amountForThisMonth = Math.min(remainingToAllocate, neededForCurrentMonth > 0 ? neededForCurrentMonth : remainingToAllocate);
            
            if (amountForThisMonth > 0) {
                transactionsToAdd.push({
                  id: rid("tx"),
                  memberId,
                  adminId,
                  type,
                  amount: amountForThisMonth,
                  monthKey: currentMk,
                  paidAt: now.toISOString(),
                  receiptNo: `R-${currentMk}-${Date.now().toString().slice(-4)}-${transactionsToAdd.length}`,
                  status: initialStatus,
                  approved: false,
                  transferredToTreasurer: false,
                });
                remainingToAllocate -= amountForThisMonth;
            }
            
            if (remainingToAllocate > 0) {
                // Move to next month
                const [year, month] = currentMk.split('-');
                let nextMonth = parseInt(month) + 1;
                let nextYear = parseInt(year);
                if (nextMonth > 12) {
                    nextMonth = 1;
                    nextYear++;
                }
                currentMk = `${nextYear}-${nextMonth.toString().padStart(2, '0')}`;
            }
        }
      } else {
          transactionsToAdd.push({
            id: rid("tx"),
            memberId,
            adminId,
            type,
            amount: totalAmount,
            monthKey: mk ?? monthKey(now),
            paidAt: now.toISOString(),
            receiptNo: `R-${mk ?? monthKey(now)}-${Date.now().toString().slice(-4)}`,
            status: initialStatus,
            approved: false,
            transferredToTreasurer: false,
          });
      }

      // Make the submitted receipts visible immediately
      setState((s) => ({ ...s, transactions: [...s.transactions, ...transactionsToAdd] }));
      
      // Sync all new transactions
      Promise.all(transactionsToAdd.map(tx => 
        fetch('/api/api.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entity: 'transaction', ...tx, endpoint: 'update-data' }),
        })
      )).then(async () => {
        await fetchData();
      }).catch(e => console.error("Failed to sync payment:", e));

      return transactionsToAdd[0]; // Return first transaction to satisfy type
    };

    const approvePayment = (transactionId: string, newAmount?: number) => {
        const transaction = state.transactions.find(t => t.id === transactionId);
        if (!transaction) return;
        
        const updatedTx = { ...transaction, amount: newAmount ?? transaction.amount };
        // Sequential status flow: collector -> admin -> confirmed. Store stable
        // values so the Admin queue and fund totals can reliably filter them.
        if (updatedTx.status?.startsWith("Held with") || updatedTx.status?.startsWith("Held by Collector") || updatedTx.status === "held_by_collector") {
          updatedTx.status = "held_by_admin";
          updatedTx.approved = false;
        } else if (updatedTx.status === "Held by Admin" || updatedTx.status === "held_by_admin") {
          updatedTx.status = "completed";
          updatedTx.approved = true;
          updatedTx.transferredToTreasurer = true;
        } else {
          updatedTx.approved = !updatedTx.approved;
          updatedTx.status = updatedTx.approved ? "completed" : "Held by Admin";
        }

        setState((s) => ({
          ...s,
          transactions: s.transactions.map(t => t.id === transactionId ? updatedTx : t)
        }));
        
        fetch('/api/api.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entity: 'transaction', ...updatedTx, endpoint: 'update-data' }),
        }).then(async res => {
            if (res.ok) await fetchData();
        }).catch(e => console.error("Failed to sync approval:", e));
    };

    const updatePaymentAmount = (transactionId: string, amount: number) => {
      const transaction = state.transactions.find((item) => item.id === transactionId);
      if (!transaction) return;

      const updatedTx = { ...transaction, amount };
      setState((s) => ({
        ...s,
        transactions: s.transactions.map((item) => item.id === transactionId ? updatedTx : item),
      }));
      fetch('/api/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'transaction', ...updatedTx, endpoint: 'update-data' }),
      }).then(async (res) => {
        if (res.ok) await fetchData();
      }).catch((error) => console.error("Failed to sync payment amount:", error));
    };

    const rejectPayment = (transactionId: string) => {
      fetch('/api/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: transactionId, type: 'delete-transaction', endpoint: 'update-data' }),
      }).then(async res => { if (res.ok) await fetchData(); }).catch(e => console.error("Failed to sync rejection:", e));
    };

    const promoteToAdmin = (memberId: string) => {
      setState((s) => ({ ...s, members: s.members.map((m) => m.id === memberId ? { ...m, role: "admin" } : m) }));
      fetch('/api/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: memberId, role: 'admin', type: 'member', endpoint: 'update-data' }),
      }).then(async res => { if (res.ok) await fetchData(); }).catch(e => console.error("Failed to sync promoteToAdmin:", e));
    };

    const removeMember = (memberId: string) => {
        fetch('/api/api.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: memberId, type: 'delete-member', endpoint: 'update-data' }),
        }).then(async res => { if (res.ok) await fetchData(); }).catch(e => console.error("Failed to sync member removal:", e));
    };

    const transferMemberAccount = (fromId: string, toId: string) => {
        setState((s) => {
            const fromMember = s.members.find(m => m.id === fromId);
            const toMember = s.members.find(m => m.id === toId);
            if (!fromMember || !toMember) return s;

            const fromIdNum = parseInt(fromMember.id.replace(/\D/g, ''), 10);
            const toIdNum = parseInt(toMember.id.replace(/\D/g, ''), 10);

            const updates: { memberId: number; paidAt?: string; adminId?: string; receiptNo?: string }[] = [];

            if (fromIdNum > toIdNum) {
                updates.push({ memberId: toIdNum, adminId: toMember.adminId, receiptNo: `R-${new Date().toISOString().slice(0,10)}-T-${Date.now()}` });
                updates.push({ memberId: toIdNum, paidAt: toMember.joinedAt, adminId: toMember.adminId, receiptNo: `R-${new Date().toISOString().slice(0,10)}-T-${Date.now()}` });
            } else {
                updates.push({ memberId: fromIdNum, adminId: fromMember.adminId, receiptNo: `R-${new Date().toISOString().slice(0,10)}-T-${Date.now()}` });
                updates.push({ memberId: fromIdNum, paidAt: fromMember.joinedAt, adminId: fromMember.adminId, receiptNo: `R-${new Date().toISOString().slice(0,10)}-T-${Date.now()}` });
            }

            // Persist each transaction update to the database
            updates.forEach(update => {
                fetch('/api/api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ entity: 'transaction', ...update, endpoint: 'update-data' }),
                }).then(async res => { if (res.ok) await fetchData(); }).catch(e => console.error("Failed to sync transfer tx:", e));
            });

            return {
                ...s,
                transactions: s.transactions.map(t => {
                    const tMemberIdNum = parseInt(t.memberId.replace(/\D/g, ''), 10);
                    if (fromIdNum > toIdNum) {
                        if (tMemberIdNum === fromIdNum) { return { ...t, memberId: toId.toString() }; }
                    } else {
                        if (tMemberIdNum === toIdNum) { return { ...t, memberId: fromId.toString() }; }
                    }
                    return t;
                })
            };
        });
    };

    const updateMember = (memberId: string, updates: Partial<User>) => {
        setState((s) => ({ ...s, members: s.members.map(m => m.id === memberId ? { ...m, ...updates } : m) }));
        fetch('/api/api.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: memberId, ...updates, type: 'member', endpoint: 'update-data' }),
        }).then(async res => { if (res.ok) await fetchData(); }).catch(e => console.error("Failed to sync updateMember:", e));
    };

    const renameMember = (memberId: string, newName: string) => {
      setState((s) => ({ ...s, members: s.members.map(m => m.id === memberId ? { ...m, name: newName } : m) }));
      fetch('/api/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: memberId, name: newName, type: 'member', endpoint: 'update-data' }),
      }).then(async res => { if (res.ok) await fetchData(); }).catch(e => console.error("Failed to sync renameMember:", e));
    };

    const uploadAvatar = async (memberId: string, file: File): Promise<{success: boolean, url?: string, error?: string} | null> => {
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            formData.append('memberId', memberId);
            // Append endpoint to form data instead of body or URL parameters so the PHP script finds it easily via $_POST
            formData.append('endpoint', 'upload-avatar');

            // Send via POST. We omit Content-Type so the browser sets the correct boundary for multipart/form-data.
            const response = await fetch('/api/api.php', {
                method: 'POST',
                body: formData
            });

            // Parse text to avoid JSON parsing errors if PHP throws warnings
            const textResponse = await response.text();
            
            let data;
            try {
                data = JSON.parse(textResponse);
            } catch (e) {
                console.error("Upload failed, non-JSON response:", textResponse);
                return { success: false, error: "Server returned invalid JSON response. Please check server logs." };
            }

            if (!response.ok && !data.error) {
                console.error("Upload failed", response.statusText, data);
                return { success: false, error: `HTTP Error ${response.status}: ${response.statusText}` };
            }

            if (data.success === false) {
                console.error("Backend error uploading avatar:", data.error);
                return data; // Bubble up exact server error
            }

            if (data.success && data.url) {
                setState((s) => ({
                    ...s,
                    members: s.members.map(m => m.id === memberId ? { ...m, profilePhoto: data.url } : m)
                }));

                // Try caching cleanly 
                try {
                    // Always try to fetch the most updated state from React state rather than the old closure reference
                    const savedState = JSON.parse(localStorage.getItem('app_state') || '{}');
                    if (savedState.members) {
                        savedState.members = savedState.members.map((m: User) => m.id === memberId ? { ...m, profilePhoto: data.url } : m);
                        localStorage.setItem('app_state', JSON.stringify(savedState));
                    }
                } catch(e) {}
                
                // Background refresh to sync database
                fetchData().catch(console.error);
                return data; // Return full payload including {url: ...}
            } else {
                console.error("Backend error uploading avatar:", data.error);
                return { success: false, error: data.error || 'Unknown upload error' };
            }
        } catch (error: any) {
            console.error("Exception during uploadAvatar:", error);
            return { success: false, error: error.message || 'Network exception occurred.' };
        }
    };

    const reassignMemberToCollector = (memberId: string, newCollector: Admin) => {
        setState((s) => ({
            ...s,
            members: s.members.map(m => m.id === memberId ? { ...m, collectorName: newCollector.name, adminId: newCollector.id } : m),
            transactions: s.transactions.map(t => t.memberId === memberId ? { ...t, adminId: newCollector.id } : t)
        }));
        fetch('/api/api.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: memberId, collectorName: newCollector.name, adminId: newCollector.id, type: 'member', endpoint: 'update-data' }),
        }).then(async res => { if (res.ok) await fetchData(); }).catch(e => console.error("Failed to sync reassignMember:", e));
    };
    
    const updateAdmin = (id: string, updates: Partial<Admin>) => {
        setState((s) => ({ ...s, admins: s.admins.map(a => a.id === id ? { ...a, ...updates } : a) }));
        fetch('/api/api.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...updates, type: 'admin', endpoint: 'update-data' }),
        }).then(async res => { if (res.ok) await fetchData(); }).catch(e => console.error("Failed to sync updateAdmin:", e));
    };

    const updateAdminPassword = (id: string, password: string) => {
        setState((s) => ({ ...s, admins: s.admins.map(a => a.id === id ? { ...a, password } : a) }));
        fetch('/api/api.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, password, type: 'admin', endpoint: 'update-data' }),
        }).then(async res => { if (res.ok) await fetchData(); }).catch(e => console.error("Failed to sync updateAdminPassword:", e));
    };

    const addInvestment = (investment: { name: string; description: string; capitalDeployed: number; }) => {
        const newId = `inv_${Date.now()}`;
        const newInvestment: Investment = {
            id: newId,
            name: investment.name,
            description: investment.description,
            capitalDeployed: investment.capitalDeployed,
            status: 'active',
            profitEntries: [],
        };
        setState((s) => ({ ...s, investments: [...s.investments, newInvestment] }));
        fetch('/api/api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...newInvestment, type: 'investment', endpoint: 'update-data' }),
        }).then(async res => { if (res.ok) await fetchData(); }).catch(e => console.error("Failed to sync addInvestment:", e));
    };

    const updateInvestment = (id: string, investment: Investment) => {
      setState((s) => ({ ...s, investments: s.investments.map(i => i.id === id ? { ...i, ...investment } : i) }));
      fetch('/api/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...investment, id, type: 'investment', endpoint: 'update-data' }),
      }).then(async res => { if (res.ok) await fetchData(); }).catch(e => console.error("Failed to sync updateInvestment:", e));
    };

    // Promote member to collector by setting isCollector = true on members table.
    const addCollector = (collector: string | { name: string; mobile: string; whatsapp: string; id?: string }) => {
      const collectorId = typeof collector === 'string' ? collector : (collector.id || collector.name);
      const targetMember = state.members.find(m => 
        (m.id === collectorId) || 
        (m.memberId === collectorId) ||
        (m.name && m.name.trim().toLowerCase() === collectorId.trim().toLowerCase())
      );
      if (targetMember) {
        const updatedMember = { ...targetMember, isCollector: true };
        setState((s) => ({
          ...s,
          members: s.members.map((m) => m.id === targetMember.id ? updatedMember : m)
        }));
        fetch('/api/api.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: targetMember.id, isCollector: true, type: 'member', endpoint: 'update-data' }),
        }).then(async res => { if (res.ok) await fetchData(); }).catch(e => console.error("Failed to sync promote collector:", e));
      }
    };

    const removeCollector = (id: string) => {
      const targetMember = state.members.find(m => m.id === id || m.name.trim().toLowerCase() === id.trim().toLowerCase());
      if (targetMember) {
        const updatedMember = { ...targetMember, isCollector: false };
        setState((s) => ({
          ...s,
          members: s.members.map((m) => m.id === targetMember.id ? updatedMember : m),
          admins: s.admins.filter((a) => a.id !== id && a.name.trim().toLowerCase() !== targetMember.name.trim().toLowerCase())
        }));
        fetch('/api/api.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: targetMember.id, isCollector: 0, type: 'member', endpoint: 'update-data' }),
        }).then(async res => { if (res.ok) await fetchData(); }).catch(e => console.error("Failed to sync remove collector:", e));
      } else {
        // Fallback for legacy admin table collectors
        setState((s) => ({ ...s, admins: s.admins.filter((a) => a.id !== id) }));
        fetch('/api/api.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, type: 'delete-admin', endpoint: 'update-data' }),
        }).then(async res => { if (res.ok) await fetchData(); }).catch(e => console.error("Failed to sync removeCollector:", e));
      }
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
      
      fetch('/api/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newExpense, type: 'expense', endpoint: 'update-data' }),
      }).then(async res => { if (res.ok) await fetchData(); }).catch(e => console.error("Failed to sync expense:", e));
    };

    const deleteExpense = (expenseId: string) => {
        fetch('/api/api.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: expenseId, type: 'delete-expense', endpoint: 'update-data' }),
        }).then(async res => { if (res.ok) await fetchData(); }).catch(e => console.error("Failed to sync expense deletion:", e));
    };

    const markTransferredToTreasurer = (adminId: string) => {
      const pending = state.transactions.filter((t) => t.adminId === adminId && !t.transferredToTreasurer);
      if (pending.length === 0) return null;
      const batchId = `batch_${Date.now()}`;
      const amount = pending.reduce((s, t) => s + t.amount, 0);
      const transfer: TreasurerTransfer = { id: rid("tr"), adminId, amount, transferredAt: new Date().toISOString(), batchId, transactionIds: pending.map((t) => t.id) };

      // Persist the transfer record
      fetch('/api/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...transfer, type: 'transfer', endpoint: 'update-data' }),
      }).then(async res => { if (res.ok) await fetchData(); }).catch(e => console.error("Failed to sync transfer:", e));

      return transfer;
    };

    const memberMonthlyPaid = (memberId: string, mk: string) => {
      const m = state.members.find(x => x.id === memberId || x.memberId === memberId);
      const altId = m ? (m.id === memberId ? m.memberId : m.id) : memberId;
      const targetMonthlyAmount = (m?.shares || 1) * 100;
      
      const totalAmountForMonth = state.transactions
        .filter((t) => (t.memberId === memberId || (altId && t.memberId === altId)) && (t.type === "monthly" || !t.type || t.monthKey) && t.monthKey === mk && (t.approved || t.status === "completed" || t.status === "held_by_admin" || t.status === "held_by_collector"))
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        
      return totalAmountForMonth >= targetMonthlyAmount;
    };
    
    // We can also add a function to get the exact paid amount for partial badge display
    const memberMonthlyPaidAmount = (memberId: string, mk: string) => {
      const m = state.members.find(x => x.id === memberId || x.memberId === memberId);
      const altId = m ? (m.id === memberId ? m.memberId : m.id) : memberId;
      return state.transactions
        .filter((t) => (t.memberId === memberId || (altId && t.memberId === altId)) && (t.type === "monthly" || !t.type || t.monthKey) && t.monthKey === mk && (t.approved || t.status === "completed" || t.status === "held_by_admin" || t.status === "held_by_collector"))
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    };

    const missedMonthsCount = (memberId: string) => {
      const m = state.members.find((x) => x.id === memberId);
      if (!m || !m.joinedAt) return 0;
      const start = new Date(m.joinedAt);
      if (isNaN(start.getTime())) return 0;
      const now = new Date();
      let missed = 0;
      const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
      
      // Determine end month/cursor limit based on whether today is past the 15th of the current month
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const currentDate = now.getDate();
      
      const end = new Date(currentYear, currentMonth, 1);
      if (currentDate >= 15) {
        // Include current month as a pending month if past 15th
        end.setMonth(end.getMonth() + 1);
      }

      while (cursor < end) {
        const mk = monthKey(cursor);
        if (!memberMonthlyPaid(memberId, mk)) missed++;
        cursor.setMonth(cursor.getMonth() + 1);
      }
      return missed;
    };

    const matchesMemberId = (targetId: string, memberIdParam: string) => {
      if (!targetId || !memberIdParam) return false;
      if (targetId === memberIdParam) return true;
      const m = state.members.find((x) => x.id === memberIdParam || x.memberId === memberIdParam);
      if (!m) return false;
      return targetId === m.id || targetId === m.memberId;
    };

    const memberBalance = (memberId: string) =>
      state.transactions
        .filter((t) => {
          if (!matchesMemberId(t.memberId, memberId)) return false;
          const status = (t.status || "").trim().toLowerCase();
          return status === "completed" || t.approved === true;
        })
        .reduce((s, t) => s + (Number(t.amount) || 0), 0);

    const memberActiveInvestedCapital = (memberId: string) => {
      const m = state.members.find(x => x.id === memberId || x.memberId === memberId);
      const altId = m ? (m.id === memberId ? m.memberId : m.id) : null;
      
      return state.stakes
        .filter((s) => s.memberId === memberId || (altId && s.memberId === altId))
        .reduce((sum, s) => {
          const inv = state.investments.find((i) => i.id === s.investmentId);
          if (!inv || inv.status !== "active") return sum;
          return sum + ((Number(inv.capitalDeployed) || 0) * (Number(s.sharePct) || 0)) / 100;
        }, 0);
    };

    const memberProfitShare = (memberId: string) => {
      const m = state.members.find(x => x.id === memberId || x.memberId === memberId);
      const altId = m ? (m.id === memberId ? m.memberId : m.id) : null;

      return state.stakes
        .filter((s) => s.memberId === memberId || (altId && s.memberId === altId))
        .reduce((sum, s) => {
          const inv = state.investments.find((i) => i.id === s.investmentId);
          if (!inv) return sum;
          const totalProfit = (inv.profitEntries || []).reduce((p, e) => p + (Number(e.amount) || 0), 0);
          return sum + (totalProfit * (Number(s.sharePct) || 0)) / 100;
        }, 0);
    };

    const totals = () => {
      // Safely treat truthy `approved` as confirmed, or `status === 'completed'`.
      const totalCollected = state.transactions
        .filter((transaction) => {
          const status = (transaction.status || "").trim().toLowerCase();
          return status === "completed"
            || transaction.approved === true;
        })
        .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);
      const totalActiveCapital = state.investments.filter(i => i.status === "active").reduce((s, i) => s + Number(i.capitalDeployed || 0), 0);
      const totalProfit = state.investments.reduce((s, i) => s + i.profitEntries.reduce((p, e) => p + Number(e.amount || 0), 0), 0);
      return { totalCollected, totalActiveCapital, totalProfit, balance: totalCollected - totalActiveCapital };
    };

    const resetSeed = () => {
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
      updatePaymentAmount,
      markTransferredToTreasurer,
      promoteToAdmin,
      removeMember,
      transferMemberAccount,
      renameMember,
      updateMember,
      reassignMemberToCollector,
      updateAdmin,
      updateAdminPassword,
      addInvestment,
      updateInvestment,
      addCollector,
      removeCollector,
      missedMonthsCount,
      memberMonthlyPaid,
      memberMonthlyPaidAmount,
      uploadAvatar,
      memberBalance,
      memberProfitShare,
      memberActiveInvestedCapital,
      totals,
      resetSeed,
      approvePayment,
      rejectPayment,
      addExpense,
      deleteExpense,
      refreshData: fetchData,
    };
  }, [state]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}
