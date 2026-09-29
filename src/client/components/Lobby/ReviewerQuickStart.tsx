import React, { useState } from 'react';
import { RoleType } from '../../../core/types.js';
import {
  IconZap,
  IconRocket,
  IconCopy,
  IconCheck,
  IconExternalLink,
  IconRetailer,
  IconWholesaler,
  IconDistributor,
  IconFactory,
} from '../Common/Icons.js';

export interface ReviewerQuickStartProps {
  readonly roomId: string;
}

interface RoleQuickMeta {
  readonly role: RoleType;
  readonly name: string;
  readonly icon: React.ReactNode;
}

const ALL_ROLES: readonly RoleQuickMeta[] = [
  { role: 'retailer', name: 'Retailer', icon: <IconRetailer size={14} color="var(--role-retailer)" /> },
  { role: 'wholesaler', name: 'Wholesaler', icon: <IconWholesaler size={14} color="var(--role-wholesaler)" /> },
  { role: 'distributor', name: 'Distributor', icon: <IconDistributor size={14} color="var(--role-distributor)" /> },
  { role: 'factory', name: 'Factory', icon: <IconFactory size={14} color="var(--role-factory)" /> },
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
        background: 'linear-gradient(180deg, rgba(19, 27, 46, 0.75) 0%, rgba(12, 16, 27, 0.85) 100%)',
        marginBottom: '2rem',
        boxShadow: '0 8px 32px rgba(99, 102, 241, 0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-accent)',
              }}
            >
              <IconZap size={15} color="var(--primary-500)" />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Evaluator Multi-Tab Suite
            </h4>
            <span
              className="badge"
              style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--text-accent)', border: '1px solid rgba(99, 102, 241, 0.3)' }}
            >
              1-Click 4-Tab
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Testing multiplayer mechanics locally requires 4 active tabs. Click below to spawn isolated tabs for each supply chain node.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={handleCopyLink}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.5rem 0.85rem' }}
          >
            {copied ? (
              <>
                <IconCheck size={14} color="var(--status-success)" />
                <span style={{ color: 'var(--status-success)' }}>Link Copied</span>
              </>
            ) : (
              <>
                <IconCopy size={14} />
                <span>Copy Room Link</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleLaunchAllTabs}
            className="btn btn-primary"
            style={{ fontSize: '0.85rem', padding: '0.5rem 1.15rem' }}
          >
            <IconRocket size={16} />
            <span>Launch All 4 Roles (4 Tabs)</span>
          </button>
        </div>
      </div>

      {/* Individual Tab Launchers */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>
          Direct role launcher:
        </span>
        {ALL_ROLES.map((r) => (
          <button
            key={r.role}
            type="button"
            onClick={() => handleOpenSingleTab(r.role)}
            className="btn btn-ghost"
            style={{
              fontSize: '0.8rem',
              padding: '0.35rem 0.65rem',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {r.icon}
            <span>{r.name}</span>
            <IconExternalLink size={12} color="var(--text-muted)" />
          </button>
        ))}
      </div>
    </div>
  );
}
