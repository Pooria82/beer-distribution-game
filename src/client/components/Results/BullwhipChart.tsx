import { useState } from 'react';
import { RoundRecord, RoleType } from '../../../core/types.js';
import { IconActivity, IconCrosshair } from '../Common/Icons.js';

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
  const chartHeight = 240;
  const chartWidth = 780;
  const paddingX = 50;
  const paddingY = 25;

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
    <div className="scada-panel" style={{ width: '100%', marginBottom: '1rem' }}>
      {/* Panel Header */}
      <div className="scada-panel-header">
        <div className="scada-panel-title">
          <IconActivity size={15} color="var(--scada-green)" />
          <span>OSCILLOSCOPE // BULLWHIP EFFECT WAVEFORM ANALYZER</span>
          <span className="scada-badge" style={{ fontSize: '0.65rem', marginLeft: '0.4rem' }}>
            STATION // {myRole.toUpperCase()}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>AMPLIFICATION FACTOR:</span>
          <span
            className="metric-num"
            style={{
              color: parseFloat(bullwhipRatio) > 2 ? 'var(--scada-amber)' : 'var(--scada-green)',
              fontWeight: 800,
              fontSize: '0.9rem',
            }}
          >
            {bullwhipRatio}x VARIANCE
          </span>
        </div>
      </div>

      <div className="scada-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Oscilloscope Phosphor Display */}
        <div
          style={{
            position: 'relative',
            background: '#04070a',
            border: '1px solid var(--border-panel-bright)',
            borderRadius: 'var(--radius-xs)',
            overflow: 'hidden',
          }}
        >
          {/* Technical Scope Grid Background */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'linear-gradient(rgba(0, 255, 157, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 157, 0.05) 1px, transparent 1px)',
              backgroundSize: '39px 30px',
              pointerEvents: 'none',
            }}
          />

          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            style={{ width: '100%', height: 'auto', display: 'block', position: 'relative', zIndex: 1 }}
          >
            <defs>
              <linearGradient id="orderScadaGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Division Lines */}
            {[0, Math.round(maxOrder / 2), Math.round(maxOrder)].map((val) => (
              <g key={val}>
                <line
                  x1={paddingX}
                  y1={getY(val)}
                  x2={chartWidth - paddingX}
                  y2={getY(val)}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <text
                  x={paddingX - 10}
                  y={getY(val) + 4}
                  textAnchor="end"
                  fill="var(--text-muted)"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                >
                  {val}
                </text>
              </g>
            ))}

            {/* Customer Demand Signal Line (Green Stepped Line) */}
            <polyline
              points={demandPoints}
              fill="none"
              stroke="var(--scada-green)"
              strokeWidth="2"
              strokeDasharray="4 4"
            />

            {/* Orders Area Glow */}
            {history.length > 0 && (
              <polygon
                points={`${getX(1)},${getY(0)} ${orderPoints} ${getX(history[history.length - 1]!.round)},${getY(0)}`}
                fill="url(#orderScadaGlow)"
              />
            )}

            {/* Orders Placed Waveform (Cyan Solid Line) */}
            {history.length > 0 && (
              <polyline
                points={orderPoints}
                fill="none"
                stroke="var(--scada-cyan)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Interactive Data Probe Dots */}
            {history.map((h) => {
              const cx = getX(h.round);
              const cy = getY(h.orderPlaced);
              const isHovered = hoveredRound === h.round;

              return (
                <g key={h.round}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 6 : 3.5}
                    fill={isHovered ? '#ffffff' : 'var(--scada-cyan)'}
                    stroke="var(--bg-app)"
                    strokeWidth="1.5"
                  />
                  {/* Invisible Hover Anchor */}
                  <rect
                    x={cx - 15}
                    y={0}
                    width={30}
                    height={chartHeight}
                    fill="transparent"
                    style={{ cursor: 'crosshair' }}
                    onMouseEnter={() => setHoveredRound(h.round)}
                    onMouseLeave={() => setHoveredRound(null)}
                  />
                </g>
              );
            })}

            {/* Cursor Crosshair Line when hovered */}
            {hoveredRound && (
              <line
                x1={getX(hoveredRound)}
                y1={paddingY}
                x2={getX(hoveredRound)}
                y2={chartHeight - paddingY}
                stroke="var(--scada-amber)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            )}
          </svg>
        </div>

        {/* Legend & Probe Inspector Readout */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            padding: '0.45rem 0.65rem',
            background: 'var(--bg-panel-inset)',
            border: '1px solid var(--border-panel)',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ width: '12px', height: '2px', background: 'var(--scada-green)', display: 'inline-block' }} />
              <span style={{ color: 'var(--scada-green)' }}>EXOGENOUS CUSTOMER DEMAND (4 → 8)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ width: '12px', height: '2.5px', background: 'var(--scada-cyan)', display: 'inline-block' }} />
              <span style={{ color: 'var(--scada-cyan)' }}>STATION TRANSMITTED ORDERS</span>
            </div>
          </div>

          {hoveredRecord ? (
            <div style={{ color: 'var(--scada-amber)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <IconCrosshair size={13} color="var(--scada-amber)" />
              <span>[PROBE RND #{hoveredRecord.round}]: DEMAND={getCustomerDemand(hoveredRecord.round)} | ORDER={hoveredRecord.orderPlaced} | BACKLOG={hoveredRecord.backlog}</span>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <IconCrosshair size={13} color="var(--text-muted)" />
              <span>HOVER OVER WAVEFORM TO PROBE TELEMETRY</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
