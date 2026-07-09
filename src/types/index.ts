// Core data types for Ameen Portal

export type Role = "member" | "admin" | "collector";

export interface User {
  id: string; // The username (e.g. 202601)
  memberId: string; // The same as id
  password: string; // Random 8 numbers
  name: string;
  mobile: string;
  whatsapp: string;
  collectorName: string;
  profilePhoto?: string;
  role: Role;
  adminId?: string; // assigned collector (for members)
  isCollector?: boolean;
  registrationFeePaid: boolean;
  joinedAt: string; // ISO date
}

export interface Admin {
  id: string;
  name: string;
  role: Role;
  mobile?: string;
  whatsapp?: string;
}

export type TransactionStatus = "held_by_collector" | "held_by_admin" | "confirmed";

export interface Transaction {
  id: string;
  memberId: string;
  adminId?: string;
  type: "registration" | "monthly";
  amount: number; // QR
  monthKey?: string; // e.g. "2026-07" for monthly
  paidAt: string; // ISO
  receiptNo: string;
  status: TransactionStatus;
  transferredToTreasurer: boolean;
  transferBatchId?: string;
  approved?: boolean;
}

export interface ProfitEntry {
  id: string;
  amount: number;
  date: string; // ISO
}

export interface Investment {
  id: string;
  name: string;
  description: string;
  capitalDeployed: number; // total QR
  profitEntries: ProfitEntry[]; // list of periodic profits
  status: "active" | "closed";
}

export interface MemberInvestmentStake {
  memberId: string;
  investmentId: string;
  sharePct: number; // 0-100
}

export interface TreasurerTransfer {
  id: string;
  adminId: string;
  amount: number;
  transferredAt: string; // ISO
  batchId: string;
  transactionIds: string[];
}

export interface AppState {
  currentUserId: string | null; // logged-in email/id
  currentRole: Role; // dev role switcher
  members: User[];
  admins: Admin[];
  transactions: Transaction[];
  investments: Investment[];
  stakes: MemberInvestmentStake[];
  transfers: TreasurerTransfer[];
  pendingSignups: { name: string; joinedAt: string }[];
}
