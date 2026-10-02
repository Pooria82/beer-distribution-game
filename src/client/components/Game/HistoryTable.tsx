import { RoundRecord } from '../../../core/types.js';
import { IconTerminal, IconDatabase, IconActivity } from '../Common/Icons.js';

export interface HistoryTableProps {
  readonly history: readonly RoundRecord[];
}

export function HistoryTable({ history }: HistoryTableProps) {
  if (history.length === 0) {
    return (
      <div className="scada-panel" style={{ width: '100%', height: '100%' }}>
        <div className="scada-panel-header">
          <div className="scada-panel-title">
            <IconTerminal size={15} color="var(--scada-cyan)" />
            <span>BLACK BOX // TELEMETRY RECORDER</span>
          </div>
          <span className="scada-badge">STANDBY</span>
        </div>
        <div
          className="scada-panel-body"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '160px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            textAlign: 'center',
            gap: '0.5rem',
          }}
        >
          <IconActivity size={24} color="var(--border-panel-bright)" />
          <span>AWAITING ROUND 01 TELEMETRY TRANSMISSION...</span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            Full state history will be logged here in chronological sequence.
          </span>
        </div>
      </div>
    );
  }

  // Latest round at the top
  const reversedHistory = [...history].reverse();

  return (
    <div className="scada-panel" style={{ width: '100%', height: '100%' }}>
      {/* Panel Header */}
      <div className="scada-panel-header">
        <div className="scada-panel-title">
          <IconDatabase size={15} color="var(--scada-cyan)" />
          <span style={{ whiteSpace: 'nowrap', fontSize: '0.75rem' }}>BLACK BOX // RECORDER</span>
        </div>
        <span className="scada-badge" style={{ color: 'var(--scada-green)', whiteSpace: 'nowrap', fontSize: '0.62rem', padding: '0.1rem 0.35rem' }}>
          {history.length} LOGGED
        </span>
      </div>

      <div
        className="scada-panel-body"
        style={{
          padding: 0,
          overflowX: 'auto',
          maxHeight: 'calc(100vh - 240px)',
          minHeight: '200px',
          overflowY: 'auto',
          width: '100%',
        }}
      >
        <table
          style={{
            width: '100%',
            minWidth: '335px',
            tableLayout: 'fixed',
            borderCollapse: 'collapse',
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono)',
            textAlign: 'right',
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: 'var(--bg-panel-inset)',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-hud)',
                letterSpacing: '0.04em',
                fontSize: '0.64rem',
                borderBottom: '1px solid var(--border-panel)',
                position: 'sticky',
                top: 0,
                zIndex: 10,
              }}
            >
              <th style={{ width: '32px', padding: '0.4rem 0.2rem', textAlign: 'left' }} title="Round Number">RND</th>
              <th style={{ width: '38px', padding: '0.4rem 0.2rem' }} title="Inbound Shipment Received">RECV</th>
              <th style={{ width: '36px', padding: '0.4rem 0.2rem' }} title="Incoming Demand Order">DEM</th>
              <th style={{ width: '36px', padding: '0.4rem 0.2rem' }} title="Units Shipped Downstream">SHIP</th>
              <th style={{ width: '36px', padding: '0.4rem 0.2rem' }} title="Backlog Deficit">BACK</th>
              <th style={{ width: '36px', padding: '0.4rem 0.2rem', color: 'var(--scada-cyan)' }} title="Order Placed Upstream">ORD</th>
              <th style={{ width: '36px', padding: '0.4rem 0.2rem' }} title="Ending Inventory Stock">STK</th>
              <th style={{ width: '42px', padding: '0.4rem 0.2rem' }} title="Cost This Round">COST</th>
              <th style={{ width: '46px', padding: '0.4rem 0.2rem' }} title="Cumulative Total Loss">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {reversedHistory.map((row, index) => {
              const isLatest = index === 0;
              const hasBacklog = row.backlog > 0;

              return (
                <tr
                  key={row.round}
                  style={{
                    backgroundColor: isLatest
                      ? 'rgba(0, 240, 255, 0.05)'
                      : index % 2 === 0
                        ? 'transparent'
                        : 'rgba(255, 255, 255, 0.015)',
                    borderBottom: '1px solid var(--border-panel)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {/* Round number */}
                  <td style={{ padding: '0.4rem 0.3rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-primary)' }}>
                    <span style={{ color: isLatest ? 'var(--scada-cyan)' : 'var(--text-muted)' }}>
                      #{String(row.round).padStart(2, '0')}
                    </span>
                  </td>

                  {/* Shipment Arrived */}
                  <td style={{ padding: '0.4rem 0.3rem', color: 'var(--scada-green)' }}>
                    +{row.shipmentArrived}
                  </td>

                  {/* Demand / Incoming Order */}
                  <td style={{ padding: '0.4rem 0.3rem', color: 'var(--scada-amber)' }}>
                    {row.incomingOrder}
                  </td>

                  {/* Shipped */}
                  <td style={{ padding: '0.4rem 0.3rem' }}>{row.shipped}</td>

                  {/* Ending Backlog */}
                  <td
                    style={{
                      padding: '0.4rem 0.3rem',
                      color: hasBacklog ? 'var(--scada-red)' : 'var(--text-muted)',
                      fontWeight: hasBacklog ? 700 : 400,
                    }}
                  >
                    {row.backlog}
                  </td>

                  {/* Order Placed */}
                  <td
                    style={{
                      padding: '0.4rem 0.3rem',
                      color: 'var(--scada-cyan)',
                      fontWeight: 700,
                    }}
                  >
                    {row.orderPlaced}
                  </td>

                  {/* Ending Inventory */}
                  <td
                    style={{
                      padding: '0.4rem 0.3rem',
                      color: row.inventory > 0 ? 'var(--scada-green)' : 'var(--text-muted)',
                      fontWeight: 600,
                    }}
                  >
                    {row.inventory}
                  </td>

                  {/* Cost this round */}
                  <td
                    style={{
                      padding: '0.4rem 0.3rem',
                      color: hasBacklog ? 'var(--scada-red)' : 'var(--text-primary)',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                    }}
                  >
                    +${row.roundCost.toFixed(2)}
                  </td>

                  {/* Total Cost */}
                  <td
                    style={{
                      padding: '0.4rem 0.3rem',
                      color: 'var(--text-muted)',
                      fontSize: '0.7rem',
                    }}
                  >
                    ${row.totalCost.toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
