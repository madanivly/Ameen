import { getDoc } from '../lib/google-sheets';

export async function POST(req: Request) {
  try {
    console.log('[UPDATE-DATA] POST request received');
    const doc = await getDoc();
    console.log('[UPDATE-DATA] Doc loaded');
    let sheet = doc.sheetsByTitle['Data'];
    if (!sheet) {
      console.log('[UPDATE-DATA] Data sheet not found, creating new sheet');
      sheet = await doc.addSheet({ title: 'Data' });
    }
    
    const data = await req.json();
    console.log('[UPDATE-DATA] Raw data received:', JSON.stringify(data));
    
    // Remove the 'sheet' field if it exists (it's not a data field)
    const { sheet: sheetName, ...rowData } = data;
    
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
        console.log('Creating new row:', rowData);
        await sheet.addRow(rowData);
      }
    } else {
      // No ID, add as new row
      console.log('Creating new row (no ID):', rowData);
      await sheet.addRow(rowData);
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
    return new Response(JSON.stringify({ error: 'Failed to update sheet', details: String(error) }), {
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      }
    });
  }
}

export async function DELETE(req: Request) {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['Data'];
    
    if (!sheet) {
      return new Response(JSON.stringify({ error: 'Data sheet not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id, name } = await req.json();
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
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      }
    });
  }
}
