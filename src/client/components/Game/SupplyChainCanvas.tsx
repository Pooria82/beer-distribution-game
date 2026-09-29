import { RoleType, PeerSummary } from '../../../core/types.js';

export interface SupplyChainCanvasProps {
  readonly myRole: RoleType;
  readonly peers: Readonly<Record<RoleType, PeerSummary>>;
  readonly currentRound: number;
}

interface NodeConfig {
  readonly role: RoleType;
  readonly name: string;
  readonly icon: string;
  readonly color: string;
  readonly bg: string;
  readonly border: string;
}

const CHAIN_NODES: readonly NodeConfig[] = [
  {
    role: 'retailer',
    name: 'Retailer',
    icon: '🛒',
    color: 'var(--role-retailer)',
    bg: 'var(--role-retailer-bg)',
    border: 'var(--role-retailer-border)',
  },
  {
    role: 'wholesaler',
    name: 'Wholesaler',
    icon: '🏢',
    color: 'var(--role-wholesaler)',
    bg: 'var(--role-wholesaler-bg)',
    border: 'var(--role-wholesaler-border)',
  },
  {
    role: 'distributor',
    name: 'Distributor',
    icon: '🚚',
    color: 'var(--role-distributor)',
    bg: 'var(--role-distributor-bg)',
    border: 'var(--role-distributor-border)',
  },
  {
    role: 'factory',
    name: 'Factory',
    icon: '🏭',
    color: 'var(--role-factory)',
    bg: 'var(--role-factory-bg)',
    border: 'var(--role-factory-border)',
  },
];

export function SupplyChainCanvas({ myRole, peers, currentRound }: SupplyChainCanvasProps) {
  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.5rem',
        marginBottom: '1.75rem',
        overflowX: 'auto',
      }}
    >
      {/* Legend & Direction Flow Indicators */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Supply Chain Architecture</span>
          <span style={{ color: 'var(--text-muted)' }}>• Round {currentRound}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ color: '#38bdf8', fontWeight: 700 }}>→</span>
            <span>Orders Flow Upstream (Retailer → Factory)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ color: '#34d399', fontWeight: 700 }}>←</span>
            <span>Shipments Flow Downstream (2-Round Lag)</span>
          </div>
        </div>
      </div>

      {/* Interactive 4-Node Chain Layout */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minWidth: '780px',
          position: 'relative',
          padding: '0.5rem 0',
        }}
      >
        {CHAIN_NODES.map((node, index) => {
          const peer = peers[node.role];
          const isMe = myRole === node.role;
          const hasSubmitted = peer?.hasSubmittedThisRound ?? false;
          const isConnected = peer?.isConnected ?? false;

          return (
            <div key={node.role} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              {/* Node Card */}
              <div
                style={{
                  flex: 1,
                  padding: '1rem 1.15rem',
                  borderRadius: 'var(--radius-md)',
                  background: isMe ? node.bg : 'rgba(255, 255, 255, 0.02)',
                  border: `2px solid ${isMe ? node.color : node.border}`,
                  boxShadow: isMe ? `0 0 24px ${node.bg}` : 'none',
                  transition: 'all var(--transition-normal)',
                  position: 'relative',
                }}
              >
                {/* "YOU" Floating Badge */}
                {isMe && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '12px',
                      background: node.color,
                      color: '#ffffff',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      letterSpacing: '0.05em',
                      boxShadow: `0 2px 8px ${node.bg}`,
                    }}
                  >
                    YOU
                  </span>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{node.icon}</span>
                  <div>
                    <h4 style={{ fontSize: '1rem', color: isMe ? node.color : 'var(--text-primary)', fontWeight: 700 }}>
                      {node.name}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Node {index + 1}
                    </span>
                  </div>
                </div>

                {/* Status Badges */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.75rem' }}>
                  {/* Submission Readiness */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      background: hasSubmitted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.12)',
                      color: hasSubmitted ? 'var(--status-success)' : 'var(--status-warning)',
                      fontWeight: 600,
                    }}
                  >
                    <span>Order:</span>
                    <span>{hasSubmitted ? 'Ready ✓' : 'Thinking...'}</span>
                  </div>

                  {/* Presence Status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: isConnected ? 'var(--status-success)' : 'var(--status-danger)',
                        display: 'inline-block',
                      }}
                    />
                    <span>{isConnected ? 'Online' : 'Disconnected'}</span>
                  </div>
                </div>
              </div>

              {/* Connecting Pipeline Transit Arrows (between nodes) */}
              {index < CHAIN_NODES.length - 1 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '60px',
                    padding: '0 0.5rem',
                    gap: '0.35rem',
                  }}
                >
                  {/* Order flow up (→) */}
                  <div
                    title="Order placed upstream"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '0.7rem',
                      color: '#38bdf8',
                      fontWeight: 700,
                      gap: '0.2rem',
                    }}
                  >
                    <span>Order</span>
                    <span>→</span>
                  </div>

                  {/* Transit line divider */}
                  <div
                    style={{
                      width: '100%',
                      height: '2px',
                      background: 'linear-gradient(90deg, #38bdf8 0%, #34d399 100%)',
                      opacity: 0.4,
                    }}
                  />

                  {/* Shipment flow down (←) */}
                  <div
                    title="Shipment arrives with 2-round delay"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '0.7rem',
                      color: '#34d399',
                      fontWeight: 700,
                      gap: '0.2rem',
                    }}
                  >
                    <span>←</span>
                    <span>Ship</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
