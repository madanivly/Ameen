import { defineEventHandler, readBody } from 'h3';
import { getDoc } from '../../lib/google-sheets';

interface BatchItem {
  id?: string;
  [key: string]: any;
}

interface BatchRequest {
  operations: BatchItem[];
}

export default defineEventHandler(async (event: any) => {
  try {
    console.log('[BATCH-UPDATE] POST request received');
    const doc = await getDoc();
    let sheet = doc.sheetsByTitle['Data'];
    if (!sheet) {
      console.log('[BATCH-UPDATE] Data sheet not found, creating new sheet');
      sheet = await doc.addSheet({ title: 'Data' });
    }

    const body = (await readBody(event)) as BatchRequest;
    
    if (!body.operations || !Array.isArray(body.operations) || body.operations.length === 0) {
      return {
        success: false,
        error: 'No operations provided. Expected { operations: [...] }',
      };
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

    return {
      success: true,
      results,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error in batch update:', error);
    return {
      success: false,
      error: 'Failed to process batch update',
      details: String(error),
    };
  }
});