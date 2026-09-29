import { PlayerView } from '../../../core/types.js';
import { SocketConnectionStatus } from '../../hooks/useGameSocket.js';
import { SupplyChainCanvas } from './SupplyChainCanvas.js';
import { MetricCards } from './MetricCards.js';
import { OrderForm } from './OrderForm.js';
import { HistoryTable } from './HistoryTable.js';

export interface GameDashboardProps {
  readonly view: PlayerView;
  readonly connectionStatus: SocketConnectionStatus;
  readonly error?: string | null | undefined;
  readonly onSubmitOrder: (order: number) => void;
  readonly onSimulateRound?: (() => void) | undefined;
  readonly onLeaveRoom: () => void;
  readonly roundAdvancedNotice?: number | null | undefined;
}

export function GameDashboard({
  view,
  connectionStatus,
  error,
  onSubmitOrder,
  onSimulateRound,
  onLeaveRoom,
  roundAdvancedNotice,
}: GameDashboardProps) {
  const { currentRound, totalRounds, myRole, myState, peers, currentIntermediate } = view;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.75rem 1.5rem', width: '100%' }}>
      {/* Top Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '2rem' }}>🍺</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                Round {currentRound} <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>/ {totalRounds}</span>
              </h2>
              <span className={`badge badge-${myRole}`}>
                {myRole}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem', marginTop: '0.2rem' }}>
              <span>Room: <strong>{view.gameId}</strong></span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: connectionStatus === 'connected' ? 'var(--status-success)' : 'var(--status-warning)',
                    display: 'inline-block',
                  }}
                />
                {connectionStatus === 'connected' ? 'Connected' : connectionStatus}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={onLeaveRoom}
            className="btn btn-ghost"
            style={{ fontSize: '0.85rem' }}
          >
            Exit to Lobby
          </button>
        </div>
      </header>

      {/* Round Advanced Announcement Toast */}
      {roundAdvancedNotice && (
        <div
          className="animate-fade-in"
          style={{
            padding: '0.75rem 1.25rem',
            background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            fontWeight: 600,
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>🎉</span>
          <span>Round {roundAdvancedNotice} has commenced! All roles submitted orders in lockstep.</span>
        </div>
      )}

      {/* Error Alert Banner */}
      {error && (
        <div
          style={{
            padding: '0.75rem 1.25rem',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 'var(--radius-md)',
            color: '#fca5a5',
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* 1. Supply Chain Architecture Canvas */}
      <SupplyChainCanvas myRole={myRole} peers={peers} currentRound={currentRound} />

      {/* 2. Current Round Metric Cards */}
      <MetricCards myState={myState} intermediate={currentIntermediate} />

      {/* 3. Order Placement Action Panel */}
      <OrderForm
        currentRound={currentRound}
        myState={myState}
        onSubmitOrder={onSubmitOrder}
        onSimulateRound={onSimulateRound}
      />

      {/* 4. Past Rounds Ledger Table */}
      <HistoryTable history={myState.history} />
    </div>
  );
}
