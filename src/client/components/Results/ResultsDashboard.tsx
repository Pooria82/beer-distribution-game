import { PlayerView } from '../../../core/types.js';
import { CostSummary } from './CostSummary.js';
import { BullwhipChart } from './BullwhipChart.js';
import { HistoryTable } from '../Game/HistoryTable.js';

export interface ResultsDashboardProps {
  readonly view: PlayerView;
  readonly onPlayAgain: () => void;
}

export function ResultsDashboard({ view, onPlayAgain }: ResultsDashboardProps) {
  const { totalChainCost, finalScores, myRole, myState, gameId } = view;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem', width: '100%' }}>
      {/* Top Completion Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2.5rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '2rem' }}>🏆</span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              <span className="gradient-text">Simulation Complete</span>
            </h1>
            <span
              className="badge"
              style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}
            >
              20 Rounds Concluded
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
            Fog-of-war has been lifted. Full supply chain performance metrics and costs are revealed below.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Session ID</span>
            <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{gameId}</strong>
          </div>

          <button
            type="button"
            onClick={onPlayAgain}
            className="btn btn-primary"
            style={{ padding: '0.65rem 1.25rem' }}
          >
            🔄 New Session / Play Again
          </button>
        </div>
      </header>

      {/* 1. Final Cost Breakdown Across Roles */}
      <CostSummary
        totalChainCost={totalChainCost}
        finalScores={finalScores}
        myRole={myRole}
        myTotalCost={myState.totalCost}
      />

      {/* 2. Interactive Bullwhip Effect Variance Line Chart */}
      <BullwhipChart history={myState.history} myRole={myRole} />

      {/* 3. Detailed Round-by-Round Ledger */}
      <div style={{ marginTop: '2rem' }}>
        <HistoryTable history={myState.history} />
      </div>
    </div>
  );
}
