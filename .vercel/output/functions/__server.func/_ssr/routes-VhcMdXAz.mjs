import { r as __toESM } from "../_runtime.mjs";
import { a as Overlay2, b as require_jsx_runtime, c as Title2, d as DialogContent$1, f as DialogDescription$1, g as DialogTrigger$1, h as DialogTitle$1, i as Description2, l as Dialog$1, m as DialogPortal$1, n as Cancel, o as Portal2, p as DialogOverlay$1, r as Content2, s as Root2, t as Action, u as DialogClose, v as Slot, x as require_react } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { t as Root } from "../_libs/radix-ui__react-label.mjs";
import { a as TrendingUp, c as LogOut, d as ChevronDown, f as Briefcase, i as TriangleAlert, l as Coins, n as Wrench, o as Trash2, r as Wallet, s as ShieldCheck, t as X, u as ChevronUp } from "../_libs/lucide-react.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-VhcMdXAz.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function useGoogleSheetSync({ enabled = true, pollInterval = 5e3, onDataUpdate, onError }) {
	const intervalRef = (0, import_react.useRef)(null);
	const lastFetchTimeRef = (0, import_react.useRef)(0);
	const isActiveRef = (0, import_react.useRef)(false);
	const fetchData = (0, import_react.useCallback)(async () => {
		if (!isActiveRef.current) return;
		try {
			const timestamp = Date.now();
			const response = await fetch(`/api/fetch-data?t=${timestamp}`, {
				method: "GET",
				headers: {
					"Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
					"Pragma": "no-cache",
					"Expires": "0",
					"X-Request-Time": timestamp.toString()
				}
			});
			if (!response.ok) throw new Error(`Failed to fetch data: ${response.statusText}`);
			const result = await response.json();
			lastFetchTimeRef.current = timestamp;
			if (result.success && result.data) onDataUpdate?.(result.data);
			else if (result.error) throw new Error(result.error);
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			console.error("Google Sheets sync error:", err);
			onError?.(err);
		}
	}, [onDataUpdate, onError]);
	const startPolling = (0, import_react.useCallback)(() => {
		if (!enabled || intervalRef.current) return;
		isActiveRef.current = true;
		fetchData();
		intervalRef.current = setInterval(() => {
			fetchData();
		}, pollInterval);
	}, [
		enabled,
		fetchData,
		pollInterval
	]);
	const stopPolling = (0, import_react.useCallback)(() => {
		isActiveRef.current = false;
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	}, []);
	const manualRefresh = (0, import_react.useCallback)(async () => {
		await fetchData();
	}, [fetchData]);
	(0, import_react.useEffect)(() => {
		if (enabled) startPolling();
		else stopPolling();
		return () => {
			stopPolling();
		};
	}, [
		enabled,
		startPolling,
		stopPolling
	]);
	return {
		manualRefresh,
		startPolling,
		stopPolling,
		lastFetchTime: lastFetchTimeRef.current
	};
}
var STORAGE_KEY = "ameen-portal-state-v1";
var FEES = {
	REG_FEE: 10,
	MONTHLY_FEE: 100
};
var monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
var rid = (p) => `${p}_${Math.random().toString(36).slice(2, 10)}`;
function seed() {
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
		pendingSignups: []
	};
}
function load() {
	if (typeof window === "undefined") return seed();
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			const s = seed();
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
			return s;
		}
		return JSON.parse(raw);
	} catch {
		return seed();
	}
}
var AppStateContext = (0, import_react.createContext)(null);
function AppStateProvider({ children }) {
	const [state, setState] = (0, import_react.useState)(() => load());
	const [refreshTrigger, setRefreshTrigger] = (0, import_react.useState)(0);
	const [isInitialized, setIsInitialized] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (typeof window === "undefined" || isInitialized) return;
		const loadInitialData = async () => {
			try {
				const response = await fetch(`/api/fetch-data?t=${Date.now()}`, { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" } });
				if (response.ok) {
					const result = await response.json();
					if (result.success && result.data) setState((prevState) => ({
						currentUserId: prevState.currentUserId,
						currentRole: prevState.currentRole,
						...result.data
					}));
				}
			} catch (err) {
				console.error("Failed to load initial data:", err);
			}
			setIsInitialized(true);
		};
		loadInitialData();
	}, [isInitialized]);
	(0, import_react.useEffect)(() => {
		if (typeof window === "undefined") return;
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	}, [state]);
	useGoogleSheetSync({
		enabled: typeof window !== "undefined" && isInitialized,
		pollInterval: 1e3,
		onDataUpdate: (syncedData) => {
			setState((prevState) => {
				return {
					currentUserId: prevState.currentUserId,
					currentRole: prevState.currentRole,
					members: syncedData.members ?? prevState.members,
					admins: syncedData.admins ?? prevState.admins,
					transactions: syncedData.transactions ?? prevState.transactions,
					investments: syncedData.investments ?? prevState.investments,
					stakes: syncedData.stakes ?? prevState.stakes,
					transfers: syncedData.transfers ?? prevState.transfers,
					expenses: syncedData.expenses ?? prevState.expenses,
					pendingSignups: syncedData.pendingSignups ?? prevState.pendingSignups
				};
			});
		},
		onError: (error) => {
			console.error("Failed to sync with Google Sheets:", error);
		}
	});
	const value = (0, import_react.useMemo)(() => {
		const currentMember = () => state.members.find((m) => m.id === state.currentUserId) ?? null;
		const currentAdmin = () => state.admins.find((a) => a.id === state.currentUserId) ?? null;
		const login = (name, password, mobile, whatsapp, collector, nomineeName, nomineeAddress, nomineeContact) => {
			if (!mobile && !whatsapp && !nomineeName) {
				const adminByName = state.admins.find((a) => a.name === name);
				if (adminByName) {
					setState((s) => ({
						...s,
						currentUserId: adminByName.id,
						currentRole: "admin"
					}));
					return {
						ok: true,
						message: "Logged in as admin."
					};
				}
				const member = state.members.find((m) => m.memberId === name || m.id === name);
				if (member) if (member.password === password) {
					setState((s) => ({
						...s,
						currentUserId: member.id,
						currentRole: "member"
					}));
					return {
						ok: true,
						message: "Welcome back."
					};
				} else return {
					ok: false,
					message: "Incorrect password."
				};
				const adminById = state.admins.find((a) => a.id === name);
				if (adminById && password === "admin123") {
					setState((s) => ({
						...s,
						currentUserId: adminById.id,
						currentRole: "admin"
					}));
					return {
						ok: true,
						message: "Logged in as admin."
					};
				}
				return {
					ok: false,
					message: "Member ID or password is incorrect."
				};
			}
			const namePrefix = (name || "MEM").substring(0, 3).toUpperCase();
			const nextNumber = state.members.length + 1;
			const nextId = namePrefix + String(nextNumber).padStart(3, "0");
			const isFirstMember = state.members.length === 0;
			const newMember = {
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
				joinedAt: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
				nomineeName: nomineeName || "",
				nomineeAddress: nomineeAddress || "",
				nomineeContact: nomineeContact || ""
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
					admins: [...s.admins, {
						id: newMember.id,
						name: newMember.name,
						role: "admin"
					}],
					members: [...s.members, newMember],
					currentUserId: newMember.id,
					currentRole: "admin"
				}));
			} else setState((s) => ({
				...s,
				members: [...s.members, newMember],
				currentUserId: newMember.id,
				currentRole: "member"
			}));
			return {
				ok: true,
				message: `Account created${isFirstMember ? " as admin" : ""} — pending 10 QR registration fee approval.`
			};
		};
		const logout = () => setState((s) => ({
			...s,
			currentUserId: null,
			currentRole: "member"
		}));
		const setRole = (r) => setState((s) => ({
			...s,
			currentRole: r
		}));
		const logPayment = ({ memberId, adminId, type, monthKey: mk, amount }) => {
			const now = /* @__PURE__ */ new Date();
			const isCollector = state.admins.find((a) => a.id === adminId)?.role === "collector";
			const tx = {
				id: rid("tx"),
				memberId,
				adminId,
				type,
				amount: amount ?? FEES.MONTHLY_FEE,
				monthKey: mk ?? monthKey(now),
				paidAt: now.toISOString(),
				receiptNo: `R-${mk ?? monthKey(now)}-${Date.now().toString().slice(-4)}`,
				status: isCollector ? "held_by_collector" : "held_by_admin",
				transferredToTreasurer: false
			};
			const txData = {
				...tx,
				type: "transaction"
			};
			console.log("Persisting transaction to Google Sheets:", txData);
			fetch("/api/update-data", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
				},
				body: JSON.stringify(txData)
			}).then((res) => {
				console.log("Persistence response status:", res.status);
				return res.json().then((json) => {
					console.log("Persistence response:", json);
					if (res.ok) setTimeout(() => setRefreshTrigger((prev) => prev + 1), 500);
				});
			}).catch((err) => console.error("Failed to persist transaction:", err));
			setState((s) => ({
				...s,
				transactions: [...s.transactions, tx]
			}));
			return tx;
		};
		const approvePayment = (transactionId, newAmount) => {
			setState((s) => {
				const transaction = s.transactions.find((t) => t.id === transactionId);
				if (!transaction) return s;
				const updatedTx = {
					...transaction,
					amount: newAmount ?? transaction.amount
				};
				if (updatedTx.status === "held_by_collector") updatedTx.status = "held_by_admin";
				else if (updatedTx.status === "held_by_admin") {
					updatedTx.status = "confirmed";
					updatedTx.approved = true;
					updatedTx.transferredToTreasurer = true;
				}
				fetch("/api/update-data", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
					},
					body: JSON.stringify({
						sheet: "Data",
						...updatedTx
					})
				}).then(() => {
					setTimeout(() => setRefreshTrigger((prev) => prev + 1), 300);
				}).catch((err) => console.error("Failed to update transaction:", err));
				return {
					...s,
					members: s.members.map((m) => m.id === transaction.memberId && transaction.type === "registration" ? {
						...m,
						registrationFeePaid: true
					} : m),
					transactions: s.transactions.map((t) => t.id === transactionId ? updatedTx : t)
				};
			});
		};
		const rejectPayment = (transactionId) => {
			setState((s) => ({
				...s,
				transactions: s.transactions.filter((t) => t.id !== transactionId)
			}));
		};
		const promoteToAdmin = (memberId) => {
			setState((s) => ({
				...s,
				members: s.members.map((m) => m.id === memberId ? {
					...m,
					role: "admin"
				} : m)
			}));
		};
		const removeMember = (memberId) => {
			setState((s) => {
				const memberToRemove = s.members.find((m) => m.id === memberId);
				if (!memberToRemove) return s;
				s.admins.filter((a) => a.id === memberId || a.name === memberToRemove.name).forEach((admin) => {
					fetch("/api/update-data", {
						method: "DELETE",
						headers: {
							"Content-Type": "application/json",
							"Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
						},
						body: JSON.stringify({
							id: admin.id,
							name: admin.name
						})
					}).catch((err) => console.error("Failed to delete admin from sheet:", err));
				});
				fetch("/api/update-data", {
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
						"Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
					},
					body: JSON.stringify({
						id: memberId,
						name: memberToRemove.name
					})
				}).catch((err) => console.error("Failed to delete member from sheet:", err));
				return {
					...s,
					currentUserId: s.currentUserId === memberId ? null : s.currentUserId,
					currentRole: s.currentUserId === memberId ? "member" : s.currentRole,
					members: s.members.filter((m) => m.id !== memberId),
					admins: s.admins.filter((a) => a.id !== memberId && a.name !== memberToRemove.name),
					transactions: s.transactions.filter((t) => t.memberId !== memberId),
					stakes: s.stakes.filter((st) => st.memberId !== memberId)
				};
			});
		};
		const transferMemberAccount = (fromId, toId) => {
			setState((s) => {
				if (!s.members.find((m) => m.id === fromId)) return s;
				return {
					...s,
					members: s.members.filter((m) => m.id !== fromId),
					transactions: s.transactions.map((t) => t.memberId === fromId ? {
						...t,
						memberId: toId
					} : t),
					stakes: s.stakes.map((st) => st.memberId === fromId ? {
						...st,
						memberId: toId
					} : st)
				};
			});
		};
		const renameMember = (memberId, newName) => {
			setState((s) => ({
				...s,
				members: s.members.map((m) => m.id === memberId ? {
					...m,
					name: newName
				} : m)
			}));
		};
		const updateMember = (memberId, updates) => {
			setState((s) => ({
				...s,
				members: s.members.map((m) => m.id === memberId ? {
					...m,
					...updates
				} : m)
			}));
		};
		const reassignMemberToCollector = (memberId, newCollector) => {
			setState((s) => ({
				...s,
				members: s.members.map((m) => m.id === memberId ? {
					...m,
					collectorName: newCollector.name,
					adminId: newCollector.id
				} : m),
				transactions: s.transactions.map((t) => t.memberId === memberId ? {
					...t,
					adminId: newCollector.id
				} : t)
			}));
		};
		const updateAdmin = (id, updates) => {
			setState((s) => ({
				...s,
				admins: s.admins.map((a) => a.id === id ? {
					...a,
					...updates
				} : a)
			}));
		};
		const addInvestment = (investment) => {
			setState((s) => {
				const invId = `inv_${Date.now()}`;
				const newInv = {
					id: invId,
					name: investment.name,
					description: investment.description,
					capitalDeployed: investment.capitalDeployed,
					profitEntries: [],
					status: "active"
				};
				const totalContributed = s.transactions.reduce((sum, t) => sum + t.amount, 0);
				const newStakes = s.members.map((m) => {
					const mContrib = s.transactions.filter((t) => t.memberId === m.id).reduce((sum, t) => sum + t.amount, 0);
					return {
						memberId: m.id,
						investmentId: invId,
						sharePct: totalContributed > 0 ? mContrib / totalContributed * 100 : 0
					};
				});
				return {
					...s,
					investments: [...s.investments, newInv],
					stakes: [...s.stakes, ...newStakes]
				};
			});
		};
		const updateInvestment = (id, investment) => {
			setState((s) => ({
				...s,
				investments: s.investments.map((i) => i.id === id ? {
					...i,
					...investment
				} : i)
			}));
		};
		const addCollector = (collector) => {
			setState((s) => ({
				...s,
				admins: [...s.admins, {
					id: `adm_${Date.now()}`,
					name: collector.name,
					role: "collector",
					mobile: collector.mobile,
					whatsapp: collector.whatsapp
				}]
			}));
		};
		const removeCollector = (id) => {
			setState((s) => ({
				...s,
				admins: s.admins.filter((a) => a.id !== id)
			}));
		};
		const addExpense = (expense) => {
			const currentAdmin = state.admins.find((a) => a.id === state.currentUserId);
			const newExpense = {
				id: rid("exp"),
				description: expense.description,
				amount: expense.amount,
				category: expense.category,
				date: (/* @__PURE__ */ new Date()).toISOString(),
				addedBy: currentAdmin?.name || "Unknown",
				notes: expense.notes
			};
			fetch("/api/update-data", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
				},
				body: JSON.stringify({
					sheet: "Data",
					type: "expense",
					...newExpense
				})
			}).then(() => {
				setTimeout(() => setRefreshTrigger((prev) => prev + 1), 300);
			}).catch((err) => console.error("Failed to save expense to sheet:", err));
			setState((s) => ({
				...s,
				expenses: [...s.expenses, newExpense]
			}));
		};
		const deleteExpense = (expenseId) => {
			if (state.expenses.find((e) => e.id === expenseId)) fetch("/api/update-data", {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
				},
				body: JSON.stringify({ id: expenseId })
			}).then(() => {
				setTimeout(() => setRefreshTrigger((prev) => prev + 1), 300);
			}).catch((err) => console.error("Failed to delete expense from sheet:", err));
			setState((s) => ({
				...s,
				expenses: s.expenses.filter((e) => e.id !== expenseId)
			}));
		};
		const markTransferredToTreasurer = (adminId) => {
			const pending = state.transactions.filter((t) => t.adminId === adminId && !t.transferredToTreasurer);
			if (pending.length === 0) return null;
			const batchId = `batch_${Date.now()}`;
			const amount = pending.reduce((s, t) => s + t.amount, 0);
			const transfer = {
				id: rid("tr"),
				adminId,
				amount,
				transferredAt: (/* @__PURE__ */ new Date()).toISOString(),
				batchId,
				transactionIds: pending.map((t) => t.id)
			};
			setState((s) => ({
				...s,
				transactions: s.transactions.map((t) => t.adminId === adminId && !t.transferredToTreasurer ? {
					...t,
					transferredToTreasurer: true,
					transferBatchId: batchId
				} : t),
				transfers: [transfer, ...s.transfers]
			}));
			return transfer;
		};
		const memberMonthlyPaid = (memberId, mk) => state.transactions.some((t) => t.memberId === memberId && t.type === "monthly" && t.monthKey === mk);
		const missedMonthsCount = (memberId) => {
			const m = state.members.find((x) => x.id === memberId);
			if (!m) return 0;
			const start = new Date(m.joinedAt);
			const now = /* @__PURE__ */ new Date();
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
		const memberBalance = (memberId) => state.transactions.filter((t) => t.memberId === memberId && t.type === "monthly" && t.approved).reduce((s, t) => s + t.amount, 0);
		const memberActiveInvestedCapital = (memberId) => state.stakes.filter((s) => s.memberId === memberId).reduce((sum, s) => {
			const inv = state.investments.find((i) => i.id === s.investmentId);
			if (!inv || inv.status !== "active") return sum;
			return sum + inv.capitalDeployed * s.sharePct / 100;
		}, 0);
		const memberProfitShare = (memberId) => state.stakes.filter((s) => s.memberId === memberId).reduce((sum, s) => {
			const inv = state.investments.find((i) => i.id === s.investmentId);
			if (!inv) return sum;
			return sum + inv.profitEntries.reduce((p, e) => p + e.amount, 0) * s.sharePct / 100;
		}, 0);
		const totals = () => {
			const totalCollected = state.transactions.filter((t) => t.approved && t.type === "monthly").reduce((s, t) => s + t.amount, 0);
			const totalActiveCapital = state.investments.filter((i) => i.status === "active").reduce((s, i) => s + i.capitalDeployed, 0);
			return {
				totalCollected,
				totalActiveCapital,
				totalProfit: state.investments.reduce((s, i) => s + i.profitEntries.reduce((p, e) => p + e.amount, 0), 0),
				balance: totalCollected - totalActiveCapital
			};
		};
		const triggerDataRefresh = () => {
			setRefreshTrigger((prev) => prev + 1);
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
			triggerDataRefresh,
			addExpense,
			deleteExpense
		};
	}, [state]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppStateContext.Provider, {
		value,
		children
	});
}
function useAppState() {
	const ctx = (0, import_react.useContext)(AppStateContext);
	if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
	return ctx;
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
			destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
			outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
			secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
			ghost: "hover:bg-accent hover:text-accent-foreground",
			link: "text-primary underline-offset-4 hover:underline"
		},
		size: {
			default: "h-9 px-4 py-2",
			sm: "h-8 rounded-md px-3 text-xs",
			lg: "h-10 rounded-md px-8",
			icon: "h-9 w-9"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
var Input = import_react.forwardRef(({ className, type, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type,
		className: cn("flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
		ref,
		...props
	});
});
Input.displayName = "Input";
var labelVariants = cva("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");
var Label = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Root, {
	ref,
	className: cn(labelVariants(), className),
	...props
}));
Label.displayName = Root.displayName;
var Card = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("rounded-xl border bg-card text-card-foreground shadow", className),
	...props
}));
Card.displayName = "Card";
var CardHeader = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("flex flex-col space-y-1.5 p-6", className),
	...props
}));
CardHeader.displayName = "CardHeader";
var CardTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("font-semibold leading-none tracking-tight", className),
	...props
}));
CardTitle.displayName = "CardTitle";
var CardDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
CardDescription.displayName = "CardDescription";
var CardContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("p-6 pt-0", className),
	...props
}));
CardContent.displayName = "CardContent";
var CardFooter = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("flex items-center p-6 pt-0", className),
	...props
}));
CardFooter.displayName = "CardFooter";
var fmt = (n) => n.toLocaleString(void 0, { maximumFractionDigits: 2 });
var fmtDate = (iso) => new Date(iso).toLocaleDateString();
var fmtMonthKey = (monthKeyStr) => {
	if (!monthKeyStr || monthKeyStr === "N/A") return "N/A";
	const [year, month] = monthKeyStr.split("-");
	if (!year || !month) return monthKeyStr;
	return new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString(void 0, {
		month: "long",
		year: "numeric"
	});
};
function PublicAnalytics() {
	const { totals, state } = useAppState();
	const t = totals();
	const totalExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);
	const netBalance = t.balance - totalExpenses;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-xs font-semibold uppercase tracking-wider text-emerald-700",
			children: "Fund transparency · live"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 sm:grid-cols-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard$1, {
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "h-4 w-4" }),
					label: "Total Collected",
					value: fmt(t.totalCollected),
					hint: `${state.transactions.length} transactions`
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard$1, {
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Coins, { className: "h-4 w-4" }),
					label: "Invested Amount",
					value: fmt(t.totalActiveCapital),
					hint: `${state.investments.filter((i) => i.status === "active").length} ventures`
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard$1, {
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "h-4 w-4" }),
					label: "Total Profit",
					value: fmt(t.totalProfit),
					hint: "Distributed by share"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard$1, {
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "h-4 w-4" }),
					label: "Total Expenses",
					value: fmt(totalExpenses),
					hint: `${state.expenses.length} official expenses`
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard$1, {
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "h-4 w-4" }),
					label: "Balance Amount",
					value: fmt(t.balance),
					hint: "Before expenses"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard$1, {
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "h-4 w-4" }),
					label: "Net Balance",
					value: fmt(netBalance),
					hint: "After all expenses deducted"
				})
			]
		})]
	});
}
function StatCard$1({ icon, label, value, hint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: "border-emerald-100 p-4 transition-shadow hover:shadow-md",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 text-emerald-700",
				children: [icon, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs font-medium uppercase tracking-wide",
					children: label
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 text-2xl font-bold text-slate-900",
				children: value
			}),
			hint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 text-xs text-slate-500",
				children: hint
			})
		]
	});
}
function Login() {
	const { login, state } = useAppState();
	const [inputId, setInputId] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [name, setName] = (0, import_react.useState)("");
	const [mobile, setMobile] = (0, import_react.useState)("");
	const [whatsapp, setWhatsapp] = (0, import_react.useState)("");
	const [collector, setCollector] = (0, import_react.useState)("");
	const [nomineeName, setNomineeName] = (0, import_react.useState)("");
	const [nomineeAddress, setNomineeAddress] = (0, import_react.useState)("");
	const [nomineeContact, setNomineeContact] = (0, import_react.useState)("");
	const [isRegistering, setIsRegistering] = (0, import_react.useState)(false);
	const [msg, setMsg] = (0, import_react.useState)(null);
	const [err, setErr] = (0, import_react.useState)(null);
	const submit = (e) => {
		e.preventDefault();
		const r = login(isRegistering ? name : inputId, password, mobile, whatsapp, collector, nomineeName, nomineeAddress, nomineeContact);
		if (r.ok) {
			setMsg(r.message);
			setErr(null);
		} else {
			setErr(r.message);
			setMsg(null);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "border-b border-emerald-100 bg-white",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-auto flex max-w-6xl items-center justify-between px-4 py-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "h-5 w-5" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-lg font-bold tracking-tight text-slate-900",
						children: "Ameen Portal"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xs text-slate-500",
						children: "Community Investment Fund"
					})] })]
				})
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
					className: "text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl",
					children: [
						"Grow together.",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-emerald-600",
							children: "Invest with trust."
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-slate-600",
					children: "Ameen is a transparent community fund. Members contribute 100 monthly; pooled capital is deployed into vetted local businesses. Every deposit, transfer, and profit share is tracked in the open."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PublicAnalytics, {})
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "border-emerald-100 p-6 shadow-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl font-semibold text-slate-900",
						children: isRegistering ? "REGISTER TO JOIN" : "SIGN IN TO JOIN"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-slate-500",
						children: isRegistering ? "Enter your details to create an account." : "Need an account? Sign up. Enter your ID and Password."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: submit,
						className: "mt-5 space-y-4",
						children: [
							!isRegistering && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "inputId",
								children: "Member ID"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "inputId",
								type: "text",
								placeholder: "e.g., MEM001",
								value: inputId,
								onChange: (e) => setInputId(e.target.value),
								required: true
							})] }),
							!isRegistering && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "password",
								children: "Password"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "password",
								type: "password",
								placeholder: "••••••••",
								value: password,
								onChange: (e) => setPassword(e.target.value),
								required: true
							})] }),
							isRegistering && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "name",
										children: "Full name"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "name",
										placeholder: "e.g., Mohammed Saleem",
										value: name,
										onChange: (e) => setName(e.target.value),
										required: true
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "mobile",
										children: "Mobile Number"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "mobile",
										placeholder: "+974...",
										value: mobile,
										onChange: (e) => setMobile(e.target.value),
										required: true
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "whatsapp",
										children: "WhatsApp Number"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "whatsapp",
										placeholder: "+974...",
										value: whatsapp,
										onChange: (e) => setWhatsapp(e.target.value),
										required: true
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "border-t pt-4 mt-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "font-semibold text-slate-900 mb-3",
												children: "Nominee Information"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "nomineeName",
												children: "Nominee Full Name"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "nomineeName",
												placeholder: "Nominee Name",
												value: nomineeName,
												onChange: (e) => setNomineeName(e.target.value),
												required: true
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													htmlFor: "nomineeAddress",
													children: "Nominee Address"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													id: "nomineeAddress",
													placeholder: "Nominee Address",
													value: nomineeAddress,
													onChange: (e) => setNomineeAddress(e.target.value),
													required: true
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													htmlFor: "nomineeContact",
													children: "Nominee Contact Number"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													id: "nomineeContact",
													placeholder: "+974...",
													value: nomineeContact,
													onChange: (e) => setNomineeContact(e.target.value),
													required: true
												})]
											})
										]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								className: "w-full bg-emerald-600 text-white hover:bg-emerald-700",
								children: isRegistering ? "Register" : "Sign In"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-center text-sm",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setIsRegistering(!isRegistering),
									className: "text-emerald-600 hover:underline",
									children: isRegistering ? "Already have an account? Sign in" : "Need an account? Register"
								})
							}),
							msg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800",
								children: msg
							}),
							err && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700",
								children: err
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Sign In Instructions:" }),
							" Use your Member ID (e.g.,",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
								className: "font-mono",
								children: "MEM001"
							}),
							") and your Password to sign in. If you don't have an account, click \"Need an account? Register\" to create one."
						]
					})
				]
			}) })]
		})]
	});
}
function AppShell({ title, subtitle, children, actions }) {
	const { logout, currentMember, currentAdmin, state } = useAppState();
	const m = currentMember();
	const who = currentAdmin()?.name ?? m?.name ?? "Guest";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-slate-50",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "border-b border-slate-200 bg-white",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex max-w-7xl items-center justify-between px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "h-5 w-5" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-sm font-bold tracking-tight text-slate-900",
						children: "Ameen Portal"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xs text-slate-500",
						children: state.currentRole === "admin" ? "Admin Console" : state.currentRole === "collector" ? "Collector Portal" : "Member Portal"
					})] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "hidden text-right sm:block",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-sm font-medium text-slate-900",
							children: who
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						size: "sm",
						onClick: logout,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "mr-1.5 h-3.5 w-3.5" }), " Logout"]
					})]
				})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-7xl px-4 py-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-6 flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-bold tracking-tight text-slate-900",
					children: title
				}), subtitle && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-slate-500",
					children: subtitle
				})] }), actions && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: actions })]
			}), children]
		})]
	});
}
var badgeVariants = cva("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", {
	variants: { variant: {
		default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
		secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
		destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
		outline: "text-foreground"
	} },
	defaultVariants: { variant: "default" }
});
function Badge({ className, variant, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn(badgeVariants({ variant }), className),
		...props
	});
}
var Dialog = Dialog$1;
var DialogTrigger = DialogTrigger$1;
var DialogPortal = DialogPortal$1;
var DialogOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay$1, {
	ref,
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props
}));
DialogOverlay.displayName = DialogOverlay$1.displayName;
var DialogContent = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
	ref,
	className: cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
		className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "Close"
		})]
	})]
})] }));
DialogContent.displayName = DialogContent$1.displayName;
var DialogHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-1.5 text-center sm:text-left", className),
	...props
});
DialogHeader.displayName = "DialogHeader";
var DialogFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
DialogFooter.displayName = "DialogFooter";
var DialogTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle$1, {
	ref,
	className: cn("text-lg font-semibold leading-none tracking-tight", className),
	...props
}));
DialogTitle.displayName = DialogTitle$1.displayName;
var DialogDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription$1, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
DialogDescription.displayName = DialogDescription$1.displayName;
var Table = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: "relative w-full overflow-auto",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("table", {
		ref,
		className: cn("w-full caption-bottom text-sm", className),
		...props
	})
}));
Table.displayName = "Table";
var TableHeader = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
	ref,
	className: cn("[&_tr]:border-b", className),
	...props
}));
TableHeader.displayName = "TableHeader";
var TableBody = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
	ref,
	className: cn("[&_tr:last-child]:border-0", className),
	...props
}));
TableBody.displayName = "TableBody";
var TableFooter = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tfoot", {
	ref,
	className: cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className),
	...props
}));
TableFooter.displayName = "TableFooter";
var TableRow = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
	ref,
	className: cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className),
	...props
}));
TableRow.displayName = "TableRow";
var TableHead = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
	ref,
	className: cn("h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]", className),
	...props
}));
TableHead.displayName = "TableHead";
var TableCell = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
	ref,
	className: cn("p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]", className),
	...props
}));
TableCell.displayName = "TableCell";
var TableCaption = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("caption", {
	ref,
	className: cn("mt-4 text-sm text-muted-foreground", className),
	...props
}));
TableCaption.displayName = "TableCaption";
function MemberDashboard() {
	const { state, currentMember, memberBalance, memberProfitShare, memberActiveInvestedCapital, missedMonthsCount, memberMonthlyPaid, logPayment, reassignMemberToCollector, updateMember } = useAppState();
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
	const [isEditOpen, setIsEditOpen] = (0, import_react.useState)(false);
	const [isChooseCollectorOpen, setIsChooseCollectorOpen] = (0, import_react.useState)(false);
	const [selectedCollectorId, setSelectedCollectorId] = (0, import_react.useState)(admin?.id || "");
	const [name, setName] = (0, import_react.useState)(m.name);
	const [mobile, setMobile] = (0, import_react.useState)(m.mobile);
	const [whatsapp, setWhatsapp] = (0, import_react.useState)(m.whatsapp);
	const [nomineeName, setNomineeName] = (0, import_react.useState)(m.nomineeName || "");
	const [nomineeAddress, setNomineeAddress] = (0, import_react.useState)(m.nomineeAddress || "");
	const [nomineeContact, setNomineeContact] = (0, import_react.useState)(m.nomineeContact || "");
	const canLogPayment = !!m.adminId && m.adminId !== "adm_ali";
	const myTx = state.transactions.filter((t) => t.memberId === m.id).sort((a, b) => a.paidAt < b.paidAt ? 1 : -1);
	const myStakes = state.stakes.filter((s) => s.memberId === m.id);
	const months = [];
	const cursor = /* @__PURE__ */ new Date();
	cursor.setDate(1);
	for (let i = 0; i < 12; i++) {
		months.unshift(monthKey(cursor));
		cursor.setMonth(cursor.getMonth() - 1);
	}
	cursor.setMonth(cursor.getMonth() + 13);
	for (let i = 0; i < 12; i++) {
		months.push(monthKey(cursor));
		cursor.setMonth(cursor.getMonth() + 1);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: `Welcome, ${m.name.split(" ")[0]}`,
		subtitle: `Assigned collector: ${collectorName} | Mobile: ${collectorMobile} | WhatsApp: ${collectorWhatsapp}`,
		actions: null,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				className: "mb-6 p-5",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4",
							children: [m.profilePhoto ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: m.profilePhoto,
								alt: "Profile",
								className: "w-20 h-20 rounded-full object-cover"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-slate-500",
								children: "No Photo"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-xl font-bold",
									children: m.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-slate-600 font-mono text-sm",
									children: ["ID: ", m.memberId]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-slate-600",
									children: ["Mobile: ", m.mobile]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-slate-600",
									children: ["WhatsApp: ", m.whatsapp]
								}),
								m.nomineeName && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 pt-3 border-t border-slate-200",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs font-semibold text-slate-700 uppercase",
											children: "Nominee"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-slate-600",
											children: ["Name: ", m.nomineeName]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-slate-600",
											children: ["Address: ", m.nomineeAddress]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-slate-600",
											children: ["Contact: ", m.nomineeContact]
										})
									]
								})
							] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
							open: isEditOpen,
							onOpenChange: setIsEditOpen,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
								asChild: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									children: "Edit Profile"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
								className: "max-h-[80vh] overflow-y-auto",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Edit Profile" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Profile Photo" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "file",
											onChange: (e) => {
												const file = e.target.files?.[0];
												if (file) {
													const reader = new FileReader();
													reader.onloadend = () => {
														const base64String = reader.result;
														updateMember(m.id, { profilePhoto: base64String });
													};
													reader.readAsDataURL(file);
												}
											}
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Name" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: name,
											onChange: (e) => setName(e.target.value),
											placeholder: "Name"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Mobile" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: mobile,
											onChange: (e) => setMobile(e.target.value),
											placeholder: "Mobile"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "WhatsApp" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: whatsapp,
											onChange: (e) => setWhatsapp(e.target.value),
											placeholder: "WhatsApp"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "border-t pt-4 mt-4",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
													className: "font-semibold text-slate-900 mb-3",
													children: "Nominee Information"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Nominee Full Name" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													value: nomineeName,
													onChange: (e) => setNomineeName(e.target.value),
													placeholder: "Nominee Name"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													className: "mt-3",
													children: "Nominee Address"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													value: nomineeAddress,
													onChange: (e) => setNomineeAddress(e.target.value),
													placeholder: "Nominee Address"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													className: "mt-3",
													children: "Nominee Contact Number"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													value: nomineeContact,
													onChange: (e) => setNomineeContact(e.target.value),
													placeholder: "+974..."
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											onClick: () => {
												updateMember(m.id, {
													name,
													mobile,
													whatsapp,
													nomineeName,
													nomineeAddress,
													nomineeContact
												});
												setIsEditOpen(false);
												toast.success("Details updated.");
											},
											children: "Save Changes"
										})
									]
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
							open: isChooseCollectorOpen,
							onOpenChange: setIsChooseCollectorOpen,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
								asChild: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									className: "ml-2",
									children: "Choose Collector"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Select Your Collector" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Available Collectors" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										value: selectedCollectorId,
										onChange: (e) => setSelectedCollectorId(e.target.value),
										className: "w-full border rounded-md p-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "",
											children: "Select a collector..."
										}), state.admins.filter((a) => a.role === "collector").map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: c.id,
											children: c.name
										}, c.id))]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										onClick: () => {
											if (!selectedCollectorId) {
												toast.error("Please select a collector");
												return;
											}
											const collector = state.admins.find((a) => a.id === selectedCollectorId);
											if (collector) {
												reassignMemberToCollector(m.id, collector);
												setIsChooseCollectorOpen(false);
												toast.success(`Assigned to collector: ${collector.name}`);
											}
										},
										children: "Confirm Selection"
									})
								]
							})] })]
						})
					]
				})
			}),
			delinquent && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				className: "mb-6 border-red-300 bg-red-50 p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "mt-0.5 h-5 w-5 text-red-600" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-bold text-red-800",
						children: "Subject to membership termination by committee review."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1 text-sm text-red-700",
						children: [
							"You have ",
							missed,
							" missed monthly deposits. Please settle outstanding dues immediately."
						]
					})] })]
				})
			}),
			canLogPayment && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "p-5 mb-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-3 font-semibold text-slate-900",
					children: isCollector ? "My Registered Members · Log Payment" : "Log My Payment"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "grid gap-3 sm:grid-cols-4 mb-6",
					onSubmit: (e) => {
						e.preventDefault();
						const memberId = (isCollector ? document.getElementById("m-id")?.value : m.id) ?? "";
						if (!memberId) return;
						const month = document.getElementById("m-month").value;
						const amount = parseInt(document.getElementById("m-amount").value) || 0;
						if (state.transactions.some((t) => t.memberId === memberId && t.monthKey === month && t.type === "monthly")) {
							toast.error(`Payment for this month already exists.`);
							return;
						}
						logPayment({
							memberId,
							adminId: m.adminId || "",
							type: "monthly",
							monthKey: month,
							amount
						});
						toast.success(`Payment pending approval by collector.`);
					},
					children: [
						isCollector && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "sm:col-span-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								id: "m-id",
								className: "w-full border rounded p-2",
								children: state.members.filter((mem) => mem.adminId === m.id || mem.adminId && state.admins.find((a) => a.id === mem.adminId)?.name === m.name || m.name && mem.collectorName && mem.collectorName.trim().toLowerCase() === m.name.trim().toLowerCase()).map((mem) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
									value: mem.id,
									children: [
										mem.name,
										" (",
										mem.collectorName || "No Collector",
										")"
									]
								}, mem.id))
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							id: "m-month",
							defaultValue: monthKey(/* @__PURE__ */ new Date()),
							className: "w-full border rounded p-2",
							children: months.map((mk) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: mk,
								children: fmtMonthKey(mk)
							}, mk))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "m-amount",
							required: true,
							type: "number",
							defaultValue: "100"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							className: isCollector ? "" : "sm:col-span-2",
							children: "Submit Payment"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 md:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "h-4 w-4" }),
						label: "Total Contributed",
						value: fmt(balance)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Briefcase, { className: "h-4 w-4" }),
						label: "Active Invested Capital (yours)",
						value: fmt(activeCapital)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "h-4 w-4" }),
						label: "Profit Share Earned",
						value: fmt(profit)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 grid gap-6 lg:grid-cols-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "p-5 lg:col-span-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-3 flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-semibold text-slate-900",
								children: "Monthly Contribution Tracker"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs text-slate-500",
								children: "Due by the 15th · 100"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-6 gap-2 sm:grid-cols-12",
							children: months.map((mk) => {
								const paid = memberMonthlyPaid(m.id, mk);
								const [year, month] = mk.split("-");
								const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString(void 0, { month: "short" });
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: `rounded-md border p-2 text-center text-xs transition-colors ${paid ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-500"}`,
									title: fmtMonthKey(mk),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "font-mono text-[10px] opacity-70",
											children: monthName
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "font-mono text-[9px] opacity-60",
											children: year.slice(2)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-0.5 font-semibold",
											children: paid ? "✓" : "—"
										})
									]
								}, mk);
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 text-xs text-slate-500",
							children: [missed, " missed months since joining."]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mb-3 font-semibold text-slate-900",
							children: "Your Business Stakes"
						}),
						myStakes.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-sm text-slate-500",
							children: "You have no active investment stakes yet."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-3",
							children: myStakes.map((s) => {
								const inv = state.investments.find((i) => i.id === s.investmentId);
								if (!inv) return null;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-md border border-slate-200 p-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "font-medium text-slate-900",
												children: inv.name
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
												className: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
												children: [s.sharePct, "%"]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-xs text-emerald-700",
											children: ["Investing in: ", inv.name]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-1 text-xs text-slate-500",
											children: inv.description
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-2 flex justify-between text-xs",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-slate-500",
												children: [
													"Your capital:",
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-semibold text-slate-900",
														children: fmt(inv.capitalDeployed * s.sharePct / 100)
													})
												]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-emerald-700",
												children: [
													"Profit:",
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-semibold",
														children: fmt(inv.profitEntries.reduce((p, e) => p + e.amount, 0) * s.sharePct / 100)
													})
												]
											})]
										})
									]
								}, s.investmentId);
							})
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-6 p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-3 font-semibold text-slate-900",
					children: "Your Payment History"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Receipt No." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Type" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Month" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Paid" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
							className: "text-right",
							children: "Amount"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Status" })
					] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableBody, { children: [myTx.map((t) => {
						state.admins.find((a) => a.id === t.adminId);
						const statusLabel = t.status === "held_by_collector" ? `Held by Collector (${m.collectorName || "Unknown"})` : t.status === "held_by_admin" ? "Held by Admin" : "Confirmed";
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "font-mono text-xs",
								children: t.receiptNo
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: "outline",
								className: t.type === "registration" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-800",
								children: t.type
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: t.monthKey ?? "—" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: fmtDate(t.paidAt) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "text-right font-semibold",
								children: fmt(t.amount)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: t.status === "held_by_collector" ? "secondary" : "default",
								children: statusLabel
							}) })
						] }, t.id);
					}), myTx.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						colSpan: 6,
						className: "text-center text-sm text-slate-500",
						children: "No payments logged yet."
					}) })] })] })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PublicAnalytics, {})
			})
		]
	});
}
function StatCard({ icon, label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: "border-slate-200 p-5 transition-shadow hover:shadow-md",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 text-emerald-700",
			children: [icon, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs font-medium uppercase tracking-wide",
				children: label
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-2 text-3xl font-bold text-slate-900",
			children: value
		})]
	});
}
var AlertDialog = Root2;
var AlertDialogPortal = Portal2;
var AlertDialogOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Overlay2, {
	className: cn("fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props,
	ref
}));
AlertDialogOverlay.displayName = Overlay2.displayName;
var AlertDialogContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
	ref,
	className: cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg", className),
	...props
})] }));
AlertDialogContent.displayName = Content2.displayName;
var AlertDialogHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-2 text-center sm:text-left", className),
	...props
});
AlertDialogHeader.displayName = "AlertDialogHeader";
var AlertDialogFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
AlertDialogFooter.displayName = "AlertDialogFooter";
var AlertDialogTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Title2, {
	ref,
	className: cn("text-lg font-semibold", className),
	...props
}));
AlertDialogTitle.displayName = Title2.displayName;
var AlertDialogDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Description2, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
AlertDialogDescription.displayName = Description2.displayName;
var AlertDialogAction = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Action, {
	ref,
	className: cn(buttonVariants(), className),
	...props
}));
AlertDialogAction.displayName = Action.displayName;
var AlertDialogCancel = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cancel, {
	ref,
	className: cn(buttonVariants({ variant: "outline" }), "mt-2 sm:mt-0", className),
	...props
}));
AlertDialogCancel.displayName = Cancel.displayName;
var PrintableReport = ({ state }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "hidden print:block p-8",
		id: "printable-report",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
                @media print {
                    @page { size: A4; margin: 20mm; }
                    body * { visibility: hidden; }
                    #printable-report, #printable-report * { visibility: visible; }
                    #printable-report { position: absolute; left: 0; top: 0; width: 100%; }
                }
            ` }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-bold mb-4",
				children: "Ameen Community Fund - Member Report"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm mb-6",
				children: ["Generated on: ", (/* @__PURE__ */ new Date()).toLocaleDateString()]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Member" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Collector" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Mobile" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
					className: "text-right",
					children: "Total Collected"
				})
			] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: state.members.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: m.name }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: m.collectorName }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: m.mobile }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					className: "text-right font-semibold",
					children: fmt(state.transactions.filter((t) => t.memberId === m.id && t.approved).reduce((sum, t) => sum + t.amount, 0))
				})
			] }, m.id)) })] })
		]
	});
};
function AdminDashboard() {
	const { state, currentAdmin, logPayment, addInvestment, updateInvestment, approvePayment, memberMonthlyPaid, renameMember, updateMember, reassignMemberToCollector, updateAdmin, memberProfitShare, memberActiveInvestedCapital, addCollector, removeCollector, removeMember, addExpense, deleteExpense } = useAppState();
	const a = currentAdmin();
	a?.role;
	const [mkInput, setMkInput] = (0, import_react.useState)(monthKey(/* @__PURE__ */ new Date()));
	const [invName, setInvName] = (0, import_react.useState)("");
	const [invDesc, setInvDesc] = (0, import_react.useState)("");
	const [invCap, setInvCap] = (0, import_react.useState)("");
	const [invProfit, setInvProfit] = (0, import_react.useState)("");
	const [colName, setColName] = (0, import_react.useState)("");
	const [colMobile, setColMobile] = (0, import_react.useState)("");
	const [colWhatsapp, setColWhatsapp] = (0, import_react.useState)("");
	const [editingInv, setEditingInv] = (0, import_react.useState)(null);
	const [editingTx, setEditingTx] = (0, import_react.useState)(null);
	const [editAmount, setEditAmount] = (0, import_react.useState)("");
	const [editingMember, setEditingMember] = (0, import_react.useState)(null);
	const [memberForm, setMemberForm] = (0, import_react.useState)({
		name: "",
		mobile: "",
		whatsapp: "",
		password: "",
		collectorName: "",
		nomineeName: "",
		nomineeAddress: "",
		nomineeContact: ""
	});
	const [editingCollector, setEditingCollector] = (0, import_react.useState)(null);
	const [collectorForm, setCollectorForm] = (0, import_react.useState)({
		name: "",
		mobile: "",
		whatsapp: ""
	});
	const [memberToRemove, setMemberToRemove] = (0, import_react.useState)(null);
	const [expensesOpen, setExpensesOpen] = (0, import_react.useState)(false);
	const [expenseForm, setExpenseForm] = (0, import_react.useState)({
		description: "",
		amount: "",
		category: "Operations",
		notes: ""
	});
	const myMembers = (0, import_react.useMemo)(() => {
		if (!a) return [];
		return state.members.filter((m) => m.adminId === a.id || m.collectorName && a.name && m.collectorName.trim().toLowerCase() === a.name.trim().toLowerCase());
	}, [state.members, a]);
	const allMembers = state.members;
	const pendingApprovals = (0, import_react.useMemo)(() => {
		if (a?.role !== "admin" && a?.role !== "collector") return [];
		if (a.role === "admin") return state.transactions.filter((t) => !t.approved && (t.status === "held_by_admin" || t.status === "held_by_collector"));
		return state.transactions.filter((t) => {
			if (t.approved || t.status !== "held_by_collector") return false;
			const member = state.members.find((m) => m.id === t.memberId);
			return t.adminId === a.id || member?.collectorName && member.collectorName.trim().toLowerCase() === a.name.trim().toLowerCase();
		});
	}, [
		state.transactions,
		a,
		state.members
	]);
	const collectedByMember = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		for (const t of state.transactions.filter((t) => !t.approved)) map.set(t.memberId, (map.get(t.memberId) ?? 0) + t.amount);
		return map;
	}, [state.transactions]);
	const recentReceipts = (0, import_react.useMemo)(() => state.transactions.filter((t) => t.adminId === a?.id || a?.role === "admin").sort((x, y) => x.paidAt < y.paidAt ? 1 : -1).slice(0, 15), [state.transactions, a]);
	if (!a) return null;
	const submitInvestment = (e) => {
		e.preventDefault();
		if (!invName || !invCap) return;
		if (editingInv) {
			updateInvestment(editingInv.id, {
				...editingInv,
				name: invName,
				description: invDesc,
				capitalDeployed: parseFloat(invCap)
			});
			toast.success(`Updated investment: ${invName}`);
			setEditingInv(null);
		} else {
			addInvestment({
				name: invName,
				description: invDesc,
				capitalDeployed: parseFloat(invCap)
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
		const newCollector = state.admins.find((a) => a.name === memberForm.collectorName);
		if (newCollector) {
			reassignMemberToCollector(editingMember.id, newCollector);
			updateMember(editingMember.id, {
				name: memberForm.name,
				mobile: memberForm.mobile,
				whatsapp: memberForm.whatsapp,
				password: memberForm.password,
				nomineeName: memberForm.nomineeName,
				nomineeAddress: memberForm.nomineeAddress,
				nomineeContact: memberForm.nomineeContact
			});
		} else updateMember(editingMember.id, memberForm);
		toast.success("Member details and transactions updated");
		setEditingMember(null);
	};
	const handleCollectorUpdate = () => {
		if (!editingCollector) return;
		updateAdmin(editingCollector.id, collectorForm);
		toast.success("Collector details updated");
		setEditingCollector(null);
	};
	const MemberTable = ({ members, title }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: "p-5 mb-6 mt-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex items-center justify-between mb-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-semibold text-slate-900",
				children: title
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Member" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Collector" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "ID" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Mobile" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "WhatsApp" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Password" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Actions" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
				className: "text-right",
				children: "Held"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
				className: "text-right",
				children: "Invested"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
				className: "text-right",
				children: "Profit Earned"
			})
		] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: members.map((m) => {
			memberMonthlyPaid(m.id, mkInput);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-medium text-slate-900 cursor-pointer hover:underline",
						children: m.name
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-h-[80vh] overflow-y-auto",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Member Profile" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-4",
							children: [m.profilePhoto ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: m.profilePhoto,
								alt: "Profile",
								className: "w-20 h-20 rounded-full object-cover flex-shrink-0"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0",
								children: "No Photo"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "text-xl font-bold",
										children: m.name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-slate-600 font-mono text-sm",
										children: ["ID: ", m.memberId]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-slate-600",
										children: ["Mobile: ", m.mobile]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-slate-600",
										children: ["WhatsApp: ", m.whatsapp]
									})
								]
							})]
						}), m.nomineeName && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "border-t pt-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
								className: "font-semibold text-slate-900 mb-2",
								children: "Nominee Information"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1 text-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-medium text-slate-700",
											children: "Name:"
										}),
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-slate-600",
											children: m.nomineeName
										})
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-medium text-slate-700",
											children: "Address:"
										}),
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-slate-600",
											children: m.nomineeAddress
										})
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-medium text-slate-700",
											children: "Contact:"
										}),
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-slate-600",
											children: m.nomineeContact
										})
									] })
								]
							})]
						})]
					})]
				})] }) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: m.collectorName || "—" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					className: "font-mono text-xs",
					children: m.memberId
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					className: "font-mono text-xs",
					children: m.mobile
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					className: "font-mono text-xs",
					children: m.whatsapp
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					className: "font-mono text-xs",
					children: m.password
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "sm",
						onClick: () => {
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
						},
						children: "Edit"
					}), a.role === "admin" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "destructive",
						size: "sm",
						onClick: () => setMemberToRemove(m),
						children: "Remove"
					})]
				}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					className: "text-right font-semibold",
					children: fmt(state.transactions.filter((t) => t.memberId === m.id && t.approved === true).reduce((sum, t) => sum + t.amount, 0))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					className: "text-right font-semibold",
					children: fmt(memberActiveInvestedCapital(m.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					className: "text-right font-semibold text-emerald-600",
					children: fmt(memberProfitShare(m.id))
				})
			] }, m.id);
		}) })] })]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: `${a.name} · ${a.role === "admin" ? "Admin" : "Collector"} Console`,
		subtitle: a.role === "admin" ? "Log received payments, review your ledger, and transfer to the Core Treasurer." : "Log received payments, review your ledger, and transfer to the Admin.",
		children: [
			(a.role === "admin" || a.role === "collector") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "p-5 mb-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-3 font-semibold text-slate-900",
					children: "Pending Approvals"
				}), pendingApprovals.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Receipt" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Member" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Collector" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Amount" }),
					a.role === "collector" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Action" })
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: pendingApprovals.map((t) => {
					const m = state.members.find((x) => x.id === t.memberId);
					const c = state.admins.find((x) => x.id === t.adminId);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: t.receiptNo }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-medium",
							children: m?.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-mono text-xs text-slate-500",
							children: m?.memberId
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: c?.name ? `${c.name} (Collector)` : "—" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: a.role === "collector" && editingTx === t.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "number",
							value: editAmount,
							onChange: (e) => setEditAmount(e.target.value),
							className: "w-16 rounded border p-1 text-sm"
						}) : fmt(t.amount) }),
						a.role === "collector" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: editingTx === t.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "default",
							onClick: () => {
								approvePayment(t.id, editAmount ? parseInt(editAmount) : void 0);
								setEditingTx(null);
								toast.success("Payment approved");
							},
							children: "✓"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "outline",
							onClick: () => setEditingTx(null),
							children: "✕"
						})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							onClick: () => {
								setEditingTx(t.id);
								setEditAmount(t.amount.toString());
							},
							children: "Approve"
						}) })
					] }, t.id);
				}) })] }) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-sm text-slate-500",
					children: "No pending approvals."
				})]
			}),
			a.role === "admin" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "p-5 mb-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-4 text-xs font-semibold uppercase text-blue-800",
						children: "Admin: Manage Collectors"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Promote Member to Collector" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							className: "w-full rounded-md border p-2",
							onChange: (e) => {
								const memberId = e.target.value;
								if (memberId) {
									const m = state.members.find((x) => x.id === memberId);
									const alreadyCollector = state.admins.find((a) => a.name === m?.name && a.role === "collector");
									if (m) if (alreadyCollector) toast.error(`${m.name} is already a collector`);
									else {
										addCollector({
											name: m.name,
											mobile: m.mobile,
											whatsapp: m.whatsapp
										});
										toast.success(`Promoted ${m.name} to collector`);
									}
									e.target.value = "";
								}
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "Select a member to promote..."
							}), state.members.filter((m) => !state.admins.some((a) => a.name === m.name && a.role === "collector")).map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: m.id,
								children: m.name
							}, m.id))]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-2",
						children: state.admins.filter((admin) => admin.role === "collector").map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								children: c.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "destructive",
								size: "sm",
								onClick: () => removeCollector(c.id),
								children: "×"
							})]
						}, c.id))
					})
				]
			}),
			a.role === "admin" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => window.print(),
					children: "Print Member Report"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrintableReport, { state })]
			}),
			a.role === "admin" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MemberTable, {
				members: allMembers,
				title: "All Registered Members"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MemberTable, {
				members: myMembers,
				title: "My Registered Members"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: !!editingMember,
				onOpenChange: (open) => !open && setEditingMember(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-h-[80vh] overflow-y-auto w-full max-w-md",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Edit Member Details" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4 py-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: memberForm.name,
									onChange: (e) => setMemberForm({
										...memberForm,
										name: e.target.value
									}),
									placeholder: "Full name"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Mobile" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: memberForm.mobile,
									onChange: (e) => setMemberForm({
										...memberForm,
										mobile: e.target.value
									}),
									placeholder: "Mobile number"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "WhatsApp" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: memberForm.whatsapp,
									onChange: (e) => setMemberForm({
										...memberForm,
										whatsapp: e.target.value
									}),
									placeholder: "WhatsApp number"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Password" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: memberForm.password,
									onChange: (e) => setMemberForm({
										...memberForm,
										password: e.target.value
									}),
									placeholder: "Password"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Collector" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									value: memberForm.collectorName,
									onChange: (e) => setMemberForm({
										...memberForm,
										collectorName: e.target.value
									}),
									className: "w-full rounded-md border p-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "",
										children: "Select a Collector"
									}), state.admins.filter((a) => a.role === "collector").map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: c.name,
										children: c.name
									}, c.id))]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "border-t pt-4 mt-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: "font-semibold mb-3 block",
										children: "Nominee Information"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "nomineeName",
											children: "Nominee Name"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "nomineeName",
											value: memberForm.nomineeName,
											onChange: (e) => setMemberForm({
												...memberForm,
												nomineeName: e.target.value
											}),
											placeholder: "Full name"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2 mt-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "nomineeAddress",
											children: "Nominee Address"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "nomineeAddress",
											value: memberForm.nomineeAddress,
											onChange: (e) => setMemberForm({
												...memberForm,
												nomineeAddress: e.target.value
											}),
											placeholder: "Address"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2 mt-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "nomineeContact",
											children: "Nominee Contact"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "nomineeContact",
											value: memberForm.nomineeContact,
											onChange: (e) => setMemberForm({
												...memberForm,
												nomineeContact: e.target.value
											}),
											placeholder: "Contact number"
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								onClick: handleMemberUpdate,
								className: "w-full mt-4",
								children: "Save Changes"
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: !!editingCollector,
				onOpenChange: (open) => !open && setEditingCollector(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Edit Collector Details" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4 py-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-4 items-center gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-right",
								children: "Name"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: collectorForm.name,
								onChange: (e) => setCollectorForm({
									...collectorForm,
									name: e.target.value
								}),
								className: "col-span-3"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-4 items-center gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-right",
								children: "Mobile"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: collectorForm.mobile,
								onChange: (e) => setCollectorForm({
									...collectorForm,
									mobile: e.target.value
								}),
								className: "col-span-3"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-4 items-center gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-right",
								children: "WhatsApp"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: collectorForm.whatsapp,
								onChange: (e) => setCollectorForm({
									...collectorForm,
									whatsapp: e.target.value
								}),
								className: "col-span-3"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: handleCollectorUpdate,
							children: "Save Changes"
						})
					]
				})] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
				open: !!memberToRemove,
				onOpenChange: (open) => !open && setMemberToRemove(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTitle, { children: "Remove Member" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogDescription, { children: [
					"Are you sure you want to remove ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-semibold",
						children: memberToRemove?.name
					}),
					" (",
					memberToRemove?.memberId,
					")? This action will delete all associated transactions and records. This cannot be undone."
				] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-3 justify-end",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, { children: "Cancel" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
						onClick: () => {
							if (memberToRemove) {
								removeMember(memberToRemove.id);
								toast.success(`Removed member: ${memberToRemove.name}`);
								setMemberToRemove(null);
							}
						},
						className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
						children: "Remove"
					})]
				})] })
			}),
			a.role === "admin" && (() => {
				const allCollectors = state.admins.filter((admin) => admin.role === "collector");
				const grandTotal = allCollectors.reduce((sum, collector) => {
					return sum + state.members.filter((m) => m.collectorName && m.collectorName.trim().toLowerCase() === collector.name.trim().toLowerCase()).reduce((acc, m) => acc + (collectedByMember.get(m.id) ?? 0), 0);
				}, 0);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [allCollectors.map((collector) => {
					const collectorMembers = state.members.filter((m) => m.collectorName && m.collectorName.trim().toLowerCase() === collector.name.trim().toLowerCase());
					const collectorTotal = collectorMembers.reduce((sum, m) => sum + (collectedByMember.get(m.id) ?? 0), 0);
					const collectorId = state.admins.find((ad) => ad.name === collector.name)?.id;
					const collectorTransactions = state.transactions.filter((t) => {
						if (t.approved || t.status !== "held_by_collector") return false;
						const member = state.members.find((m) => m.id === t.memberId);
						return t.adminId === collectorId || member?.collectorName && member.collectorName.trim().toLowerCase() === collector.name.trim().toLowerCase();
					});
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-6 border rounded-lg p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between items-center mb-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-bold text-lg",
									children: collector.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "font-bold text-emerald-700",
										children: ["Total: ", fmt(collectorTotal)]
									}), collectorTransactions.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										className: "bg-emerald-600 hover:bg-emerald-700",
										onClick: () => {
											collectorTransactions.forEach((t) => {
												approvePayment(t.id);
											});
											toast.success(`Approved all payments for ${collector.name}`);
										},
										children: "Approve All"
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Member" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "ID" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Mobile" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Month" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "text-right",
									children: "Held"
								})
							] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: collectorMembers.map((m) => {
								const memberTransactions = state.transactions.filter((t) => t.memberId === m.id && !t.approved);
								const months = [...new Set(memberTransactions.map((t) => t.monthKey || "N/A"))].map((mk) => fmtMonthKey(mk)).join(", ");
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: m.name }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										className: "font-mono text-xs",
										children: m.memberId
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: m.mobile }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										className: "text-sm text-slate-600",
										children: months || "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										className: "text-right",
										children: fmt(collectedByMember.get(m.id) ?? 0)
									})
								] }, m.id);
							}) })] }),
							(() => {
								const collectorId = state.admins.find((ad) => ad.name === collector.name)?.id;
								const collectorAdminApprovals = state.transactions.filter((t) => {
									if (t.approved || t.status !== "held_by_admin") return false;
									const member = state.members.find((m) => m.id === t.memberId);
									return t.adminId === collectorId || member?.collectorName && member.collectorName.trim().toLowerCase() === collector.name.trim().toLowerCase();
								});
								return collectorAdminApprovals.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-4 text-right",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										className: "bg-emerald-600 hover:bg-emerald-700",
										onClick: () => {
											collectorAdminApprovals.forEach((t) => {
												approvePayment(t.id);
											});
											toast.success(`Approved all payments for ${collector.name}`);
										},
										children: "Approve All"
									})
								}) : null;
							})()
						]
					}, collector.id);
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					className: "p-4 mb-6 bg-emerald-50 border-2 border-emerald-200",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between items-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-bold text-lg text-emerald-900",
							children: "All Collectors Total"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-bold text-2xl text-emerald-700",
							children: fmt(grandTotal)
						})]
					})
				})] });
			})(),
			a.role === "admin" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				className: "p-5 mb-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-4 rounded-md border border-amber-200 bg-amber-50 p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-2 text-xs font-semibold uppercase text-amber-800",
						children: "Admin: Manage Official Expenses"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3",
						children: [state.expenses.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs font-semibold text-amber-900 mb-2",
									children: "Recent Expenses"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Description" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Category" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Date" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
										className: "text-right",
										children: "Amount"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Added By" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Action" })
								] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: state.expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((exp) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: exp.description }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: exp.category }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: fmtDate(exp.date) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										className: "text-right font-semibold",
										children: fmt(exp.amount)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: exp.addedBy }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "destructive",
										onClick: () => {
											deleteExpense(exp.id);
											toast.success("Expense deleted");
										},
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
									}) })
								] }, exp.id)) })] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 text-right font-bold text-amber-900",
									children: ["Total Expenses: ", fmt(state.expenses.reduce((sum, e) => sum + e.amount, 0))]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							onSubmit: (e) => {
								e.preventDefault();
								if (!expenseForm.description || !expenseForm.amount) {
									toast.error("Please fill in all required fields");
									return;
								}
								addExpense({
									description: expenseForm.description,
									amount: parseFloat(expenseForm.amount),
									category: expenseForm.category,
									notes: expenseForm.notes
								});
								setExpenseForm({
									description: "",
									amount: "",
									category: "Operations",
									notes: ""
								});
								toast.success("Expense added successfully");
							},
							className: "grid gap-2 border-t pt-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Description" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: expenseForm.description,
									onChange: (e) => setExpenseForm({
										...expenseForm,
										description: e.target.value
									}),
									placeholder: "e.g., Office supplies, Event venue, etc.",
									required: true
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Category" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										value: expenseForm.category,
										onChange: (e) => setExpenseForm({
											...expenseForm,
											category: e.target.value
										}),
										className: "w-full border rounded p-2 text-sm",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "Operations",
												children: "Operations"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "Maintenance",
												children: "Maintenance"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "Event",
												children: "Event"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "Administrative",
												children: "Administrative"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "Other",
												children: "Other"
											})
										]
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Amount (QR)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "number",
										value: expenseForm.amount,
										onChange: (e) => setExpenseForm({
											...expenseForm,
											amount: e.target.value
										}),
										placeholder: "0",
										required: true
									})] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Notes (Optional)" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: expenseForm.notes,
									onChange: (e) => setExpenseForm({
										...expenseForm,
										notes: e.target.value
									}),
									placeholder: "Additional details..."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "submit",
									className: "bg-amber-600 hover:bg-amber-700",
									children: "Add Expense"
								})
							]
						})]
					})]
				})
			}),
			a.role === "admin" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				className: "p-5 mb-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-4 rounded-md border border-blue-200 bg-blue-50 p-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-2 text-xs font-semibold uppercase text-blue-800",
							children: "Admin: Manage Investments"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-4 grid gap-2",
							children: state.investments.map((inv) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between gap-2 rounded-md border bg-white p-2 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: inv.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "outline",
										size: "sm",
										onClick: () => {
											setEditingInv(inv);
											setInvName(inv.name);
											setInvDesc(inv.description);
											setInvCap(inv.capitalDeployed.toString());
										},
										children: "Edit"
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Edit Investment" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
									onSubmit: submitInvestment,
									className: "grid gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											placeholder: "Name",
											value: invName,
											onChange: (e) => setInvName(e.target.value),
											className: "rounded-md border p-2"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											placeholder: "Description",
											value: invDesc,
											onChange: (e) => setInvDesc(e.target.value),
											className: "rounded-md border p-2"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "number",
											placeholder: "Capital Deployed",
											value: invCap,
											onChange: (e) => setInvCap(e.target.value),
											className: "rounded-md border p-2"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-sm font-semibold text-slate-700",
											children: "Profit Entries:"
										}),
										editingInv?.profitEntries.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-sm",
											children: [
												new Date(p.date).toLocaleDateString(),
												": ",
												fmt(p.amount)
											]
										}, p.id)),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "number",
											placeholder: "New Profit Amount",
											value: invProfit,
											onChange: (e) => setInvProfit(e.target.value),
											className: "rounded-md border p-2"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											onClick: () => {
												const newEntry = {
													id: crypto.randomUUID(),
													amount: parseFloat(invProfit),
													date: (/* @__PURE__ */ new Date()).toISOString()
												};
												updateInvestment(editingInv.id, {
													...editingInv,
													profitEntries: [...editingInv.profitEntries, newEntry]
												});
												setEditingInv({
													...editingInv,
													profitEntries: [...editingInv.profitEntries, newEntry]
												});
												setInvProfit("");
												toast.success("Added profit entry");
											},
											children: "Add Profit Entry"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "submit",
											children: "Update Investment"
										})
									]
								})] })] })]
							}, inv.id))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							onSubmit: submitInvestment,
							className: "grid grid-cols-2 gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									placeholder: "Name",
									value: invName,
									onChange: (e) => setInvName(e.target.value),
									className: "rounded-md border p-2 text-sm"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									placeholder: "Description",
									value: invDesc,
									onChange: (e) => setInvDesc(e.target.value),
									className: "rounded-md border p-2 text-sm"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "number",
									placeholder: "Capital Deployed",
									value: invCap,
									onChange: (e) => setInvCap(e.target.value),
									className: "rounded-md border p-2 text-sm"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "submit",
									className: "col-span-2 w-full",
									children: "Add Investment"
								})
							]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-6 lg:grid-cols-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-3 font-semibold text-slate-900",
						children: "Recent Receipts"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overflow-x-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Receipt" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Member" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Date" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Status" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "text-right",
								children: "Amount"
							})
						] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: recentReceipts.map((t) => {
							const m = state.members.find((x) => x.id === t.memberId);
							const statusLabel = t.status === "held_by_collector" ? `Held by Collector` : t.status === "held_by_admin" ? "Held by Admin" : "Confirmed";
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "font-mono text-xs",
									children: t.receiptNo
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: m?.name ?? "—" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: fmtDate(t.paidAt) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: t.status === "held_by_collector" ? "secondary" : "default",
									children: statusLabel
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "text-right font-semibold",
									children: fmt(t.amount)
								})
							] }, t.id);
						}) })] })
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PublicAnalytics, {})
			})
		]
	});
}
/**
* Developer-only floating panel to quickly switch identity/role for testing.
* Not part of the production experience.
*/
function RoleSwitcher() {
	const { state, setState, resetSeed, logout } = useAppState();
	const [open, setOpen] = (0, import_react.useState)(true);
	const setUser = (id, role) => {
		setState((s) => ({
			...s,
			currentUserId: id,
			currentRole: role
		}));
	};
	state.admins.find((a) => a.id === state.currentUserId)?.role;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed bottom-4 right-4 z-50 w-72",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
			className: "border-emerald-200 bg-white/95 shadow-xl backdrop-blur",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => setOpen((o) => !o),
				className: "flex w-full items-center justify-between rounded-t-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wrench, { className: "h-4 w-4" }), "Dev · Role Switcher"]
				}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { className: "h-4 w-4" })]
			}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3 p-3 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-1 text-xs font-medium text-slate-500",
						children: "Treasurers & Admins"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-1",
						children: state.admins.filter((a) => a.role === "admin").map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: state.currentUserId === a.id ? "default" : "outline",
							className: state.currentUserId === a.id ? "bg-emerald-600 hover:bg-emerald-700" : "",
							onClick: () => setUser(a.id, "admin"),
							children: a.name.split(" ")[0]
						}, a.id))
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-1 text-xs font-medium text-slate-500",
						children: "Collectors"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-1",
						children: state.admins.filter((a) => a.role === "collector").map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: state.currentUserId === a.id ? "default" : "outline",
							className: state.currentUserId === a.id ? "bg-sky-600 hover:bg-sky-700" : "border-sky-200 text-sky-800",
							onClick: () => setUser(a.id, "collector"),
							children: a.name.split(" ")[0]
						}, a.id))
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-1 text-xs font-medium text-slate-500",
						children: "Members"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-1",
						children: state.members.filter((m) => m.role !== "collector").map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: state.currentUserId === m.id ? "default" : "outline",
							className: state.currentUserId === m.id ? "bg-emerald-600 hover:bg-emerald-700" : "",
							onClick: () => setUser(m.id, "member"),
							children: [m.name.split(" ")[0], !m.registrationFeePaid && " ⏳"]
						}, m.id))
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2 pt-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "outline",
							className: "flex-1",
							onClick: logout,
							children: "Logout"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "outline",
							className: "flex-1 border-red-200 text-red-600 hover:bg-red-50",
							onClick: () => {
								if (confirm("Reset all local data to seed?")) resetSeed();
							},
							children: "Reset seed"
						})]
					})
				]
			})]
		})
	});
}
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
function Index() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppStateProvider, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Screen, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleSwitcher, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, {
			richColors: true,
			position: "top-right"
		})
	] });
}
function Screen() {
	const { state, currentMember, currentAdmin } = useAppState();
	if (!state.currentUserId) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Login, {});
	if (state.currentRole === "collector") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminDashboard, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MemberDashboard, {})]
	});
	if (state.currentRole === "admin" && currentAdmin()) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminDashboard, {});
	if (currentMember()) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MemberDashboard, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Login, {});
}
//#endregion
export { Index as component };
