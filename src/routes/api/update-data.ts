import { createFileRoute } from '@tanstack/react-router'
import pool from '../../lib/database'

export const Route = createFileRoute('/api/update-data')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { tableName, ...rowData } = await request.json();
          const connection = await pool.getConnection();
          try {
            if (rowData.id) {
              const [rows]: any[] = await connection.query(`SELECT * FROM ${tableName} WHERE id = ?`, [rowData.id]);
              if (rows.length > 0) {
                await connection.query(`UPDATE ${tableName} SET ? WHERE id = ?`, [rowData, rowData.id]);
                console.log(`[UPDATE-DATA] Updated existing row in ${tableName} with id: ${rowData.id}`);
              } else {
                await connection.query(`INSERT INTO ${tableName} SET ?`, [rowData]);
                console.log(`[UPDATE-DATA] Added new row to ${tableName} with id: ${rowData.id}`);
              }
            } else {
              await connection.query(`INSERT INTO ${tableName} SET ?`, [rowData]);
              console.log(`[UPDATE-DATA] Added new row to ${tableName} (no id)`);
            }
            return new Response(JSON.stringify({ success: true, timestamp: new Date().toISOString() }), {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0',
              }
            });
          } finally {
            connection.release();
          }
        } catch (error) {
          console.error('Error updating database:', error);
          return new Response(JSON.stringify({ error: 'Failed to update database' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
          });
        }
      },
      DELETE: async ({ request }) => {
        try {
          const { tableName, id, name } = await request.json();
          const connection = await pool.getConnection();
          try {
            if (id) {
              await connection.query(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
            } else if (name) {
              await connection.query(`DELETE FROM ${tableName} WHERE name = ?`, [name]);
            }
            return new Response(JSON.stringify({ success: true, timestamp: new Date().toISOString() }), {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0',
              }
            });
          } finally {
            connection.release();
          }
        } catch (error) {
          console.error('Error deleting from database:', error);
          return new Response(JSON.stringify({ error: 'Failed to delete from database' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
          });
        }
      },
    },
  },
})
