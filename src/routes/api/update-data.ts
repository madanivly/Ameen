import { createFileRoute } from '@tanstack/react-router'
import { getDoc } from '../../lib/google-sheets'

export const Route = createFileRoute('/api/update-data')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const doc = await getDoc();
          const sheet = doc.sheetsByTitle['Data'] || (await doc.addSheet({ title: 'Data' }));
          const data = await request.json();
          const { sheet: sheetName, ...rowData } = data as any;

          // Check if a row with the same id already exists
          if (rowData.id) {
            const existingRows = await sheet.getRows();
            let found = false;
            for (const row of existingRows) {
              const rowDataObj = row.toObject();
              if (rowDataObj.id === rowData.id) {
                // Update existing row
                Object.keys(rowData).forEach(key => {
                  (row as any)[key] = rowData[key];
                });
                await row.save();
                found = true;
                console.log(`[UPDATE-DATA] Updated existing row with id: ${rowData.id}`);
                break;
              }
            }
            if (!found) {
              await sheet.addRow(rowData);
              console.log(`[UPDATE-DATA] Added new row with id: ${rowData.id}`);
            }
          } else {
            await sheet.addRow(rowData);
            console.log('[UPDATE-DATA] Added new row (no id)');
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
        } catch (error) {
          console.error('Error updating sheet:', error);
          return new Response(JSON.stringify({ error: 'Failed to update sheet' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
          });
        }
      },
      DELETE: async ({ request }) => {
        try {
          const doc = await getDoc();
          const sheet = doc.sheetsByTitle['Data'];

          if (!sheet) {
            return new Response(JSON.stringify({ error: 'Data sheet not found' }), {
              status: 404,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          const { id, name } = await request.json();
          const rows = await sheet.getRows();

          // Find and delete rows matching the id or name
          for (const row of rows) {
            const data = row.toObject();
            if ((id && data.id === id) || (name && data.name === name)) {
              await row.delete();
            }
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
        } catch (error) {
          console.error('Error deleting from sheet:', error);
          return new Response(JSON.stringify({ error: 'Failed to delete from sheet' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
          });
        }
      },
    },
  },
})