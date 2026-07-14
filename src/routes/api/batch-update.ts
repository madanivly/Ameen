import { createFileRoute } from '@tanstack/react-router'
import pool from '../../lib/database'

interface BatchItem {
  tableName: string;
  id?: string;
  [key: string]: any;
}

interface BatchRequest {
  operations: BatchItem[];
}

export const Route = createFileRoute('/api/batch-update')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as BatchRequest;
        if (!body.operations || !Array.isArray(body.operations) || body.operations.length === 0) {
          return new Response(JSON.stringify({
            success: false,
            error: 'No operations provided. Expected { operations: [...] }',
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const connection = await pool.getConnection();
        try {
          await connection.beginTransaction();
          const results: { id?: string; status: 'updated' | 'created' | 'error'; error?: string }[] = [];

          for (const item of body.operations) {
            try {
              const { tableName, ...rowData } = item;
              if (rowData.id) {
                const [rows]: any[] = await connection.query(`SELECT * FROM ${tableName} WHERE id = ?`, [rowData.id]);
                if (rows.length > 0) {
                  await connection.query(`UPDATE ${tableName} SET ? WHERE id = ?`, [rowData, rowData.id]);
                  results.push({ id: rowData.id, status: 'updated' });
                } else {
                  await connection.query(`INSERT INTO ${tableName} SET ?`, [rowData]);
                  results.push({ id: rowData.id, status: 'created' });
                }
              } else {
                await connection.query(`INSERT INTO ${tableName} SET ?`, [rowData]);
                results.push({ status: 'created' });
              }
            } catch (itemError) {
              console.error('[BATCH-UPDATE] Error processing item:', itemError);
              results.push({
                id: item.id,
                status: 'error',
                error: String(itemError),
              });
            }
          }

          await connection.commit();
          return new Response(JSON.stringify({
            success: true,
            results,
            timestamp: new Date().toISOString(),
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (error) {
          await connection.rollback();
          console.error('Error in batch update:', error);
          return new Response(JSON.stringify({
            success: false,
            error: 'Failed to process batch update',
            details: String(error),
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        } finally {
          connection.release();
        }
      },
    },
  },
})
