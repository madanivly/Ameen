import { createFileRoute } from '@tanstack/react-router'
import { getDoc } from '../../lib/google-sheets'

interface BatchItem {
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
        try {
          console.log('[BATCH-UPDATE] POST request received');
          const doc = await getDoc();
          let sheet = doc.sheetsByTitle['Data'];
          if (!sheet) {
            console.log('[BATCH-UPDATE] Data sheet not found, creating new sheet');
            sheet = await doc.addSheet({ title: 'Data' });
          }

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

          console.log(`[BATCH-UPDATE] Processing ${body.operations.length} operations`);

          const existingRows = await sheet.getRows();
          const results: { id?: string; status: 'updated' | 'created' | 'error'; error?: string }[] = [];

          for (const item of body.operations) {
            try {
              const { sheet: sheetName, ...rowData } = item;

              if (rowData.id) {
                // Try to find and update existing row
                let found = false;
                for (const row of existingRows) {
                  const rowDataObj = row.toObject();
                  if (rowDataObj.id === rowData.id) {
                    Object.keys(rowData).forEach(key => {
                      (row as any)[key] = rowData[key];
                    });
                    await row.save();
                    results.push({ id: rowData.id, status: 'updated' });
                    found = true;
                    break;
                  }
                }

                if (!found) {
                  await sheet.addRow(rowData);
                  results.push({ id: rowData.id, status: 'created' });
                }
              } else {
                // No ID, add as new row
                await sheet.addRow(rowData);
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

          return new Response(JSON.stringify({
            success: true,
            results,
            timestamp: new Date().toISOString(),
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (error) {
          console.error('Error in batch update:', error);
          return new Response(JSON.stringify({
            success: false,
            error: 'Failed to process batch update',
            details: String(error),
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      },
    },
  },
})