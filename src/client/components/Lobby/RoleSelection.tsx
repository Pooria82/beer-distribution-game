import React from 'react';
import { RoleType, PeerSummary } from '../../../core/types.js';
import {
  IconRetailer,
  IconWholesaler,
  IconDistributor,
  IconFactory,
  IconCheck,
} from '../Common/Icons.js';

export interface RoleSelectionProps {
  readonly currentRole: RoleType | null;
  readonly peers?: Readonly<Record<RoleType, PeerSummary>> | undefined;
  readonly onSelectRole: (role: RoleType) => void;
  readonly disabled?: boolean | undefined;
}

interface RoleCardMeta {
  readonly role: RoleType;
  readonly title: string;
  readonly icon: React.ReactNode;
  readonly tag: string;
  readonly description: string;
  readonly downstream: string;
  readonly upstream: string;
  readonly themeColor: string;
  readonly themeBg: string;
  readonly themeBorder: string;
}

export function RoleSelection({
  currentRole,
  peers,
  onSelectRole,
  disabled = false,
}: RoleSelectionProps) {
  const rolesMeta: readonly RoleCardMeta[] = [
    {
      role: 'retailer',
      title: 'Retailer',
      icon: <IconRetailer size={24} color="var(--role-retailer)" />,
      tag: 'Node 1 • Consumer Interface',
      description: 'Receives direct customer demand (4 units, jumping to 8 in Round 5). Ships directly to end consumer.',
      downstream: 'End Customer',
      upstream: 'Wholesaler',
      themeColor: 'var(--role-retailer)',
      themeBg: 'var(--role-retailer-bg)',
      themeBorder: 'var(--role-retailer-border)',
    },
    {
      role: 'wholesaler',
      title: 'Wholesaler',
      icon: <IconWholesaler size={24} color="var(--role-wholesaler)" />,
      tag: 'Node 2 • Midstream Tier 1',
      description: 'Buffers demand variability between retailer orders and regional distributor shipments.',
      downstream: 'Retailer',
      upstream: 'Distributor',
      themeColor: 'var(--role-wholesaler)',
      themeBg: 'var(--role-wholesaler-bg)',
      themeBorder: 'var(--role-wholesaler-border)',
    },
    {
      role: 'distributor',
      title: 'Distributor',
      icon: <IconDistributor size={24} color="var(--role-distributor)" />,
      tag: 'Node 3 • Regional Hub',
      description: 'Central distribution hub. First node to experience severe amplified demand oscillation.',
      downstream: 'Wholesaler',
      upstream: 'Factory',
      themeColor: 'var(--role-distributor)',
      themeBg: 'var(--role-distributor-bg)',
      themeBorder: 'var(--role-distributor-border)',
    },
    {
      role: 'factory',
      title: 'Factory',
      icon: <IconFactory size={24} color="var(--role-factory)" />,
      tag: 'Node 4 • Origin Production',
      description: 'Brewery production center. Unlimited raw material capacity with strict 2-round brewing lag.',
      downstream: 'Distributor',
      upstream: 'Production Line',
      themeColor: 'var(--role-factory)',
      themeBg: 'var(--role-factory-bg)',
      themeBorder: 'var(--role-factory-border)',
    },
  ];

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
          Select Your Supply Chain Role
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Each node operates with 2-round transit delays and order lag. All 4 nodes are required to advance rounds.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {rolesMeta.map((meta) => {
          const peer = peers?.[meta.role];
          const isOccupiedByOther = peer?.isOccupied && currentRole !== meta.role;
          const isMyRole = currentRole === meta.role;
          const isSelectable = !isOccupiedByOther && !disabled;

          return (
            <div
              key={meta.role}
              className="glass-panel"
              style={{
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
                borderColor: isMyRole ? meta.themeColor : undefined,
                boxShadow: isMyRole ? `0 0 28px ${meta.themeBg}` : undefined,
                opacity: isOccupiedByOther ? 0.55 : 1,
              }}
            >
              {/* Top Role Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-md)',
                      background: meta.themeBg,
                      border: `1px solid ${meta.themeBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {meta.icon}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: meta.themeColor }}>{meta.title}</h4>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{meta.tag}</span>
                  </div>
                </div>

                {isMyRole ? (
                  <span className="badge" style={{ background: meta.themeBg, color: meta.themeColor, border: `1px solid ${meta.themeBorder}` }}>
                    <IconCheck size={12} /> Assigned
                  </span>
                ) : isOccupiedByOther ? (
                  <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                    Occupied
                  </span>
                ) : (
                  <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                    Open
                  </span>
                )}
              </div>

              {/* Description */}
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5, flex: 1 }}>
                {meta.description}
              </p>

              {/* Upstream/Downstream Flow Details */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  marginBottom: '1.25rem',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Customer (Downstream):</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{meta.downstream}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Supplier (Upstream):</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{meta.upstream}</span>
                </div>
              </div>

              {/* Action Button */}
              {isMyRole ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled
                  style={{ width: '100%', borderColor: meta.themeColor, color: meta.themeColor }}
                >
                  <IconCheck size={16} /> Currently Active
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelectRole(meta.role)}
                  disabled={!isSelectable}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    background: isSelectable ? meta.themeColor : undefined,
                    borderColor: isSelectable ? meta.themeColor : undefined,
                  }}
                >
                  {isOccupiedByOther ? 'Role Occupied' : `Claim ${meta.title}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
