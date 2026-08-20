import { createPortal } from "react-dom";
import { fmt } from "@/lib/format";
import { AppState } from "@/types";

// Generate all YYYY-MM month keys from startDate up to (and including) today
function allMonthsSince(startDate: string): string[] {
    const months: string[] = [];
    const start = new Date(startDate);
    const now = new Date();
    // Start from the member's join month
    const cur = new Date(start.getFullYear(), start.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 1);
    while (cur <= end) {
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, '0');
        months.push(`${y}-${m}`);
        cur.setMonth(cur.getMonth() + 1);
    }
    return months;
}

function fmtMonthShort(mk: string): string {
    const [year, month] = mk.split('-');
    if (!year || !month) return mk;
    const d = new Date(parseInt(year), parseInt(month) - 1, 1);
    return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
}

export const PrintableReport = ({ state }: { state: AppState }) => {
    const now = new Date();

    const rows = state.members.map((m, idx) => {
        const memberTxns = state.transactions.filter(
            (t) => (t.memberId === m.id || t.memberId === m.memberId) && t.approved,
        );
        const totalCollected = memberTxns.reduce((sum, t) => sum + Number(t.amount || 0), 0);

        // Paid month keys (approved monthly payments only)
        const paidMonthKeys = new Set(
            memberTxns
                .filter((t) => t.type === 'monthly' && t.monthKey)
                .map((t) => t.monthKey as string)
        );

        // All months due since joining
        const joinDate = m.joinedAt || now.toISOString();
        const dueMonths = allMonthsSince(joinDate).filter(mk => mk !== undefined); // all months from join to now

        // Pending = due months with no approved payment
        const pendingMonths = dueMonths.filter(mk => !paidMonthKeys.has(mk));
        const pendingCount = pendingMonths.length;
        const pendingLabel = pendingCount === 0
            ? '—'
            : pendingMonths.map(fmtMonthShort).join(', ');

        return { m, totalCollected, pendingCount, pendingLabel, idx };
    });

    const grandTotal = rows.reduce((sum, r) => sum + r.totalCollected, 0);
    const totalShares = rows.reduce((sum, r) => sum + (r.m.shares || 1), 0);

    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    return createPortal(
        <div id="printable-report-container">
            <div className="hidden print:block" id="printable-report">
            <style>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 12mm 10mm;
                    }
                    
                    /* Hide everything in the document by default */
                    body > *:not(#printable-report-container) { 
                        display: none !important;
                    }
                    
                    /* Force html and body to hug content and kill margins */
                    html, body { 
                        height: auto !important; 
                        min-height: 0 !important;
                        overflow: hidden !important; 
                        margin: 0 !important; 
                        padding: 0 !important;
                        background: white !important;
                    }

                    #printable-report-container {
                        display: block !important;
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    
                    #printable-report {
                        display: block !important;
                        width: 100%;
                        font-size: 10px;
                        line-height: 1.3;
                        background: white;
                        margin: 0;
                        padding: 0;
                    }
                    
                    /* Prevent blank trailing pages */
                    #printable-report table { page-break-inside: auto; margin-bottom: 0; }
                    #printable-report tr { page-break-inside: avoid; page-break-after: auto; }
                    #printable-report tfoot { display: table-row-group; }
                }
            `}</style>
            <div style={{ borderBottom: '2px solid #1a5276', marginBottom: 12, paddingBottom: 6, display: 'flex', alignItems: 'center', gap: 14 }}>
                <img src="/logo.png" alt="GRT Logo" style={{ height: 56, width: 56, objectFit: 'contain', flexShrink: 0 }} />
                <div>
                    <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>GRT – Grow Rich Together · Member Report</h1>
                    <p style={{ margin: '3px 0 0', fontSize: 10, color: '#555' }}>
                        Generated on: {dateStr} at {timeStr}
                    </p>
                </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                <thead>
                    <tr style={{ backgroundColor: '#1a5276', color: '#fff' }}>
                        <th style={{ padding: '5px 6px', textAlign: 'left', border: '1px solid #aaa' }}>S.No</th>
                        <th style={{ padding: '5px 6px', textAlign: 'left', border: '1px solid #aaa' }}>User ID</th>
                        <th style={{ padding: '5px 6px', textAlign: 'left', border: '1px solid #aaa' }}>Member Name</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', border: '1px solid #aaa' }}>Shares</th>
                        <th style={{ padding: '5px 6px', textAlign: 'left', border: '1px solid #aaa' }}>Collector</th>
                        <th style={{ padding: '5px 6px', textAlign: 'left', border: '1px solid #aaa' }}>Mobile</th>
                        <th style={{ padding: '5px 6px', textAlign: 'left', border: '1px solid #aaa' }}>Pending Months</th>
                        <th style={{ padding: '5px 6px', textAlign: 'right', border: '1px solid #aaa' }}>Total Collected</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(({ m, totalCollected, pendingCount, pendingLabel, idx }) => (
                        <tr key={m.id} style={{ backgroundColor: idx % 2 === 0 ? '#f9f9f9' : '#fff' }}>
                            <td style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'center' }}>{idx + 1}</td>
                            <td style={{ padding: '4px 6px', border: '1px solid #ddd', fontFamily: 'monospace' }}>{m.memberId}</td>
                            <td style={{ padding: '4px 6px', border: '1px solid #ddd' }}>{m.name}</td>
                            <td style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'center' }}>{m.shares || 1}</td>
                            <td style={{ padding: '4px 6px', border: '1px solid #ddd' }}>{m.collectorName || '—'}</td>
                            <td style={{ padding: '4px 6px', border: '1px solid #ddd', fontFamily: 'monospace' }}>{m.mobile}</td>
                            <td style={{ padding: '4px 6px', border: '1px solid #ddd', fontSize: 9, color: pendingCount > 0 ? '#c0392b' : '#27ae60', fontWeight: pendingCount > 0 ? 600 : 400 }}>
                                {pendingCount > 0 ? `${pendingCount} month${pendingCount > 1 ? 's' : ''}: ${pendingLabel}` : 'Up to date'}
                            </td>
                            <td style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'right', fontWeight: 600 }}>
                                {fmt(totalCollected)}
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr style={{ backgroundColor: '#d5e8d4', fontWeight: 700 }}>
                        <td colSpan={3} style={{ padding: '6px 8px', border: '1px solid #aaa', textAlign: 'right' }}>
                            Total Shares
                        </td>
                        <td style={{ padding: '6px 8px', border: '1px solid #aaa', textAlign: 'center' }}>
                            {totalShares}
                        </td>
                        <td colSpan={3} style={{ padding: '6px 8px', border: '1px solid #aaa', textAlign: 'right' }}>
                            Grand Total Collected
                        </td>
                        <td style={{ padding: '6px 8px', border: '1px solid #aaa', textAlign: 'right' }}>
                            {fmt(grandTotal)}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
        </div>,
        document.body
    );
};
