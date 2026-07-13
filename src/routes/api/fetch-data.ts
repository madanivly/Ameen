import { createFileRoute } from '@tanstack/react-router'
import { getDoc, getCachedData, setCachedData } from '../../lib/google-sheets'
import type { AppState, User, Admin, Transaction, Investment, MemberInvestmentStake, TreasurerTransfer, Expense } from '../../types'
import crypto from 'crypto'

export const Route = createFileRoute('/api/fetch-data')({
  server: {
    handlers: {
      GET: async () => {
        try {
          console.log("[FETCH-DATA] Attempting to fetch data...");
          const cached = getCachedData();
          if (cached) {
            console.log("[FETCH-DATA] Returning cached data.");
            return new Response(JSON.stringify(cached), {
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0',
              },
            });
          }
          console.log("[FETCH-DATA] No cached data found, fetching from Google Sheets.");

          const doc = await getDoc();
          if (!doc) {
            console.warn("[FETCH-DATA] Google Sheets not configured, returning empty data.");
            return new Response(JSON.stringify({
              success: true,
              data: { members: [], admins: [], transactions: [], investments: [], stakes: [], transfers: [], expenses: [], pendingSignups: [] }
            }), {
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0',
              },
            });
          }
          console.log("[FETCH-DATA] Google Sheets document loaded.");
          
          const dataSheet = doc.sheetsByTitle['Data'] || (await doc.addSheet({ title: 'Data' }));
          let adminsSheet = doc.sheetsByTitle['Admins'];
          if (!adminsSheet) {
            adminsSheet = await doc.addSheet({ title: 'Admins', headerValues: ['id', 'name', 'role', 'mobile', 'whatsapp', 'password'] });
          }
          console.log(`[FETCH-DATA] Data sheet found: ${!!dataSheet}, Admins sheet found: ${!!adminsSheet}`);

          const rows = dataSheet ? await dataSheet.getRows() : [];
          const adminRows = adminsSheet ? await adminsSheet.getRows() : [];
          console.log(`[FETCH-DATA] Fetched ${rows.length} data rows and ${adminRows.length} admin rows.`);

          const rawDataStrings: string[] = [];
          const members: User[] = [];
          const admins: Admin[] = [
            { id: 'admin', name: 'Admin', role: 'admin', password: 'admin', mobile: '', whatsapp: '' }
          ];
          const transactions: Transaction[] = [];
          const investments: Investment[] = [];
          const stakes: MemberInvestmentStake[] = [];
          const transfers: TreasurerTransfer[] = [];

          for (const row of adminRows) {
            const data = row.toObject();
            rawDataStrings.push(JSON.stringify(data));
            admins.push({
              id: data.id,
              name: data.name,
              role: data.role,
              mobile: data.mobile,
              whatsapp: data.whatsapp,
              password: data.password,
            } as Admin);
          }
          console.log(`[FETCH-DATA] Processed ${admins.length} admins.`);

          for (const row of rows) {
            const data = row.toObject();
            rawDataStrings.push(JSON.stringify(data));

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
            } else if (data.type === 'transaction' || (data.id && data.memberId && (data.type === 'registration' || data.type === 'monthly'))) {
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
          console.log(`[FETCH-DATA] Processed ${members.length} members, ${transactions.length} transactions, ${investments.length} investments, ${stakes.length} stakes, ${transfers.length} transfers.`);

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
          console.log(`[FETCH-DATA] Processed ${expenses.length} expenses.`);

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

          rawDataStrings.push(JSON.stringify(responseData));
          const contentHash = crypto.createHash('md5').update(rawDataStrings.join('|')).digest('hex');
          const etag = `"${contentHash}"`;

          const finalResponse = {
            success: true,
            data: responseData,
            timestamp: new Date().toISOString(),
            etag,
          };

          setCachedData(finalResponse);
          console.log("[FETCH-DATA] Data fetched and cached successfully.");

          return new Response(JSON.stringify(finalResponse), {
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
              'Pragma': 'no-cache',
              'Expires': '0',
              'ETag': etag,
            },
          });
        } catch (error) {
          console.error('[FETCH-DATA] Error fetching data from Google Sheets:', error);
          return new Response(JSON.stringify({
            success: false,
            error: 'Failed to fetch data from sheet',
            details: String(error),
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
          });
        }
      },
    },
  },
})