import { getDoc } from '../../lib/google-sheets';

export async function POST(req: Request) {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['Data'] || (await doc.addSheet({ title: 'Data' }));
    const data = await req.json();
    await sheet.addRow(data);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update sheet' }), { status: 500 });
  }
}
