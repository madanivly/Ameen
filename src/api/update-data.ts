import { getDoc } from '../lib/google-sheets';

export async function POST(req: Request) {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['Data'] || (await doc.addSheet({ title: 'Data' }));
    const data = await req.json();
    
    // Check if this is an update (id exists) or a new row
    if (data.id) {
      const rows = await sheet.getRows();
      let found = false;
      
      // Try to find and update existing row
      for (const row of rows) {
        const rowData = row.toObject();
        if (rowData.id === data.id) {
          // Update existing row
          Object.keys(data).forEach(key => {
            (row as any)[key] = data[key];
          });
          await row.save();
          found = true;
          break;
        }
      }
      
      // If not found, create new row
      if (!found) {
        await sheet.addRow(data);
      }
    } else {
      // No ID, add as new row
      await sheet.addRow(data);
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
