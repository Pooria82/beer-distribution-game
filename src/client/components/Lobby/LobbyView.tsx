import { useState, useEffect } from 'react';
import { RoleType, PeerSummary } from '../../../core/types.js';
import { RoomCreate } from './RoomCreate.js';
import { RoleSelection } from './RoleSelection.js';
import { ReviewerQuickStart } from './ReviewerQuickStart.js';
import { ControlRoomHeader } from '../Common/ControlRoomHeader.js';
import { ControlRoomFooter } from '../Common/ControlRoomFooter.js';
import {
  IconCheck,
  IconAlertTriangle,
  IconChevronRight,
  IconChevronLeft,
  IconTerminal,
  IconZap,
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
  readonly onClearError?: () => void;
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
  onClearError,
  error,
}: LobbyViewProps) {
  const [isSector1Open, setIsSector1Open] = useState(true);
  const [isSector3Open, setIsSector3Open] = useState(true);
  const [mobileTab, setMobileTab] = useState<'stations' | 'room' | 'reviewer'>('stations');
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!roomId) {
      setMobileTab('room');
    } else {
      setMobileTab('stations');
    }
  }, [roomId]);

  const occupiedCount = peers
    ? Object.values(peers).filter((p) => p.isOccupied).length
    : currentRole
      ? 1
      : 0;

  // Global Enter listener: When in a room, if user presses Enter on the page without focusing an input,
  // occupy the first vacant station automatically!
  useEffect(() => {
    const handleLobbyEnter = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (e.defaultPrevented) return;
        const activeTag = document.activeElement?.tagName?.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'button') return;

        if (roomId && !currentRole) {
          const roles: RoleType[] = ['retailer', 'wholesaler', 'distributor', 'factory'];
          const firstVacant = roles.find((r) => !peers?.[r]?.isOccupied);
          if (firstVacant) {
            e.preventDefault();
            onSelectRole(firstVacant);
          }
        }
      }
    };

    window.addEventListener('keydown', handleLobbyEnter);
    return () => window.removeEventListener('keydown', handleLobbyEnter);
  }, [roomId, currentRole, peers, onSelectRole]);

  const s1Width = isSector1Open ? (roomId ? '320px' : '400px') : '44px';
  const s3Width = roomId ? (isSector3Open ? '350px' : '44px') : '';
  const gridColumns = roomId
    ? `${s1Width} minmax(380px, 1fr) ${s3Width}`
    : `${s1Width} minmax(380px, 1fr)`;

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
      {/* Top SCADA Control Room Header with Dynamic Realtime Status */}
      <ControlRoomHeader
        roomId={roomId}
        currentRole={currentRole}
        connectionStatus={error ? 'disconnected' : roomId ? 'lobby' : 'standby'}
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
              justifyContent: 'space-between',
              gap: '0.75rem',
              color: '#fecaca',
              fontSize: '0.825rem',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <IconAlertTriangle size={18} color="var(--scada-red)" />
              <span>[CRITICAL TELEMETRY FAULT] {error}</span>
            </div>
            {onClearError && (
              <button
                type="button"
                onClick={onClearError}
                className="btn-scada"
                style={{
                  padding: '0.2rem 0.6rem',
                  fontSize: '0.7rem',
                  background: 'rgba(0, 0, 0, 0.4)',
                  borderColor: 'rgba(255, 51, 102, 0.5)',
                  color: '#ffffff',
                }}
              >
                DISMISS
              </button>
            )}
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
              <span
                style={{
                  fontFamily: 'var(--font-hud)',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: 'var(--text-primary)',
                }}
              >
                STATION READINESS: {occupiedCount} / 4 OPERATORS LINKED
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {occupiedCount === 4 ? (
                <span
                  style={{
                    color: 'var(--scada-green)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
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

        {/* Mobile/Tablet Segmented Sector Selector */}
        {!isDesktop && roomId && (
          <div className="scada-lobby-mobile-tabs" style={{ display: 'flex' }}>
            <button
              type="button"
              onClick={() => setMobileTab('stations')}
              className={`scada-lobby-tab-btn ${mobileTab === 'stations' ? 'active' : ''}`}
            >
              ★ STATIONS ({occupiedCount}/4)
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('room')}
              className={`scada-lobby-tab-btn ${mobileTab === 'room' ? 'active' : ''}`}
            >
              BAY INFO
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('reviewer')}
              className={`scada-lobby-tab-btn ${mobileTab === 'reviewer' ? 'active' : ''}`}
            >
              1-CLICK TABS
            </button>
          </div>
        )}

        {/* Adaptive Cockpit Sectors: Responsive 1-Column on Mobile/Tablet vs 3-Column on Desktop */}
        {!isDesktop ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0 }}>
            {!roomId || mobileTab === 'room' ? (
              <RoomCreate
                onRoomCreated={onRoomCreated}
                onRoomJoined={onRoomJoined}
              />
            ) : mobileTab === 'reviewer' ? (
              <ReviewerQuickStart roomId={roomId} />
            ) : (
              <RoleSelection
                currentRole={currentRole}
                peers={peers}
                onSelectRole={onSelectRole}
                disabled={!roomId}
              />
            )}
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: gridColumns,
              gap: '1rem',
              alignItems: 'stretch',
              transition: 'grid-template-columns 200ms ease',
            }}
          >
            {/* Sector 1: Session Management (Collapsible Sidebar) */}
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              {isSector1Open ? (
                <RoomCreate
                  onRoomCreated={onRoomCreated}
                  onRoomJoined={onRoomJoined}
                  onToggleCollapse={() => setIsSector1Open(false)}
                />
              ) : (
                <div
                  onClick={() => setIsSector1Open(true)}
                  className="scada-panel"
                  style={{
                    width: '44px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '0.75rem 0.25rem',
                    cursor: 'pointer',
                    userSelect: 'none',
                    background: 'var(--bg-panel-inset)',
                    border: '1px solid var(--border-panel)',
                    transition: 'all 150ms ease',
                  }}
                  title="Expand Sector 1 (Session Commissioning)"
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <IconChevronRight size={16} color="var(--scada-cyan)" />
                    <IconTerminal size={15} color="var(--scada-cyan)" />
                  </div>
                  <div
                    style={{
                      writingMode: 'vertical-rl',
                      transform: 'rotate(180deg)',
                      fontFamily: 'var(--font-hud)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      color: 'var(--text-secondary)',
                      marginTop: '1.5rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    SECTOR-01 // COMMISSIONING
                  </div>
                </div>
              )}
            </div>

            {/* Sector 2: Station Dispatch (Center Main Cockpit) */}
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <RoleSelection
                currentRole={currentRole}
                peers={peers}
                onSelectRole={onSelectRole}
                disabled={!roomId}
              />
            </div>

            {/* Sector 3: Reviewer 1-Click Multi-Tab Launcher (Collapsible Sidebar) */}
            {roomId && (
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {isSector3Open ? (
                  <ReviewerQuickStart
                    roomId={roomId}
                    onToggleCollapse={() => setIsSector3Open(false)}
                  />
                ) : (
                  <div
                    onClick={() => setIsSector3Open(true)}
                    className="scada-panel"
                    style={{
                      width: '44px',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '0.75rem 0.25rem',
                      cursor: 'pointer',
                      userSelect: 'none',
                      background: 'var(--bg-panel-inset)',
                      border: '1px solid var(--border-panel)',
                      transition: 'all 150ms ease',
                    }}
                    title="Expand Sector 3 (Reviewer 1-Click Harness)"
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <IconChevronLeft size={16} color="var(--scada-cyan)" />
                      <IconZap size={15} color="var(--scada-cyan)" />
                    </div>
                    <div
                      style={{
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                        fontFamily: 'var(--font-hud)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        color: 'var(--text-secondary)',
                        marginTop: '1.5rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      SECTOR-03 // 4-BAY HARNESS
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Industrial Status Ticker with Dynamic State */}
      <ControlRoomFooter
        roomId={roomId}
        role={currentRole}
        error={error}
        status={error ? 'alarm' : roomId ? 'nominal' : 'standby'}
        statusText={error ? 'SYS.FAULT' : roomId ? 'SYS.NOMINAL' : 'SYS.STANDBY'}
      />
    </div>
  );
}
