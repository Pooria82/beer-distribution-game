import { RoleState, RoundIntermediate } from '../../../core/types.js';

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Current Inventory
          </span>
          <span style={{ fontSize: '1.1rem' }}>📦</span>
        </div>
        <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#34d399', lineHeight: 1 }}>
          {myState.inventory}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Cost: $0.50/unit (${(myState.inventory * 0.5).toFixed(2)})
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Unmet Backlog
          </span>
          <span style={{ fontSize: '1.1rem' }}>⚠️</span>
        </div>
        <div
          style={{
            fontSize: '1.85rem',
            fontWeight: 800,
            color: myState.backlog > 0 ? '#f87171' : 'var(--text-primary)',
            lineHeight: 1,
          }}
        >
          {myState.backlog}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Arrived Shipment
          </span>
          <span style={{ fontSize: '1.1rem' }}>📥</span>
        </div>
        <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#38bdf8', lineHeight: 1 }}>
          {arrived}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Incoming Order
          </span>
          <span style={{ fontSize: '1.1rem' }}>🛒</span>
        </div>
        <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fbbf24', lineHeight: 1 }}>
          {incoming}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            In-Transit Pipeline
          </span>
          <span style={{ fontSize: '1.1rem' }}>🚚</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline', marginTop: '0.25rem' }}>
          <span style={{ fontSize: '1.35rem', fontWeight: 700, color: '#c084fc' }}>
            [{myState.shipmentsInTransit.join(', ')}]
          </span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Cumulative Cost
          </span>
          <span style={{ fontSize: '1.1rem' }}>💰</span>
        </div>
        <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f472b6', lineHeight: 1 }}>
          ${myState.totalCost.toFixed(2)}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Round Cost: ${myState.roundCost.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
