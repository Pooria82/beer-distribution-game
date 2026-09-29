import { useState } from 'react';
import { RoleType } from '../../../core/types.js';

export interface ReviewerQuickStartProps {
  readonly roomId: string;
}

const ALL_ROLES: readonly { role: RoleType; name: string; emoji: string }[] = [
  { role: 'retailer', name: 'Retailer', emoji: '🛒' },
  { role: 'wholesaler', name: 'Wholesaler', emoji: '🏢' },
  { role: 'distributor', name: 'Distributor', emoji: '🚚' },
  { role: 'factory', name: 'Factory', emoji: '🏭' },
];

export function ReviewerQuickStart({ roomId }: ReviewerQuickStartProps) {
  const [copied, setCopied] = useState(false);

  const getRoleUrl = (role: RoleType): string => {
    const origin = window.location.origin;
    return `${origin}/?game=${roomId}&role=${role}`;
  };

  const handleLaunchAllTabs = () => {
    for (const item of ALL_ROLES) {
      window.open(getRoleUrl(item.role), '_blank');
    }
  };

  const handleOpenSingleTab = (role: RoleType) => {
    window.open(getRoleUrl(role), '_blank');
  };

  const handleCopyLink = async () => {
    try {
      const shareUrl = `${window.location.origin}/?game=${roomId}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.5rem',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
        marginBottom: '2rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.25rem' }}>⚡</span>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Lemma Evaluator Quick-Start Suite
            </h4>
            <span
              className="badge"
              style={{ background: 'rgba(99, 102, 241, 0.2)', color: 'var(--text-accent)', border: '1px solid rgba(99, 102, 241, 0.4)' }}
            >
              1-Click Multi-Tab
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Multiplayer review requires 4 active roles. Click below to spawn isolated tabs for all 4 supply chain nodes.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={handleCopyLink}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.5rem 0.85rem' }}
          >
            {copied ? '✓ Link Copied' : '🔗 Copy Room Link'}
          </button>

          <button
            type="button"
            onClick={handleLaunchAllTabs}
            className="btn btn-primary"
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            🚀 Launch All 4 Roles (4 Tabs)
          </button>
        </div>
      </div>

      {/* Individual Tab Launchers */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>
          Or open individual role:
        </span>
        {ALL_ROLES.map((r) => (
          <button
            key={r.role}
            type="button"
            onClick={() => handleOpenSingleTab(r.role)}
            className="btn btn-ghost"
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem', border: '1px solid var(--border-subtle)' }}
          >
            <span>{r.emoji}</span>
            <span>{r.name}</span>
            <span style={{ opacity: 0.6 }}>↗</span>
          </button>
        ))}
      </div>
    </div>
  );
}
