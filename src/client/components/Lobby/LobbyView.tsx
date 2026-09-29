import { RoleType, PeerSummary } from '../../../core/types.js';
import { RoomCreate } from './RoomCreate.js';
import { RoleSelection } from './RoleSelection.js';
import { ReviewerQuickStart } from './ReviewerQuickStart.js';

export interface LobbyViewProps {
  readonly roomId: string | null;
  readonly currentRole: RoleType | null;
  readonly peers?: Readonly<Record<RoleType, PeerSummary>> | undefined;
  readonly gameStarted?: boolean | undefined;
  readonly onRoomCreated: (roomId: string) => void;
  readonly onRoomJoined: (roomId: string) => void;
  readonly onSelectRole: (role: RoleType) => void;
  readonly onLeaveRoom: () => void;
  readonly error?: string | null | undefined;
}

export function LobbyView({
  roomId,
  currentRole,
  peers,
  gameStarted = false,
  onRoomCreated,
  onRoomJoined,
  onSelectRole,
  onLeaveRoom,
  error,
}: LobbyViewProps) {
  // Count how many roles are occupied
  const occupiedCount = peers
    ? Object.values(peers).filter((p) => p.isOccupied).length
    : currentRole
      ? 1
      : 0;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem', width: '100%' }}>
      {/* Top Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2.5rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '2rem' }}>🍻</span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              <span className="gradient-text">Beer Distribution Game</span>
            </h1>
            <span
              className="badge"
              style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
            >
              MIT Simulation Engine
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
            Authoritative Turn-Based Supply Chain Simulation with Real-Time WebSockets & Fog-of-War.
          </p>
        </div>

        {roomId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              className="badge"
              style={{
                fontSize: '0.9rem',
                padding: '0.5rem 0.85rem',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--text-primary)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                letterSpacing: '0.075em',
              }}
            >
              ROOM: <strong style={{ color: 'var(--text-accent)', marginLeft: '0.25rem' }}>{roomId}</strong>
            </div>

            <button
              type="button"
              onClick={onLeaveRoom}
              className="btn btn-ghost"
              style={{ fontSize: '0.85rem', padding: '0.45rem 0.75rem' }}
            >
              Leave Room
            </button>
          </div>
        )}
      </header>

      {/* Error Banner */}
      {error && (
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 'var(--radius-md)',
            color: '#fca5a5',
            fontSize: '0.925rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Main Content Area */}
      {!roomId ? (
        <>
          <RoomCreate onRoomCreated={onRoomCreated} onRoomJoined={onRoomJoined} />

          {/* Game Rules Summary Box */}
          <div
            className="glass-panel"
            style={{
              maxWidth: '640px',
              margin: '2rem auto 0',
              padding: '1.5rem',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}
          >
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📋</span> Game Principles & Costs
            </h4>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li><strong>20 Rounds Total:</strong> Customer demand starts at 4 units and jumps to 8 units in Round 5.</li>
              <li><strong>2-Round Delays:</strong> Shipments and orders propagate with a strict 2-round transit delay.</li>
              <li><strong>Holding Cost:</strong> $0.50 per unit of inventory at the end of each round.</li>
              <li><strong>Backlog Penalty:</strong> $1.00 per unit of unfulfilled backlog at the end of each round.</li>
              <li><strong>Fog of War:</strong> Opponent inventories and orders are strictly hidden until game completion.</li>
            </ul>
          </div>
        </>
      ) : (
        <>
          {/* Reviewer Quick Start Suite */}
          <ReviewerQuickStart roomId={roomId} />

          {/* Lobby Status Header */}
          <div
            className="glass-panel"
            style={{
              padding: '1.25rem 1.5rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: gameStarted || occupiedCount === 4 ? 'var(--status-success)' : 'var(--status-warning)',
                  boxShadow: gameStarted || occupiedCount === 4 ? '0 0 10px var(--status-success)' : '0 0 8px var(--status-warning)',
                }}
              />
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>
                  {gameStarted || occupiedCount === 4
                    ? 'All Roles Occupied — Game is In Progress'
                    : `Lobby Phase (${occupiedCount} of 4 Roles Claimed)`}
                </h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {gameStarted || occupiedCount === 4
                    ? 'Submit orders each round. Steps 1–4 execute simultaneously across all nodes.'
                    : 'Share the room link or use the Reviewer Suite above to claim open roles.'}
                </p>
              </div>
            </div>

            {currentRole && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>You are currently:</span>
                <span className={`badge badge-${currentRole}`}>{currentRole}</span>
              </div>
            )}
          </div>

          {/* Role Selection Cards */}
          <RoleSelection
            currentRole={currentRole}
            peers={peers}
            onSelectRole={onSelectRole}
            disabled={gameStarted}
          />
        </>
      )}
    </div>
  );
}
