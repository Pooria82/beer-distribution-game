import { RoundRecord } from '../../../core/types.js';
import { IconTrendingUp } from '../Common/Icons.js';

export interface HistoryTableProps {
  readonly history: readonly RoundRecord[];
}

export function HistoryTable({ history }: HistoryTableProps) {
  if (history.length === 0) {
    return (
      <div
        className="glass-panel"
        style={{
          padding: '2.5rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.875rem',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          <IconTrendingUp size={20} />
        </div>
        <div>No completed rounds yet. Submit your order for Round 1 to start building your ledger history.</div>
      </div>
    );
  }

  // Reverse history so latest round is at the top for immediate visibility
  const reversedHistory = [...history].reverse();

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-accent)',
            }}
          >
            <IconTrendingUp size={16} />
          </div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
            Round History Ledger
          </h4>
        </div>
        <span
          className="badge metric-num"
          style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', textTransform: 'none' }}
        >
          {history.length} round{history.length === 1 ? '' : 's'} completed
        </span>
      </div>

      <div style={{ overflowX: 'auto', maxHeight: '360px', overflowY: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.85rem',
            textAlign: 'right',
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--border-medium)',
                color: 'var(--text-secondary)',
                fontSize: '0.725rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                background: 'rgba(12, 16, 27, 0.95)',
                position: 'sticky',
                top: 0,
                zIndex: 1,
              }}
            >
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Round</th>
              <th style={{ padding: '0.75rem 1rem' }}>Arrived</th>
              <th style={{ padding: '0.75rem 1rem' }}>Demand</th>
              <th style={{ padding: '0.75rem 1rem' }}>Shipped</th>
              <th style={{ padding: '0.75rem 1rem' }}>Inventory</th>
              <th style={{ padding: '0.75rem 1rem' }}>Backlog</th>
              <th style={{ padding: '0.75rem 1rem' }}>Your Order</th>
              <th style={{ padding: '0.75rem 1rem' }}>Round Cost</th>
              <th style={{ padding: '0.75rem 1rem' }}>Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {reversedHistory.map((rec) => (
              <tr
                key={rec.round}
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  transition: 'background 150ms ease',
                }}
              >
                <td style={{ padding: '0.65rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Round {rec.round}
                </td>
                <td className="metric-num" style={{ padding: '0.65rem 1rem', color: '#38bdf8' }}>{rec.shipmentArrived}</td>
                <td className="metric-num" style={{ padding: '0.65rem 1rem', color: '#fbbf24' }}>{rec.incomingOrder}</td>
                <td className="metric-num" style={{ padding: '0.65rem 1rem', color: 'var(--text-secondary)' }}>{rec.shipped}</td>
                <td className="metric-num" style={{ padding: '0.65rem 1rem', color: '#34d399', fontWeight: 600 }}>{rec.inventory}</td>
                <td
                  className="metric-num"
                  style={{
                    padding: '0.65rem 1rem',
                    color: rec.backlog > 0 ? '#f87171' : 'var(--text-muted)',
                    fontWeight: rec.backlog > 0 ? 700 : 400,
                  }}
                >
                  {rec.backlog}
                </td>
                <td className="metric-num" style={{ padding: '0.65rem 1rem', fontWeight: 700, color: '#c084fc' }}>{rec.orderPlaced}</td>
                <td className="metric-num" style={{ padding: '0.65rem 1rem', color: 'var(--text-secondary)' }}>
                  ${rec.roundCost.toFixed(2)}
                </td>
                <td className="metric-num" style={{ padding: '0.65rem 1rem', fontWeight: 700, color: '#f472b6' }}>
                  ${rec.totalCost.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
