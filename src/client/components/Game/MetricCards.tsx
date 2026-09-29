import { RoleState, RoundIntermediate } from '../../../core/types.js';
import {
  IconInventory,
  IconBacklog,
  IconArrived,
  IconIncomingOrder,
  IconDistributor,
  IconCost,
} from '../Common/Icons.js';

export interface MetricCardsProps {
  readonly myState: RoleState;
  readonly intermediate?: RoundIntermediate | undefined;
}

export function MetricCards({ myState, intermediate }: MetricCardsProps) {
  const arrived = intermediate?.shipmentArrived ?? 0;
  const incoming = intermediate?.incomingOrder ?? 0;
  const shipped = intermediate?.shipped ?? 0;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '1.75rem',
      }}
    >
      {/* 1. Inventory Card */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem',
          borderLeft: '4px solid #10b981',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Current Inventory
          </span>
          <div style={{ color: '#34d399' }}><IconInventory size={18} /></div>
        </div>
        <div className="metric-num" style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399', lineHeight: 1 }}>
          {myState.inventory}
        </div>
        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.6rem' }}>
          Holding: $0.50/unit (${(myState.inventory * 0.5).toFixed(2)})
        </div>
      </div>

      {/* 2. Backlog Card */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem',
          borderLeft: `4px solid ${myState.backlog > 0 ? '#ef4444' : 'var(--border-subtle)'}`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Unmet Backlog
          </span>
          <div style={{ color: myState.backlog > 0 ? '#f87171' : 'var(--text-muted)' }}>
            <IconBacklog size={18} />
          </div>
        </div>
        <div
          className="metric-num"
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: myState.backlog > 0 ? '#f87171' : 'var(--text-primary)',
            lineHeight: 1,
          }}
        >
          {myState.backlog}
        </div>
        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.6rem' }}>
          Penalty: $1.00/unit (${(myState.backlog * 1.0).toFixed(2)})
        </div>
      </div>

      {/* 3. Arrived Shipment Card */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem',
          borderLeft: '4px solid #06b6d4',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Arrived Shipment
          </span>
          <div style={{ color: '#38bdf8' }}><IconArrived size={18} /></div>
        </div>
        <div className="metric-num" style={{ fontSize: '2rem', fontWeight: 800, color: '#38bdf8', lineHeight: 1 }}>
          {arrived}
        </div>
        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.6rem' }}>
          Received from upstream
        </div>
      </div>

      {/* 4. Incoming Order Card */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem',
          borderLeft: '4px solid #f59e0b',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Incoming Demand
          </span>
          <div style={{ color: '#fbbf24' }}><IconIncomingOrder size={18} /></div>
        </div>
        <div className="metric-num" style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24', lineHeight: 1 }}>
          {incoming}
        </div>
        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.6rem' }}>
          Shipped downstream: {shipped}
        </div>
      </div>

      {/* 5. In-Transit Pipeline Card */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem',
          borderLeft: '4px solid #8b5cf6',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            In-Transit Queue
          </span>
          <div style={{ color: '#c084fc' }}><IconDistributor size={18} /></div>
        </div>
        <div className="metric-num" style={{ fontSize: '1.45rem', fontWeight: 700, color: '#c084fc', lineHeight: 1.2 }}>
          [{myState.shipmentsInTransit.join(', ')}]
        </div>
        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.6rem' }}>
          [Due Next, Due in 2 Rounds]
        </div>
      </div>

      {/* 6. Cumulative Cost Card */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem',
          borderLeft: '4px solid #ec4899',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Cumulative Cost
          </span>
          <div style={{ color: '#f472b6' }}><IconCost size={18} /></div>
        </div>
        <div className="metric-num" style={{ fontSize: '2rem', fontWeight: 800, color: '#f472b6', lineHeight: 1 }}>
          ${myState.totalCost.toFixed(2)}
        </div>
        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.6rem' }}>
          Round Cost: ${myState.roundCost.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
