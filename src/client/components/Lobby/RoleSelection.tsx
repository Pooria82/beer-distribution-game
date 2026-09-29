import { RoleType, PeerSummary } from '../../../core/types.js';

export interface RoleSelectionProps {
  readonly currentRole: RoleType | null;
  readonly peers?: Readonly<Record<RoleType, PeerSummary>> | undefined;
  readonly onSelectRole: (role: RoleType) => void;
  readonly disabled?: boolean | undefined;
}

interface RoleCardMeta {
  readonly role: RoleType;
  readonly title: string;
  readonly icon: string;
  readonly tag: string;
  readonly description: string;
  readonly downstream: string;
  readonly upstream: string;
  readonly themeColor: string;
  readonly themeBg: string;
  readonly themeBorder: string;
}

const ROLES_META: readonly RoleCardMeta[] = [
  {
    role: 'retailer',
    title: 'Retailer',
    icon: '🛒',
    tag: 'Node 1 (Consumer Facing)',
    description: 'Direct interface with customers. Receives sudden demand jump from 4 to 8 units in Round 5.',
    downstream: 'End Customer',
    upstream: 'Wholesaler',
    themeColor: 'var(--role-retailer)',
    themeBg: 'var(--role-retailer-bg)',
    themeBorder: 'var(--role-retailer-border)',
  },
  {
    role: 'wholesaler',
    title: 'Wholesaler',
    icon: '🏢',
    tag: 'Node 2 (Midstream Tier 1)',
    description: 'Buffers demand variability between retailer orders and distributor supplies.',
    downstream: 'Retailer',
    upstream: 'Distributor',
    themeColor: 'var(--role-wholesaler)',
    themeBg: 'var(--role-wholesaler-bg)',
    themeBorder: 'var(--role-wholesaler-border)',
  },
  {
    role: 'distributor',
    title: 'Distributor',
    icon: '🚚',
    tag: 'Node 3 (Regional Hub)',
    description: 'Crucial pivot point in the supply chain susceptible to amplified order oscillation.',
    downstream: 'Wholesaler',
    upstream: 'Factory',
    themeColor: 'var(--role-distributor)',
    themeBg: 'var(--role-distributor-bg)',
    themeBorder: 'var(--role-distributor-border)',
  },
  {
    role: 'factory',
    title: 'Factory',
    icon: '🏭',
    tag: 'Node 4 (Origin Production)',
    description: 'Brewery production center. Unlimited raw material supplier with 2-round brewing pipeline delay.',
    downstream: 'Distributor',
    upstream: 'Production Line',
    themeColor: 'var(--role-factory)',
    themeBg: 'var(--role-factory-bg)',
    themeBorder: 'var(--role-factory-border)',
  },
];

export function RoleSelection({
  currentRole,
  peers,
  onSelectRole,
  disabled = false,
}: RoleSelectionProps) {
  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          Choose Your Supply Chain Role
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Each role experiences 2-round transit delays and order lag. All 4 roles must be claimed to start Round 1.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {ROLES_META.map((meta) => {
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
                boxShadow: isMyRole ? `0 0 20px ${meta.themeBg}` : undefined,
                opacity: isOccupiedByOther ? 0.6 : 1,
                transition: 'all var(--transition-normal)',
              }}
            >
              {/* Top Role Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontSize: '1.75rem' }}>{meta.icon}</span>
                  <div>
                    <h4 style={{ fontSize: '1.15rem', color: meta.themeColor }}>{meta.title}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{meta.tag}</span>
                  </div>
                </div>

                {isMyRole ? (
                  <span className="badge" style={{ background: meta.themeBg, color: meta.themeColor, border: `1px solid ${meta.themeBorder}` }}>
                    Active ✓
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
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.45, flex: 1 }}>
                {meta.description}
              </p>

              {/* Supply Chain Relations */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.75rem',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  marginBottom: '1.25rem',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Downstream:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{meta.downstream}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Upstream:</span>
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
                  Your Assigned Role
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
