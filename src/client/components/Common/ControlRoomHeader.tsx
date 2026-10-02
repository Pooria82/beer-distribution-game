import { useState, useEffect } from 'react';
import { RoleType } from '../../../core/types.js';
import { SocketConnectionStatus } from '../../hooks/useGameSocket.js';
import {
  IconBeer,
  IconLogOut,
  IconClock,
} from './Icons.js';

export interface ControlRoomHeaderProps {
  readonly roomId?: string | null | undefined;
  readonly currentRole?: RoleType | null | undefined;
  readonly currentRound?: number | undefined;
  readonly totalRounds?: number | undefined;
  readonly connectionStatus?: SocketConnectionStatus | 'standby' | 'lobby' | undefined;
  readonly onLeave?: (() => void) | undefined;
}

export function ControlRoomHeader({
  roomId,
  currentRole,
  currentRound,
  totalRounds,
  connectionStatus,
  onLeave,
}: ControlRoomHeaderProps) {
  const effectiveStatus =
    connectionStatus ?? (currentRole ? 'connected' : roomId ? 'lobby' : 'standby');

  // Live UTC Master Chronometer
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toTimeString().split(' ')[0] + '.' + String(Math.floor(now.getMilliseconds() / 100))
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="scada-header">
      {/* Left: Facility Branding & SCADA ID */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-xs)',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            border: '1px solid var(--border-panel-bright)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--scada-cyan)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
            flexShrink: 0,
          }}
        >
          <IconBeer size={18} color="var(--scada-cyan)" />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span
              style={{
                fontFamily: 'var(--font-hud)',
                fontSize: '1rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: '#ffffff',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              SCADA CONTROL ROOM
            </span>
            <span
              className="scada-header-proto-badge scada-badge"
              style={{
                fontSize: '0.65rem',
                padding: '0.1rem 0.4rem',
                color: 'var(--scada-cyan)',
                borderColor: 'rgba(0, 240, 255, 0.4)',
                background: 'rgba(0, 240, 255, 0.08)',
              }}
            >
              MIT v2.4
            </span>
          </div>

          <div
            className="scada-header-sublabel"
            style={{
              fontSize: '0.68rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              marginTop: '0.05rem',
            }}
          >
            <span>FACILITY // LEMMA-EVAL</span>
            <span>•</span>
            <span style={{ color: 'var(--text-secondary)' }}>FOG-OF-WAR: SECURED</span>
          </div>
        </div>
      </div>

      {/* Center: Live Chronometer & Round Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {currentRound !== undefined && totalRounds !== undefined && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-panel-bright)',
              padding: '0.2rem 0.65rem',
              borderRadius: 'var(--radius-xs)',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-hud)', letterSpacing: '0.08em' }}>
              ROUND:
            </span>
            <span
              className="metric-num"
              data-metric="current-round"
              style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                color: 'var(--scada-amber)',
              }}
            >
              {String(currentRound).padStart(2, '0')}{' '}
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ {totalRounds}</span>
            </span>
          </div>
        )}

        {/* Master Clock (Hidden on screens < 640px) */}
        <div
          className="scada-header-clock"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-panel)',
            padding: '0.2rem 0.55rem',
            borderRadius: 'var(--radius-xs)',
          }}
        >
          <IconClock size={13} color="var(--scada-cyan)" />
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-hud)' }}>UTC</span>
          <span
            className="metric-num"
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--scada-cyan)',
              minWidth: '72px',
            }}
          >
            {timeString || '00:00:00.0'}
          </span>
        </div>
      </div>

      {/* Right: Telemetry Link & Role Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        {/* Connection LED */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.25rem 0.55rem',
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-panel)',
            borderRadius: 'var(--radius-xs)',
          }}
        >
          <span
            className={`scada-led ${
              effectiveStatus === 'connected' || effectiveStatus === 'lobby'
                ? 'scada-led-nominal'
                : effectiveStatus === 'connecting' ||
                    effectiveStatus === 'reconnecting' ||
                    effectiveStatus === 'standby'
                  ? 'scada-led-warn'
                  : 'scada-led-alarm'
            }`}
          />
          <span
            className="scada-header-status-label"
            style={{
              fontSize: '0.7rem',
              fontFamily: 'var(--font-hud)',
              fontWeight: 700,
              letterSpacing: '0.05em',
              color:
                effectiveStatus === 'connected'
                  ? 'var(--scada-green)'
                  : effectiveStatus === 'lobby'
                    ? 'var(--scada-cyan)'
                    : effectiveStatus === 'connecting' || effectiveStatus === 'reconnecting'
                      ? 'var(--scada-amber)'
                      : effectiveStatus === 'standby'
                        ? 'var(--text-muted)'
                        : 'var(--scada-red)',
              textTransform: 'uppercase',
            }}
          >
            {effectiveStatus === 'connected'
              ? 'NOMINAL'
              : effectiveStatus === 'lobby'
                ? 'COMMISSIONED'
                : effectiveStatus === 'standby'
                  ? 'STANDBY'
                  : effectiveStatus === 'connecting'
                    ? 'CONNECTING'
                    : effectiveStatus === 'reconnecting'
                      ? 'RECONNECTING'
                      : effectiveStatus === 'superseded'
                        ? 'SUPERSEDED'
                        : 'DISCONNECTED'}
          </span>
        </div>

        {/* Room Code Badge */}
        {roomId && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.2rem 0.5rem',
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-panel-bright)',
              borderRadius: 'var(--radius-xs)',
            }}
          >
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-hud)' }}>BAY:</span>
            <span
              className="metric-num"
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '0.05em',
              }}
            >
              {roomId}
            </span>
          </div>
        )}

        {/* Current Operator Role Badge */}
        {currentRole && (
          <span
            className={`scada-badge scada-badge-${currentRole}`}
            style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem' }}
          >
            {currentRole.toUpperCase()}
          </span>
        )}

        {/* Emergency Leave / Disconnect Button */}
        {onLeave && (
          <button
            type="button"
            onClick={onLeave}
            className="btn-scada"
            style={{
              padding: '0.3rem 0.55rem',
              fontSize: '0.72rem',
              background: 'rgba(255, 51, 102, 0.1)',
              borderColor: 'rgba(255, 51, 102, 0.35)',
              color: '#fca5a5',
              minHeight: '34px',
            }}
            title="Disconnect Station & Return to Terminal Lobby"
          >
            <IconLogOut size={12} color="#fca5a5" />
            <span>EXIT</span>
          </button>
        )}
      </div>
    </header>
  );
}
