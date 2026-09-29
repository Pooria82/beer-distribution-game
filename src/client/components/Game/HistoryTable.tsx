import { RoundRecord } from '../../../core/types.js';

export interface HistoryTableProps {
  readonly history: readonly RoundRecord[];
}

export function HistoryTable({ history }: HistoryTableProps) {
  if (history.length === 0) {
    return (
      <div
        className="glass-panel"
        style={{
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
        }}
      >
        <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }}>📊</span>
        <span>No completed rounds yet. Submit your order for Round 1 to start building your ledger history.</span>
      </div>
    );
  }

  // Reverse history so latest round is at the top for immediate visibility
  const reversedHistory = [...history].reverse();

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>📊</span>
          <span>Round History Ledger</span>
        </h4>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {history.length} round{history.length === 1 ? '' : 's'} recorded
        </span>
      </div>

      <div style={{ overflowX: 'auto', maxHeight: '360px', overflowY: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.875rem',
            textAlign: 'right',
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--border-medium)',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: 'rgba(15, 23, 42, 0.95)',
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
                  transition: 'background var(--transition-fast)',
                }}
              >
                <td style={{ padding: '0.65rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Round {rec.round}
                </td>
                <td style={{ padding: '0.65rem 1rem', color: '#38bdf8' }}>{rec.shipmentArrived}</td>
                <td style={{ padding: '0.65rem 1rem', color: '#fbbf24' }}>{rec.incomingOrder}</td>
                <td style={{ padding: '0.65rem 1rem', color: 'var(--text-secondary)' }}>{rec.shipped}</td>
                <td style={{ padding: '0.65rem 1rem', color: '#34d399', fontWeight: 600 }}>{rec.inventory}</td>
                <td
                  style={{
                    padding: '0.65rem 1rem',
                    color: rec.backlog > 0 ? '#f87171' : 'var(--text-muted)',
                    fontWeight: rec.backlog > 0 ? 700 : 400,
                  }}
                >
                  {rec.backlog}
                </td>
                <td style={{ padding: '0.65rem 1rem', fontWeight: 700, color: '#c084fc' }}>{rec.orderPlaced}</td>
                <td style={{ padding: '0.65rem 1rem', color: 'var(--text-secondary)' }}>
                  ${rec.roundCost.toFixed(2)}
                </td>
                <td style={{ padding: '0.65rem 1rem', fontWeight: 700, color: '#f472b6' }}>
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
