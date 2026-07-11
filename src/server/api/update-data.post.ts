import { defineEventHandler, readBody, getMethod } from 'h3';
import { getDoc } from '../../lib/google-sheets';

export default defineEventHandler(async (event: any) => {
  const method = getMethod(event);
  console.log(`[UPDATE-DATA] ${method} request received`);
  
  try {
    const doc = await getDoc();
    console.log('[UPDATE-DATA] Doc loaded');
    let sheet = doc.sheetsByTitle['Data'];
    if (!sheet) {
      console.log('[UPDATE-DATA] Data sheet not found, creating new sheet');
      sheet = await doc.addSheet({ title: 'Data' });
    }

    // --- Handle DELETE ---
    if (method === 'DELETE') {
      const body = (await readBody(event)) as Record<string, any>;
      console.log('[UPDATE-DATA] DELETE request body:', JSON.stringify(body));
      const deleteId = body?.id;
      
      if (!deleteId) {
        return { success: false, error: 'No id provided for deletion' };
      }

      const rows = await sheet.getRows();
      let deleted = false;
      for (const row of rows) {
        const rowData = row.toObject();
        if (rowData.id === deleteId) {
          await row.delete();
          console.log('[UPDATE-DATA] Deleted row with id:', deleteId);
          deleted = true;
          break;
        }
      }
      
      return { success: deleted, deleted: true, timestamp: new Date().toISOString() };
    }
    
    // --- Handle POST (create/update) ---
    const body = (await readBody(event)) as Record<string, any>;
    console.log('[UPDATE-DATA] Raw data received:', JSON.stringify(body));
    
    // Remove the 'sheet' field if it exists (it's not a data field)
    const { sheet: sheetName, ...rowData } = body;
    
    console.log('[UPDATE-DATA] Saving to sheet:', JSON.stringify(rowData));
    
    // Check if this is an update (id exists) or a new row
    if (rowData.id) {
      const rows = await sheet.getRows();
      let found = false;
      
      // Try to find and update existing row
      for (const row of rows) {
        const rowDataObj = row.toObject();
        if (rowDataObj.id === rowData.id) {
          // Update existing row - set all fields from data
          Object.keys(rowData).forEach(key => {
            (row as any)[key] = rowData[key];
          });
          await row.save();
          console.log('Updated existing row with id:', rowData.id);
          found = true;
          break;
        }
      }
      
      // If not found, create new row
      if (!found) {
        console.log('Adding new row:', rowData);
        await sheet.addRow(rowData);
      }
    } else {
      // No ID, add as new row
      console.log('Creating new row (no ID):', rowData);
      await sheet.addRow(rowData);
    }
    
    return { success: true, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error('Error updating sheet:', error);
    return {
      success: false,
      error: 'Failed to update sheet',
      details: String(error)
    };
  }
});