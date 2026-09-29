import { RoleType, PeerSummary } from '../../../core/types.js';
import { RoomCreate } from './RoomCreate.js';
import { RoleSelection } from './RoleSelection.js';
import { ReviewerQuickStart } from './ReviewerQuickStart.js';
import {
  IconBeer,
  IconClipboard,
  IconBacklog,
  IconLogOut,
  IconCheck,
} from '../Common/Icons.js';

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
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.25)',
              }}
            >
              <IconBeer size={24} color="#818cf8" />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.025em' }}>
              <span className="gradient-text">Beer Distribution Game</span>
            </h1>
            <span
              className="badge"
              style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
            >
              MIT Simulation Engine
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Authoritative Turn-Based Supply Chain Simulation with Real-Time WebSockets & Fog-of-War.
          </p>
        </div>

        {roomId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              className="badge"
              style={{
                fontSize: '0.85rem',
                padding: '0.45rem 0.85rem',
                background: 'rgba(99, 102, 241, 0.12)',
                color: 'var(--text-primary)',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                letterSpacing: '0.05em',
              }}
            >
              ROOM: <strong style={{ color: 'var(--text-accent)', marginLeft: '0.25rem' }}>{roomId}</strong>
            </div>

            <button
              type="button"
              onClick={onLeaveRoom}
              className="btn btn-ghost"
              style={{ fontSize: '0.825rem', padding: '0.45rem 0.75rem' }}
            >
              <IconLogOut size={14} />
              <span>Leave Room</span>
            </button>
          </div>
        )}
      </header>

      {/* Error Banner */}
      {error && (
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#fca5a5',
            fontSize: '0.9rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
          }}
        >
          <IconBacklog size={18} color="#ef4444" />
          <span>{error}</span>
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
              maxWidth: '680px',
              margin: '2rem auto 0',
              padding: '1.5rem',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <IconClipboard size={18} color="var(--primary-500)" />
              <h4 style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                Game Principles & Invariants
              </h4>
            </div>
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
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: gameStarted || occupiedCount === 4 ? 'var(--status-success)' : 'var(--status-warning)',
                  boxShadow: gameStarted || occupiedCount === 4 ? '0 0 12px var(--status-success)' : '0 0 10px var(--status-warning)',
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
                <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>Your role:</span>
                <span className={`badge badge-${currentRole}`}>
                  <IconCheck size={12} /> {currentRole}
                </span>
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
