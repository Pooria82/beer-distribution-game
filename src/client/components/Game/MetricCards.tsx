import { RoleState, RoundIntermediate } from '../../../core/types.js';
import {
  IconTank,
  IconAlertTriangle,
  IconValve,
  IconActivity,
  IconGauge,
  IconPipeline,
} from '../Common/Icons.js';

export interface MetricCardsProps {
  readonly myState: RoleState;
  readonly intermediate?: RoundIntermediate | undefined;
}

export function MetricCards({ myState, intermediate }: MetricCardsProps) {
  const arrived = intermediate?.shipmentArrived ?? 0;
  const incoming = intermediate?.incomingOrder ?? 0;
  const shipped = intermediate?.shipped ?? 0;
  const transitList = myState.shipmentsInTransit ?? [];
  const transitTotal = transitList.reduce((acc: number, qty: number) => acc + qty, 0);

  // Helper for visual segmented meter bars
  const renderMeter = (value: number, max: number, type: 'green' | 'red' | 'cyan' | 'amber') => {
    const segments = 10;
    const activeCount = Math.min(segments, Math.max(0, Math.round((value / max) * segments)));

    return (
      <div className="scada-segment-meter" style={{ marginTop: '0.4rem' }}>
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={`scada-segment ${i < activeCount ? `active-${type}` : ''}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="scada-metric-grid">
      {/* 1. Inventory Silo */}
      <div className="scada-panel" style={{ padding: '0.45rem 0.65rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.64rem', fontFamily: 'var(--font-hud)', letterSpacing: '0.08em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            SILO // INVENTORY
          </span>
          <IconTank size={14} color="var(--scada-green)" />
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginTop: '0.15rem' }}>
          <span
            className="metric-num"
            style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              color: 'var(--scada-green)',
              lineHeight: 1,
            }}
          >
            {myState.inventory}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>UNITS</span>
        </div>

        {renderMeter(myState.inventory, 30, 'green')}

        <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          RATE: $0.50/u (${(myState.inventory * 0.5).toFixed(2)})
        </div>
      </div>

      {/* 2. Backlog Deficit */}
      <div
        className="scada-panel"
        style={{
          padding: '0.45rem 0.65rem',
          borderColor: myState.backlog > 0 ? 'rgba(255, 51, 102, 0.4)' : undefined,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.64rem', fontFamily: 'var(--font-hud)', letterSpacing: '0.08em', color: myState.backlog > 0 ? 'var(--scada-red)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            DEFICIT // BACKLOG
          </span>
          <IconAlertTriangle size={14} color={myState.backlog > 0 ? 'var(--scada-red)' : 'var(--text-muted)'} />
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginTop: '0.15rem' }}>
          <span
            className="metric-num"
            style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              color: myState.backlog > 0 ? 'var(--scada-red)' : 'var(--text-muted)',
              lineHeight: 1,
            }}
          >
            {myState.backlog}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>UNMET</span>
        </div>

        {renderMeter(myState.backlog, 20, 'red')}

        <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: myState.backlog > 0 ? 'var(--scada-red)' : 'var(--text-muted)', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          PENALTY: $1.00/u (${(myState.backlog * 1.0).toFixed(2)})
        </div>
      </div>

      {/* 3. Inbound Flow (Shipment Arrived) */}
      <div className="scada-panel" style={{ padding: '0.45rem 0.65rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.64rem', fontFamily: 'var(--font-hud)', letterSpacing: '0.08em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            INFLOW // SHIPMENT
          </span>
          <IconValve size={14} color="var(--scada-cyan)" />
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginTop: '0.15rem' }}>
          <span
            className="metric-num"
            style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              color: 'var(--scada-cyan)',
              lineHeight: 1,
            }}
          >
            +{arrived}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>RECEIVED</span>
        </div>

        {renderMeter(arrived, 16, 'cyan')}

        <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          UPSTREAM LEAD DRAIN: NOMINAL
        </div>
      </div>

      {/* 4. Outbound Demand Inflow */}
      <div className="scada-panel" style={{ padding: '0.45rem 0.65rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.64rem', fontFamily: 'var(--font-hud)', letterSpacing: '0.08em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            DEMAND // INCOMING
          </span>
          <IconActivity size={14} color="var(--scada-amber)" />
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginTop: '0.15rem' }}>
          <span
            className="metric-num"
            style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              color: 'var(--scada-amber)',
              lineHeight: 1,
            }}
          >
            {incoming}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ORDERED</span>
        </div>

        {renderMeter(incoming, 16, 'amber')}

        <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          DISPATCHED THIS ROUND: {shipped}
        </div>
      </div>

      {/* 5. Pipeline Transit Pipeline */}
      <div className="scada-panel" style={{ padding: '0.45rem 0.65rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.64rem', fontFamily: 'var(--font-hud)', letterSpacing: '0.08em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            TRANSIT // PIPELINE
          </span>
          <IconPipeline size={14} color="#c084fc" />
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginTop: '0.15rem' }}>
          <span
            className="metric-num"
            style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              color: '#c084fc',
              lineHeight: 1,
            }}
          >
            {transitTotal}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>IN QUEUE</span>
        </div>

        {renderMeter(transitTotal, 20, 'cyan')}

        <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          STAGES: [{transitList.join(' → ')}]
        </div>
      </div>

      {/* 6. Total Loss Accumulator */}
      <div className="scada-panel" style={{ padding: '0.45rem 0.65rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.64rem', fontFamily: 'var(--font-hud)', letterSpacing: '0.08em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            LOSS // FINANCIAL
          </span>
          <IconGauge size={14} color="var(--text-primary)" />
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginTop: '0.15rem' }}>
          <span
            className="metric-num"
            style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              lineHeight: 1,
            }}
          >
            ${myState.totalCost.toFixed(1)}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>TOTAL</span>
        </div>

        {renderMeter(myState.totalCost, 100, 'amber')}

        <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          LAST ROUND: +${myState.roundCost.toFixed(1)}
        </div>
      </div>
    </div>
  );
}
