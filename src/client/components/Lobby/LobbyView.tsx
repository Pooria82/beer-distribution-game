import { RoleType, PeerSummary } from '../../../core/types.js';
import { RoomCreate } from './RoomCreate.js';
import { RoleSelection } from './RoleSelection.js';
import { ReviewerQuickStart } from './ReviewerQuickStart.js';
import { ControlRoomHeader } from '../Common/ControlRoomHeader.js';
import { ControlRoomFooter } from '../Common/ControlRoomFooter.js';
import {
  IconCheck,
  IconAlertTriangle,
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
  gameStarted: _gameStarted = false,
  onRoomCreated,
  onRoomJoined,
  onSelectRole,
  onLeaveRoom,
  error,
}: LobbyViewProps) {
  const occupiedCount = peers
    ? Object.values(peers).filter((p) => p.isOccupied).length
    : currentRole
      ? 1
      : 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
      }}
    >
      {/* Top SCADA Control Room Header */}
      <ControlRoomHeader
        roomId={roomId}
        currentRole={currentRole}
        onLeave={roomId ? onLeaveRoom : undefined}
      />

      {/* Main Edge-to-Edge Cockpit Workspace */}
      <main
        style={{
          flex: 1,
          width: '100%',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {/* Error Notification Alert */}
        {error && (
          <div
            className="hazard-stripes-danger animate-fade-in"
            style={{
              padding: '0.65rem 1rem',
              borderRadius: 'var(--radius-xs)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              color: '#fecaca',
              fontSize: '0.825rem',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <IconAlertTriangle size={18} color="var(--scada-red)" />
            <span>[CRITICAL TELEMETRY FAULT] {error}</span>
          </div>
        )}

        {/* Readiness Status Sub-Banner */}
        {roomId && (
          <div
            style={{
              backgroundColor: 'var(--bg-panel-inset)',
              border: '1px solid var(--border-panel-bright)',
              borderRadius: 'var(--radius-xs)',
              padding: '0.6rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span
                className={`scada-led ${occupiedCount === 4 ? 'scada-led-nominal' : 'scada-led-warn'}`}
              />
              <span style={{ fontFamily: 'var(--font-hud)', fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-primary)' }}>
                STATION READINESS: {occupiedCount} / 4 OPERATORS LINKED
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
              {occupiedCount === 4 ? (
                <span style={{ color: 'var(--scada-green)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <IconCheck size={14} color="var(--scada-green)" />
                  <span>ALL STATIONS OCCUPIED • SYSTEM ENGAGED</span>
                </span>
              ) : (
                <span style={{ color: 'var(--scada-amber)' }}>
                  AWAITING {4 - occupiedCount} MORE OPERATOR(S) TO COMMENCE ROUND 1
                </span>
              )}
            </div>
          </div>
        )}

        {/* Full-Width 3-Column Cockpit Sectors */}
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: roomId ? '320px 1fr 340px' : '450px 1fr',
            gap: '1rem',
            alignItems: 'stretch',
          }}
        >
          {/* Sector 1: Session Management */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <RoomCreate
              onRoomCreated={onRoomCreated}
              onRoomJoined={onRoomJoined}
            />
          </div>

          {/* Sector 2: Station Dispatch (Center) */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <RoleSelection
              currentRole={currentRole}
              peers={peers}
              onSelectRole={onSelectRole}
              disabled={!roomId}
            />
          </div>

          {/* Sector 3: Reviewer 1-Click Multi-Tab Launcher (Right) */}
          {roomId && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <ReviewerQuickStart roomId={roomId} />
            </div>
          )}
        </div>
      </main>

      {/* Bottom Industrial Status Ticker */}
      <ControlRoomFooter />
    </div>
  );
}
