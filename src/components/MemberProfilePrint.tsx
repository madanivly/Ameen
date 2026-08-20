/**
 * MemberProfilePrint – renders a hidden A4-sized printable profile card.
 * Call window.print() after mounting to trigger the browser print dialog.
 */
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { fmt, fmtDate } from "@/lib/format";

interface MemberProfilePrintProps {
  member: any;
  transactions: any[];
}

export function MemberProfilePrint({ member: m, transactions }: MemberProfilePrintProps) {
  const approved = transactions
    .filter((t) => (t.memberId === m.id || t.memberId === m.memberId) && t.approved)
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const wrapperRef = useRef<HTMLDivElement>(null);

  const content = (
    <div id="member-profile-print-area" className="hidden print:block">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 14mm;
          }
          
          /* Hide everything in the root */
          #root {
            display: none !important;
          }
          
          /* Hide other specific common React entry points or siblings */
          body > div:not(#member-profile-print-area) {
             display: none !important;
          }
          
          /* Force body to just fit content */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            background: white !important;
          }

          /* Ensure our print area is shown */
          #member-profile-print-area {
            display: block !important;
            position: relative !important;
            width: 100% !important;
            background: white !important;
            z-index: 999999;
          }
          
          /* Force print elements inside to show */
          #member-profile-print-area * {
            visibility: visible;
          }
        }
      `}</style>

      {/* Header band */}
      <div style={{
        background: 'linear-gradient(135deg, #1a5276 0%, #21618c 100%)',
        borderRadius: 10,
        padding: '20px 28px',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        marginBottom: 20,
      }}>
        {/* Photo */}
        {m.profilePhoto ? (
          <img
            src={m.profilePhoto}
            alt="Profile"
            style={{
              width: 80, height: 80,
              borderRadius: '50%',
              border: '3px solid #fff',
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
        ) : (
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.5)',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 12, flexShrink: 0,
          }}>
            No Photo
          </div>
        )}

        <div style={{ color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
            <img src="/logo.png" alt="GRT Logo" style={{ height: 36, width: 36, objectFit: 'contain', borderRadius: 6, background: 'rgba(255,255,255,0.15)', padding: 3 }} />
            <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.9, letterSpacing: 0.5 }}>GRT – Grow Rich Together</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 0.3 }}>{m.name}</div>
          <div style={{ fontSize: 11, marginTop: 3, opacity: 0.85 }}>Member ID: <strong>{m.memberId}</strong></div>
          <div style={{ fontSize: 11, marginTop: 2, opacity: 0.85 }}>Shares: <strong>{m.shares ?? 1}</strong></div>
        </div>

        <div style={{ marginLeft: 'auto', textAlign: 'right', color: '#fff' }}>
          <div style={{ fontSize: 10, opacity: 0.75 }}>Total Contributed</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{fmt(approved)}</div>
          <div style={{ fontSize: 9, marginTop: 4, opacity: 0.65 }}>
            Printed: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
        <InfoCard title="Contact Information">
          <InfoRow label="Mobile" value={m.mobile || '—'} />
          <InfoRow label="WhatsApp" value={m.whatsapp || '—'} />
          <InfoRow label="Collector" value={m.collectorName || '—'} />
        </InfoCard>

        <InfoCard title="Account Details">
          <InfoRow label="Member ID" value={m.memberId} mono />
          <InfoRow label="Status" value={m.isCollector ? 'Collector' : 'Member'} />
          <InfoRow label="Joined" value={m.joinedAt ? fmtDate(m.joinedAt) : '—'} />
        </InfoCard>
      </div>

      {m.nomineeName && (
        <InfoCard title="Nominee Information">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px' }}>
            <InfoRow label="Name" value={m.nomineeName} />
            <InfoRow label="Relation" value={m.nomineeRelation || '—'} />
            <InfoRow label="Contact" value={m.nomineeContact || '—'} />
            <InfoRow label="Address" value={m.nomineeAddress || '—'} />
          </div>
        </InfoCard>
      )}

      {/* Footer */}
      <div style={{
        marginTop: 24, borderTop: '1px solid #ddd', paddingTop: 8,
        display: 'flex', justifyContent: 'space-between',
        fontSize: 9, color: '#999',
      }}>
        <span>GRT-Grow Rich Together — Confidential Member Profile</span>
        <span>Generated {new Date().toLocaleString()}</span>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(content, document.body);
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      border: '1px solid #e0e0e0',
      borderRadius: 8,
      padding: '12px 16px',
      background: '#fafafa',
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: 0.8, color: '#1a5276', marginBottom: 8,
        borderBottom: '1px solid #e0e0e0', paddingBottom: 5,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 11 }}>
      <span style={{ color: '#555', minWidth: 90 }}>{label}</span>
      <span style={{ fontWeight: 600, fontFamily: mono ? 'monospace' : 'inherit', color: '#222', textAlign: 'right' }}>
        {value}
      </span>
    </div>
  );
}
