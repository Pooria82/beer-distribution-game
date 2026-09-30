import { useState } from 'react';
import { RoleType } from '../../../core/types.js';
import {
  IconRocket,
  IconCopy,
  IconCheck,
  IconExternalLink,
  IconZap,
} from '../Common/Icons.js';

export interface ReviewerQuickStartProps {
  readonly roomId: string;
}

const ROLES: readonly RoleType[] = ['retailer', 'wholesaler', 'distributor', 'factory'];

export function ReviewerQuickStart({ roomId }: ReviewerQuickStartProps) {
  const [copiedRole, setCopiedRole] = useState<string | null>(null);

  const getRoleUrl = (role: RoleType) => {
    const origin = window.location.origin;
    return `${origin}/?room=${encodeURIComponent(roomId)}&role=${role}`;
  };

  const handleLaunchAll = () => {
    ROLES.forEach((role) => {
      window.open(getRoleUrl(role), '_blank');
    });
  };

  const handleCopyLink = async (role: RoleType) => {
    try {
      await navigator.clipboard.writeText(getRoleUrl(role));
      setCopiedRole(role);
      setTimeout(() => setCopiedRole(null), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="scada-panel" style={{ width: '100%', height: '100%' }}>
      {/* Panel Header */}
      <div className="scada-panel-header">
        <div className="scada-panel-title">
          <IconZap size={15} color="var(--scada-amber)" />
          <span>SECTOR-03 // REVIEWER 1-CLICK HARNESS</span>
        </div>
        <span className="scada-badge" style={{ color: 'var(--scada-amber)', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
          4-BAY DISPATCHER
        </span>
      </div>

      <div className="scada-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.4 }}>
          Evaluator Quick-Start Suite: Launches 4 isolated browser tabs configured with tab-scoped tokens for instantaneous multi-node simulation.
        </p>

        {/* 1-Click Master Launch Button */}
        <button
          type="button"
          onClick={handleLaunchAll}
          className="btn-scada btn-scada-warning"
          style={{ width: '100%', padding: '0.75rem', gap: '0.65rem' }}
        >
          <IconRocket size={18} />
          <span>DISPATCH ALL 4 STATIONS (4 TABS)</span>
        </button>

        {/* Individual Direct Station Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-hud)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            MANUAL BAY ACCESS LINKS:
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
            {ROLES.map((role) => (
              <div
                key={role}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.35rem 0.55rem',
                  background: 'var(--bg-panel-inset)',
                  border: '1px solid var(--border-panel)',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <span style={{ textTransform: 'capitalize', color: 'var(--text-primary)' }}>{role}</span>

                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(role)}
                    className="btn-scada"
                    style={{ padding: '0.2rem 0.4rem', fontSize: '0.68rem' }}
                    title="Copy URL"
                  >
                    {copiedRole === role ? <IconCheck size={11} color="var(--scada-green)" /> : <IconCopy size={11} />}
                  </button>

                  <a
                    href={getRoleUrl(role)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-scada"
                    style={{ padding: '0.2rem 0.4rem', fontSize: '0.68rem', textDecoration: 'none' }}
                    title="Open in new tab"
                  >
                    <IconExternalLink size={11} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SCADA Rule Specifications */}
        <div
          style={{
            marginTop: 'auto',
            padding: '0.6rem 0.75rem',
            background: 'rgba(0,0,0,0.35)',
            border: '1px solid var(--border-panel)',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.7rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>HOLDING PENALTY:</span>
            <span style={{ color: 'var(--text-primary)' }}>$0.50 / unit / round</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>BACKLOG DEFICIT:</span>
            <span style={{ color: 'var(--scada-red)' }}>$1.00 / unit / round</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>PIPELINE LATENCY:</span>
            <span style={{ color: 'var(--scada-cyan)' }}>2w Order + 2w Shipment</span>
          </div>
        </div>
      </div>
    </div>
  );
}
