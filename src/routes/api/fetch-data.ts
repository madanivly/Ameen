import { createFileRoute } from '@tanstack/react-router'
import pool from '../../lib/database'
import type { AppState } from '../../types'

export const Route = createFileRoute('/api/fetch-data')({
  server: {
    handlers: {
      GET: async () => {
        try {
          console.log("[FETCH-DATA] Attempting to fetch data from MySQL...");
          const connection = await pool.getConnection();
          try {
            const [members] = await connection.query('SELECT * FROM members');
            const [admins] = await connection.query('SELECT * FROM admins');
            const [transactions] = await connection.query('SELECT * FROM transactions');
            const [investments] = await connection.query('SELECT * FROM investments');
            const [stakes] = await connection.query('SELECT * FROM stakes');
            const [transfers] = await connection.query('SELECT * FROM transfers');
            const [expenses] = await connection.query('SELECT * FROM expenses');

            const responseData: Partial<AppState> = {
              members: members as any,
              admins: admins as any,
              transactions: transactions as any,
              investments: investments as any,
              stakes: stakes as any,
              transfers: transfers as any,
              expenses: expenses as any,
              pendingSignups: [],
            };

            const finalResponse = {
              success: true,
              data: responseData,
              timestamp: new Date().toISOString(),
            };

            return new Response(JSON.stringify(finalResponse), {
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0',
              },
            });
          } finally {
            connection.release();
          }
        } catch (error) {
          console.error('[FETCH-DATA] Error fetching data from MySQL:', error);
          return new Response(JSON.stringify({
            success: false,
            error: 'Failed to fetch data from database',
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
