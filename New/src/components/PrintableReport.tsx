import { fmt, fmtDate } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppState } from "@/types";

export const PrintableReport = ({ state }: { state: AppState }) => {
    return (
        <div className="hidden print:block p-8" id="printable-report">
            <style>{`
                @media print {
                    @page { size: A4; margin: 20mm; }
                    body * { visibility: hidden; }
                    #printable-report, #printable-report * { visibility: visible; }
                    #printable-report { position: absolute; left: 0; top: 0; width: 100%; }
                }
            `}</style>
            <h1 className="text-2xl font-bold mb-4">Ameen Community Fund - Member Report</h1>
            <p className="text-sm mb-6">Generated on: {new Date().toLocaleDateString()}</p>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Collector</TableHead>
                        <TableHead>Mobile</TableHead>
                        <TableHead className="text-right">Total Collected</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {state.members.map((m) => (
                        <TableRow key={m.id}>
                            <TableCell>{m.name}</TableCell>
                            <TableCell>{m.collectorName}</TableCell>
                            <TableCell>{m.mobile}</TableCell>
                            <TableCell className="text-right font-semibold">
                                {fmt(state.transactions.filter(t => t.memberId === m.id && t.approved).reduce((sum, t) => sum + t.amount, 0))}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};
