import { useState } from 'react';
import { RoundRecord, RoleType } from '../../../core/types.js';

export interface BullwhipChartProps {
  readonly history: readonly RoundRecord[];
  readonly myRole: RoleType;
}

export function BullwhipChart({ history, myRole }: BullwhipChartProps) {
  const [hoveredRound, setHoveredRound] = useState<number | null>(null);

  // Baseline MIT customer demand profile (Rounds 1-4: 4, Rounds 5-20: 8)
  const getCustomerDemand = (r: number) => (r <= 4 ? 4 : 8);

  const rounds = Array.from({ length: 20 }, (_, i) => i + 1);

  // Compute scale boundaries
  const orderValues = history.map((h) => h.orderPlaced);
  const maxOrder = Math.max(16, ...orderValues, ...rounds.map(getCustomerDemand));
  const chartHeight = 260;
  const chartWidth = 720;
  const paddingX = 50;
  const paddingY = 30;

  const getX = (round: number) => paddingX + ((round - 1) / 19) * (chartWidth - paddingX * 2);
  const getY = (val: number) => chartHeight - paddingY - (val / (maxOrder * 1.15)) * (chartHeight - paddingY * 2);

  // Build SVG path strings
  const demandPoints = rounds.map((r) => `${getX(r)},${getY(getCustomerDemand(r))}`).join(' ');
  const orderPoints = history.map((h) => `${getX(h.round)},${getY(h.orderPlaced)}`).join(' ');

  // Variance calculation for Bullwhip Effect measurement
  const calcVariance = (vals: number[]) => {
    if (vals.length <= 1) return 0;
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    return vals.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (vals.length - 1);
  };

  const demandVariance = calcVariance(rounds.map(getCustomerDemand));
  const orderVariance = calcVariance(orderValues.length > 0 ? orderValues : [4]);
  const bullwhipRatio = demandVariance > 0 ? (orderVariance / demandVariance).toFixed(2) : '1.00';

  const hoveredRecord = hoveredRound ? history.find((h) => h.round === hoveredRound) : null;

  return (
    <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.25rem' }}>📈</span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Bullwhip Effect Analysis</h3>
            <span
              className="badge"
              style={{
                background: parseFloat(bullwhipRatio) > 1.2 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: parseFloat(bullwhipRatio) > 1.2 ? '#f87171' : '#34d399',
                border: `1px solid ${parseFloat(bullwhipRatio) > 1.2 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              }}
            >
              Variance Ratio: {bullwhipRatio}x
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Contrasting Customer Demand against orders placed by {myRole} across all 20 rounds.
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '16px', height: '3px', background: '#38bdf8', display: 'inline-block' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Customer Demand</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '16px', height: '3px', background: '#a855f7', display: 'inline-block' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Your Orders ({myRole})</span>
          </div>
        </div>
      </div>

      {/* Responsive SVG Chart */}
      <div style={{ width: '100%', overflowX: 'auto', position: 'relative' }}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          style={{ width: '100%', minWidth: '600px', height: 'auto', display: 'block' }}
        >
          {/* Horizontal Grid lines */}
          {[0, 4, 8, 12, 16, 20].map((val) => {
            if (val > maxOrder * 1.1) return null;
            const y = getY(val);
            return (
              <g key={val}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={chartWidth - paddingX}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.07)"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 10}
                  y={y + 4}
                  fill="var(--text-muted)"
                  fontSize="10"
                  textAnchor="end"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* X Axis line */}
          <line
            x1={paddingX}
            y1={chartHeight - paddingY}
            x2={chartWidth - paddingX}
            y2={chartHeight - paddingY}
            stroke="rgba(255, 255, 255, 0.2)"
          />

          {/* X Axis Round Labels */}
          {rounds.map((r) => {
            if (r % 2 !== 0 && r !== 20) return null;
            return (
              <text
                key={r}
                x={getX(r)}
                y={chartHeight - 10}
                fill="var(--text-muted)"
                fontSize="10"
                textAnchor="middle"
              >
                R{r}
              </text>
            );
          })}

          {/* Customer Demand Line */}
          <polyline
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeDasharray="5 5"
            points={demandPoints}
          />

          {/* Orders Placed Line */}
          {orderValues.length > 0 && (
            <polyline
              fill="none"
              stroke="#a855f7"
              strokeWidth="3"
              points={orderPoints}
            />
          )}

          {/* Interactive Data Dots for Orders */}
          {history.map((h) => {
            const x = getX(h.round);
            const y = getY(h.orderPlaced);
            const isHovered = hoveredRound === h.round;

            return (
              <circle
                key={h.round}
                cx={x}
                cy={y}
                r={isHovered ? 6 : 4}
                fill={isHovered ? '#ffffff' : '#a855f7'}
                stroke="#6b21a8"
                strokeWidth={isHovered ? 3 : 1.5}
                style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                onMouseEnter={() => setHoveredRound(h.round)}
                onMouseLeave={() => setHoveredRound(null)}
              />
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredRecord && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '20px',
              padding: '0.65rem 0.85rem',
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
              fontSize: '0.8rem',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              Round {hoveredRecord.round} Metrics
            </div>
            <div style={{ color: '#38bdf8' }}>Customer Demand: {getCustomerDemand(hoveredRecord.round)}</div>
            <div style={{ color: '#c084fc', fontWeight: 600 }}>Your Order: {hoveredRecord.orderPlaced}</div>
            <div style={{ color: '#34d399' }}>Ending Inventory: {hoveredRecord.inventory}</div>
            {hoveredRecord.backlog > 0 && (
              <div style={{ color: '#f87171' }}>Ending Backlog: {hoveredRecord.backlog}</div>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: '1rem',
          padding: '0.85rem 1rem',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.825rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          border: '1px solid var(--border-subtle)',
        }}
      >
        <strong>The Bullwhip Effect Phenomenon:</strong> When customer demand jumped from 4 to 8 units in Round 5, order variability amplified as signals propagated upstream due to 2-round pipeline delays and lack of centralized visibility.
      </div>
    </div>
  );
}
