import { getDoc } from '../lib/google-sheets';
import type { AppState, Transaction, User, Admin, Investment, MemberInvestmentStake, TreasurerTransfer, Expense } from '../types';

export async function GET() {
  try {
    const doc = await getDoc();
    const dataSheet = doc.sheetsByTitle['Data'];
    
    if (!dataSheet) {
      // No data yet, return empty state
      return new Response(JSON.stringify({
        success: true,
        data: {
          members: [],
          admins: [],
          transactions: [],
          investments: [],
          stakes: [],
          transfers: [],
          pendingSignups: [],
        }
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    }

    const rows = await dataSheet.getRows();
    
    // Organize data by type
    const members: User[] = [];
    const admins: Admin[] = [];
    const transactions: Transaction[] = [];
    const investments: Investment[] = [];
    const stakes: MemberInvestmentStake[] = [];
    const transfers: TreasurerTransfer[] = [];

    for (const row of rows) {
      const data = row.toObject();

      if (data.type === 'member' || (data.id && data.memberId && data.name && data.role === 'member')) {
        members.push({
          id: data.id,
          memberId: data.memberId,
          password: data.password,
          name: data.name,
          mobile: data.mobile || '',
          whatsapp: data.whatsapp || '',
          collectorName: data.collectorName || '',
          profilePhoto: data.profilePhoto,
          role: data.role,
          adminId: data.adminId,
          isCollector: data.isCollector,
          registrationFeePaid: data.registrationFeePaid === 'true' || data.registrationFeePaid === true,
          joinedAt: data.joinedAt,
        } as User);
      } else if (data.type === 'admin' || (data.id && data.name && (data.role === 'admin' || data.role === 'collector'))) {
        admins.push({
          id: data.id,
          name: data.name,
          role: data.role,
          mobile: data.mobile,
          whatsapp: data.whatsapp,
        } as Admin);
      } else if (data.type === 'transaction' || (data.id && data.memberId && data.type === 'registration' || data.type === 'monthly')) {
        transactions.push({
          id: data.id,
          memberId: data.memberId,
          adminId: data.adminId,
          type: data.type,
          amount: parseFloat(data.amount) || 0,
          monthKey: data.monthKey,
          paidAt: data.paidAt,
          receiptNo: data.receiptNo,
          status: data.status,
          transferredToTreasurer: data.transferredToTreasurer === 'true' || data.transferredToTreasurer === true,
          transferBatchId: data.transferBatchId,
          approved: data.approved === 'true' || data.approved === true,
        } as Transaction);
      } else if (data.type === 'investment' || (data.id && data.name && data.capitalDeployed !== undefined)) {
        const profitEntries = data.profitEntries ? JSON.parse(data.profitEntries) : [];
        investments.push({
          id: data.id,
          name: data.name,
          description: data.description,
          capitalDeployed: parseFloat(data.capitalDeployed) || 0,
          profitEntries,
          status: data.status || 'active',
        } as Investment);
      } else if (data.type === 'stake' || (data.memberId && data.investmentId && data.sharePct !== undefined)) {
        stakes.push({
          memberId: data.memberId,
          investmentId: data.investmentId,
          sharePct: parseFloat(data.sharePct) || 0,
        } as MemberInvestmentStake);
      } else if (data.type === 'transfer' || (data.id && data.adminId && data.transferredAt)) {
        const transactionIds = data.transactionIds ? (typeof data.transactionIds === 'string' ? JSON.parse(data.transactionIds) : data.transactionIds) : [];
        transfers.push({
          id: data.id,
          adminId: data.adminId,
          amount: parseFloat(data.amount) || 0,
          transferredAt: data.transferredAt,
          batchId: data.batchId,
          transactionIds,
        } as TreasurerTransfer);
      }
    }

    // Parse expenses
    const expenses: Expense[] = [];
    for (const row of rows) {
      const data = row.toObject();
      if (data.type === 'expense' || (data.id && data.description && data.amount && data.date && !data.memberId && !data.adminId)) {
        expenses.push({
          id: data.id,
          description: data.description,
          amount: parseFloat(data.amount) || 0,
          category: data.category || 'Other',
          date: data.date,
          addedBy: data.addedBy || 'Unknown',
          notes: data.notes,
        } as Expense);
      }
    }

    const responseData: Partial<AppState> = {
      members,
      admins,
      transactions,
      investments,
      stakes,
      transfers,
      expenses,
      pendingSignups: [],
    };

    return new Response(JSON.stringify({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('Error fetching data from Google Sheets:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch data from sheet' }), {
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      }
    });
  }
}