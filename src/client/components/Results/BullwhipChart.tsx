import React, { useState, useRef } from 'react';
import { RoundRecord, RoleType } from '../../../core/types.js';
import { IconActivity, IconCrosshair } from '../Common/Icons.js';

export interface BullwhipChartProps {
  readonly history: readonly RoundRecord[];
  readonly myRole: RoleType;
}

export function BullwhipChart({ history, myRole }: BullwhipChartProps) {
  const [hoveredRound, setHoveredRound] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Baseline MIT customer demand profile (Rounds 1-4: 4, Rounds 5-20: 8)
  const getCustomerDemand = (r: number) => (r <= 4 ? 4 : 8);
  const rounds = Array.from({ length: 20 }, (_, i) => i + 1);

  // Extract order series
  const orderValues = history.map((h) => h.orderPlaced);
  const incomingValues = history.map((h) => h.incomingOrder);
  const demandBaseline = rounds.map(getCustomerDemand);
  const rawMax = Math.max(16, ...orderValues, ...incomingValues, ...demandBaseline);

  // Chart geometry & dimensions
  const chartHeight = 280;
  const chartWidth = 840;
  const paddingLeft = 55;
  const paddingRight = 35;
  const paddingTop = 25;
  const paddingBottom = 40;

  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  // Dense, human-friendly Y-axis tick intervals
  let step = 4;
  if (rawMax > 120) step = 20;
  else if (rawMax > 60) step = 10;
  else if (rawMax > 28) step = 8;
  else if (rawMax > 12) step = 4;
  else step = 2;

  const yMax = Math.max(step * 4, Math.ceil((rawMax * 1.12) / step) * step);
  const yTicks: number[] = [];
  for (let val = 0; val <= yMax; val += step) {
    yTicks.push(val);
  }

  // Coordinate mapping functions
  const getX = (round: number) => paddingLeft + ((round - 1) / 19) * plotWidth;
  const getY = (val: number) => paddingTop + plotHeight - (val / yMax) * plotHeight;

  // Build SVG path strings
  const demandPoints = rounds.map((r) => `${getX(r)},${getY(getCustomerDemand(r))}`).join(' ');
  const orderPoints = history.map((h) => `${getX(h.round)},${getY(h.orderPlaced)}`).join(' ');

  // Statistical metrics for header readout
  const peakOrder = orderValues.length > 0 ? Math.max(...orderValues) : 4;
  const minOrder = orderValues.length > 0 ? Math.min(...orderValues) : 4;
  const avgOrder =
    orderValues.length > 0
      ? (orderValues.reduce((acc, v) => acc + v, 0) / orderValues.length).toFixed(1)
      : '4.0';

  // Variance calculation for Bullwhip Amplification Ratio
  const calcVariance = (vals: number[]) => {
    if (vals.length <= 1) return 0;
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    return vals.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (vals.length - 1);
  };

  const demandVariance = calcVariance(demandBaseline);
  const orderVariance = calcVariance(orderValues.length > 0 ? orderValues : [4]);
  const bullwhipRatio = demandVariance > 0 ? (orderVariance / demandVariance).toFixed(2) : '1.00';

  // Mouse hover event handler snapping to nearest round smoothly
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement> | React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * chartWidth;

    const ratio = (mouseX - paddingLeft) / plotWidth;
    const rawRound = Math.round(1 + ratio * 19);
    const clampedRound = Math.max(1, Math.min(20, rawRound));
    setHoveredRound(clampedRound);
  };

  const handlePointerLeave = () => {
    setHoveredRound(null);
  };

  const hoveredRecord = hoveredRound ? history.find((h) => h.round === hoveredRound) : null;
  const hoveredOrder = hoveredRecord ? hoveredRecord.orderPlaced : (hoveredRound ? getCustomerDemand(hoveredRound) : 0);
  const hoveredDemand = hoveredRound ? getCustomerDemand(hoveredRound) : 0;

  // Selected X and Y for cursor reticle
  const activeX = hoveredRound ? getX(hoveredRound) : 0;
  const activeY = hoveredRound ? getY(hoveredOrder) : 0;

  return (
    <div className="scada-panel" style={{ width: '100%', marginBottom: '1rem' }}>
      {/* Panel Header */}
      <div className="scada-panel-header" style={{ flexWrap: 'wrap', gap: '0.65rem' }}>
        <div className="scada-panel-title">
          <IconActivity size={15} color="var(--scada-green)" />
          <span>OSCILLOSCOPE // BULLWHIP EFFECT WAVEFORM ANALYZER</span>
          <span className="scada-badge" style={{ fontSize: '0.65rem', marginLeft: '0.35rem' }}>
            STATION // {myRole.toUpperCase()}
          </span>
        </div>

        {/* Telemetry Stats Strip */}
        <div className="scada-chart-stats">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: 'var(--text-muted)' }}>PEAK:</span>
            <strong style={{ color: 'var(--scada-cyan)' }}>{peakOrder}u</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: 'var(--text-muted)' }}>MIN:</span>
            <strong style={{ color: 'var(--text-primary)' }}>{minOrder}u</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: 'var(--text-muted)' }}>AVG:</span>
            <strong style={{ color: 'var(--text-primary)' }}>{avgOrder}u</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', paddingLeft: '0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-hud)' }}>AMPLIFICATION:</span>
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
      </div>

      <div className="scada-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Oscilloscope Phosphor Display Container */}
        <div
          style={{
            position: 'relative',
            background: 'radial-gradient(ellipse at center, #050d18 0%, #020509 100%)',
            border: '1px solid var(--border-panel-bright)',
            borderRadius: 'var(--radius-xs)',
            overflow: 'hidden',
          }}
        >
          {/* Oscilloscope CRT Scanlines & Grid Texture */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'linear-gradient(rgba(0, 255, 157, 0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 157, 0.035) 1px, transparent 1px)',
              backgroundSize: '42px 28px',
              pointerEvents: 'none',
            }}
          />

          <svg
            ref={svgRef}
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            onPointerDown={handlePointerMove}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            onMouseMove={handlePointerMove}
            onMouseLeave={handlePointerLeave}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              position: 'relative',
              zIndex: 1,
              cursor: 'crosshair',
              userSelect: 'none',
              touchAction: 'none',
            }}
          >
            <defs>
              {/* Cyan Waveform Area Gradient */}
              <linearGradient id="orderWaveformGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.25" />
                <stop offset="60%" stopColor="#00f0ff" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.0" />
              </linearGradient>

              {/* Glowing Line Drop Shadow Filter */}
              <filter id="scadaGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Dense Horizontal Division Lines & Y-Axis Labels */}
            {yTicks.map((val) => {
              const y = getY(val);
              const isBaseline = val === 0;

              return (
                <g key={val} pointerEvents="none">
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={chartWidth - paddingRight}
                    y2={y}
                    stroke={isBaseline ? 'rgba(0, 240, 255, 0.35)' : 'rgba(255, 255, 255, 0.07)'}
                    strokeWidth={isBaseline ? '1.5' : '1'}
                    strokeDasharray={isBaseline ? undefined : '2 3'}
                  />
                  <text
                    x={paddingLeft - 10}
                    y={y + 3.5}
                    textAnchor="end"
                    fill={isBaseline ? 'var(--scada-cyan)' : 'var(--text-muted)'}
                    fontSize="9.5"
                    fontFamily="var(--font-mono)"
                    fontWeight={isBaseline ? 700 : 400}
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Vertical Milestone Grid Lines & X-Axis Round Labels */}
            {rounds.map((r) => {
              const x = getX(r);
              const isMajor = r === 1 || r === 5 || r === 10 || r === 15 || r === 20;
              const isMitShock = r === 5;

              return (
                <g key={r} pointerEvents="none">
                  {/* Subtle vertical tick line */}
                  <line
                    x1={x}
                    y1={getY(0)}
                    x2={x}
                    y2={getY(0) + (isMajor ? 6 : 3)}
                    stroke={isMitShock ? 'var(--scada-amber)' : 'rgba(255, 255, 255, 0.2)'}
                    strokeWidth="1"
                  />

                  {/* Round number on axis */}
                  {isMajor && (
                    <text
                      x={x}
                      y={getY(0) + 18}
                      textAnchor="middle"
                      fill={isMitShock ? 'var(--scada-amber)' : 'var(--text-muted)'}
                      fontSize="9"
                      fontFamily="var(--font-mono)"
                      fontWeight={isMitShock ? 700 : 500}
                    >
                      R{r.toString().padStart(2, '0')}
                    </text>
                  )}
                </g>
              );
            })}

            {/* MIT Demand Shock Boundary Marker (Round 5) */}
            <g pointerEvents="none">
              <line
                x1={getX(5)}
                y1={paddingTop}
                x2={getX(5)}
                y2={getY(0)}
                stroke="rgba(245, 158, 11, 0.35)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <rect
                x={getX(5) - 36}
                y={paddingTop + 2}
                width="72"
                height="14"
                rx="2"
                fill="rgba(5, 12, 22, 0.85)"
                stroke="rgba(245, 158, 11, 0.5)"
                strokeWidth="0.8"
              />
              <text
                x={getX(5)}
                y={paddingTop + 12}
                textAnchor="middle"
                fill="var(--scada-amber)"
                fontSize="7.5"
                fontFamily="var(--font-hud)"
                fontWeight="700"
                letterSpacing="0.04em"
              >
                MIT JUMP (4→8)
              </text>
            </g>

            {/* Customer Demand Signal Line (Neon Green Stepped Line) */}
            <polyline
              points={demandPoints}
              fill="none"
              stroke="var(--scada-green)"
              strokeWidth="1.8"
              strokeDasharray="4 3"
              pointerEvents="none"
            />

            {/* Orders Area Fill */}
            {history.length > 0 && (
              <polygon
                points={`${getX(1)},${getY(0)} ${orderPoints} ${getX(history[history.length - 1]!.round)},${getY(0)}`}
                fill="url(#orderWaveformGlow)"
                pointerEvents="none"
              />
            )}

            {/* Orders Placed Waveform (Cyan Solid Line with Glow) */}
            {history.length > 0 && (
              <polyline
                points={orderPoints}
                fill="none"
                stroke="var(--scada-cyan)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#scadaGlowFilter)"
                pointerEvents="none"
              />
            )}

            {/* Data Points on Waveform */}
            {history.map((h) => {
              const cx = getX(h.round);
              const cy = getY(h.orderPlaced);
              const isHovered = hoveredRound === h.round;

              return (
                <circle
                  key={h.round}
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 5.5 : 3.5}
                  fill={isHovered ? '#ffffff' : 'var(--scada-cyan)'}
                  stroke="var(--bg-app)"
                  strokeWidth="1.5"
                  pointerEvents="none"
                />
              );
            })}

            {/* Full-Height Crosshair Vertical & Horizontal Guidelines */}
            {hoveredRound !== null && (
              <g pointerEvents="none">
                {/* Vertical guideline spanning top to bottom */}
                <line
                  x1={activeX}
                  y1={paddingTop}
                  x2={activeX}
                  y2={getY(0)}
                  stroke="var(--scada-amber)"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />

                {/* Horizontal guideline from Y-axis to point */}
                {hoveredRecord && (
                  <line
                    x1={paddingLeft}
                    y1={activeY}
                    x2={activeX}
                    y2={activeY}
                    stroke="rgba(0, 240, 255, 0.4)"
                    strokeWidth="1"
                    strokeDasharray="2 3"
                  />
                )}

                {/* Reticle Target Ring on Active Point */}
                {hoveredRecord && (
                  <>
                    <circle
                      cx={activeX}
                      cy={activeY}
                      r="9"
                      fill="rgba(245, 158, 11, 0.15)"
                      stroke="var(--scada-amber)"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx={activeX}
                      cy={activeY}
                      r="3.5"
                      fill="#ffffff"
                      stroke="var(--scada-cyan)"
                      strokeWidth="1.5"
                    />
                  </>
                )}
              </g>
            )}
          </svg>

          {/* Floating SCADA HUD Telemetry Tooltip Card */}
          {hoveredRound !== null && hoveredRecord && (
            <div
              style={{
                position: 'absolute',
                left: `${(activeX / chartWidth) * 100}%`,
                top: `${(Math.max(paddingTop + 5, activeY) / chartHeight) * 100}%`,
                transform: `translate(${hoveredRound > 14 ? '-106%' : hoveredRound < 5 ? '8%' : '-50%'}, -112%)`,
                pointerEvents: 'none',
                zIndex: 10,
                background: 'rgba(5, 12, 22, 0.96)',
                border: '1px solid var(--scada-amber)',
                boxShadow: '0 0 16px rgba(245, 158, 11, 0.3), 0 8px 24px rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(8px)',
                borderRadius: 'var(--radius-xs)',
                padding: '0.45rem 0.65rem',
                minWidth: '190px',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-primary)',
                transition: 'left 40ms ease, top 40ms ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  paddingBottom: '0.25rem',
                  marginBottom: '0.35rem',
                }}
              >
                <span style={{ fontFamily: 'var(--font-hud)', fontWeight: 700, color: 'var(--scada-amber)', letterSpacing: '0.06em', fontSize: '0.75rem' }}>
                  ROUND #{hoveredRound.toString().padStart(2, '0')} // TELEMETRY
                </span>
                <span
                  className="scada-badge"
                  style={{
                    fontSize: '0.6rem',
                    padding: '0.1rem 0.35rem',
                    color: hoveredRound <= 4 ? 'var(--scada-green)' : 'var(--scada-amber)',
                    borderColor: hoveredRound <= 4 ? 'rgba(0, 255, 157, 0.3)' : 'rgba(245, 158, 11, 0.3)',
                  }}
                >
                  {hoveredRound <= 4 ? 'STEADY' : 'SURGE'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.22rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--scada-cyan)' }}>TRANSMITTED ORDER:</span>
                  <strong style={{ color: 'var(--scada-cyan)' }}>{hoveredRecord.orderPlaced} u</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--scada-green)' }}>CUSTOMER DEMAND:</span>
                  <strong style={{ color: 'var(--scada-green)' }}>{hoveredDemand} u</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>INVENTORY STOCK:</span>
                  <strong style={{ color: hoveredRecord.inventory > 0 ? 'var(--scada-green)' : 'var(--text-muted)' }}>
                    {hoveredRecord.inventory} u
                  </strong>
                </div>

                {hoveredRecord.backlog > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--scada-red)' }}>DEFICIT BACKLOG:</span>
                    <strong style={{ color: 'var(--scada-red)' }}>{hoveredRecord.backlog} u</strong>
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    paddingTop: '0.25rem',
                    marginTop: '0.15rem',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>ROUND CHARGE:</span>
                  <strong style={{ color: '#ffffff' }}>${hoveredRecord.roundCost.toFixed(2)}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Legend & Real-Time Probe Status Readout */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            padding: '0.5rem 0.75rem',
            background: 'var(--bg-panel-inset)',
            border: '1px solid var(--border-panel)',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {/* Signal Waveform Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ width: '14px', height: '2px', borderTop: '2px dashed var(--scada-green)', display: 'inline-block' }} />
              <span style={{ color: 'var(--scada-green)' }}>EXOGENOUS CUSTOMER DEMAND (4 → 8)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ width: '14px', height: '2.5px', background: 'var(--scada-cyan)', boxShadow: '0 0 6px #00f0ff', display: 'inline-block' }} />
              <span style={{ color: 'var(--scada-cyan)' }}>STATION TRANSMITTED ORDERS</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', border: '1.5px solid var(--scada-amber)', display: 'inline-block' }} />
              <span style={{ color: 'var(--scada-amber)' }}>INTERACTIVE PROBE RETICLE</span>
            </div>
          </div>

          {/* Active Probe Banner */}
          {hoveredRecord ? (
            <div style={{ color: 'var(--scada-amber)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <IconCrosshair size={14} color="var(--scada-amber)" />
              <span>
                [PROBE RND #{hoveredRecord.round}]: DEMAND={hoveredDemand} | ORDER={hoveredRecord.orderPlaced} | STOCK={hoveredRecord.inventory} | BACKLOG={hoveredRecord.backlog} | CHARGE=${hoveredRecord.roundCost.toFixed(2)}
              </span>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <IconCrosshair size={14} color="var(--text-muted)" />
              <span>MOVE CURSOR OVER WAVEFORM TO PROBE ANY ROUND</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
