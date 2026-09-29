import { RoleType } from '../../../core/types.js';

export interface CostSummaryProps {
  readonly totalChainCost?: number | undefined;
  readonly finalScores?: Readonly<Record<RoleType, number>> | undefined;
  readonly myRole: RoleType;
  readonly myTotalCost: number;
}

interface RoleScoreMeta {
  readonly role: RoleType;
  readonly name: string;
  readonly icon: string;
  readonly color: string;
  readonly bg: string;
}

const ROLE_METAS: readonly RoleScoreMeta[] = [
  { role: 'retailer', name: 'Retailer', icon: '🛒', color: 'var(--role-retailer)', bg: 'var(--role-retailer-bg)' },
  { role: 'wholesaler', name: 'Wholesaler', icon: '🏢', color: 'var(--role-wholesaler)', bg: 'var(--role-wholesaler-bg)' },
  { role: 'distributor', name: 'Distributor', icon: '🚚', color: 'var(--role-distributor)', bg: 'var(--role-distributor-bg)' },
  { role: 'factory', name: 'Factory', icon: '🏭', color: 'var(--role-factory)', bg: 'var(--role-factory-bg)' },
];

export function CostSummary({
  totalChainCost,
  finalScores,
  myRole,
  myTotalCost,
}: CostSummaryProps) {
  const displayTotal = totalChainCost ?? myTotalCost;

  return (
    <div style={{ marginBottom: '2rem' }}>
      {/* Total Supply Chain Cost Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '2rem',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          marginBottom: '1.5rem',
          boxShadow: '0 12px 36px -10px rgba(0, 0, 0, 0.7)',
        }}
      >
        <span
          className="badge"
          style={{ background: 'rgba(99, 102, 241, 0.2)', color: 'var(--text-accent)', marginBottom: '0.75rem', fontSize: '0.85rem' }}
        >
          Final Supply Chain Ledger
        </span>
        <h2 style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.5rem' }}>
          Total Supply Chain Cost
        </h2>
        <div
          style={{
            fontSize: '3rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            color: '#f8fafc',
            textShadow: '0 0 30px rgba(99, 102, 241, 0.4)',
          }}
        >
          ${displayTotal.toFixed(2)}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
          Calculated across all 20 rounds (Inventory Holding: $0.50/unit • Backlog Penalty: $1.00/unit)
        </p>
      </div>

      {/* 4 Roles Individual Cost Breakdown */}
      {finalScores && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
          }}
        >
          {ROLE_METAS.map((meta) => {
            const cost = finalScores[meta.role] ?? 0;
            const isMe = myRole === meta.role;
            const percentage = displayTotal > 0 ? ((cost / displayTotal) * 100).toFixed(1) : '0';

            return (
              <div
                key={meta.role}
                className="glass-panel"
                style={{
                  padding: '1.25rem',
                  borderTop: `4px solid ${meta.color}`,
                  background: isMe ? meta.bg : undefined,
                  boxShadow: isMe ? `0 0 20px ${meta.bg}` : undefined,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>{meta.icon}</span>
                    <span style={{ fontWeight: 700, color: meta.color, fontSize: '1rem' }}>{meta.name}</span>
                  </div>
                  {isMe && (
                    <span className="badge" style={{ background: meta.color, color: '#fff', fontSize: '0.65rem' }}>
                      YOU
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.5rem 0' }}>
                  ${cost.toFixed(2)}
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {percentage}% of total chain cost
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
