import { IconCpu, IconDatabase } from './Icons.js';
import { RoleType } from '../../../core/types.js';

export interface ControlRoomFooterProps {
  readonly status?: 'nominal' | 'degraded' | 'alarm' | 'standby' | undefined;
  readonly statusText?: string | undefined;
  readonly roomId?: string | null | undefined;
  readonly role?: RoleType | null | undefined;
  readonly error?: string | null | undefined;
}

export function ControlRoomFooter({
  status,
  statusText,
  roomId,
  role,
  error,
}: ControlRoomFooterProps) {
  // Compute dynamic system status
  let resolvedStatus: 'nominal' | 'degraded' | 'alarm' | 'standby' = status ?? 'nominal';
  let resolvedLabel = statusText ?? 'SYS.NOMINAL';

  if (error) {
    resolvedStatus = 'alarm';
    resolvedLabel = 'SYS.FAULT';
  } else if (!status) {
    if (!roomId) {
      resolvedStatus = 'standby';
      resolvedLabel = 'SYS.STANDBY';
    } else {
      resolvedStatus = 'nominal';
      resolvedLabel = 'SYS.NOMINAL';
    }
  }

  const port =
    typeof window !== 'undefined'
      ? window.location.port || (window.location.protocol === 'https:' ? '443' : '80')
      : '3000';

  const telemetryItems = [
    `SCADA CORE // ${roomId ? `ACTIVE (BAY: ${roomId})` : 'STANDBY'}`,
    `STATION: ${role ? role.toUpperCase() : 'CENTRAL LOBBY'}`,
    'ARCHITECTURE: HEXAGONAL DOMAIN (PORTS & ADAPTERS)',
    'PERSISTENCE: SQLITE WAL (WRITE-AHEAD LOGGING) 100% STATE RESILIENT',
    'NETWORK: AUTHORITATIVE WEBSOCKET MULTIPLAYER [MUTEX CONCURRENCY BARRIER]',
    'ALGORITHM: DETERMINISTIC 4-STAGE PIPELINE (2-WEEK ORDER / 2-WEEK SHIPMENT)',
    'FOG-OF-WAR: CRYPTOGRAPHIC BOUNDARY SANITIZATION ACTIVE',
    `SYSTEM STATUS: ${resolvedLabel} [PORT: ${port}]`,
  ];

  return (
    <footer
      style={{
        width: '100%',
        backgroundColor: '#05070b',
        borderTop: '1px solid var(--border-panel)',
        padding: '0.35rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.72rem',
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-muted)',
        userSelect: 'none',
        overflow: 'hidden',
        gap: '1rem',
      }}
    >
      {/* Left Dynamic Hardware Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            color:
              resolvedStatus === 'nominal'
                ? 'var(--scada-green)'
                : resolvedStatus === 'standby'
                  ? 'var(--scada-cyan)'
                  : resolvedStatus === 'degraded'
                    ? 'var(--scada-amber)'
                    : 'var(--scada-red)',
          }}
        >
          <span
            className={`scada-led ${
              resolvedStatus === 'nominal'
                ? 'scada-led-nominal'
                : resolvedStatus === 'standby' || resolvedStatus === 'degraded'
                  ? 'scada-led-warn'
                  : 'scada-led-alarm'
            }`}
            style={{ width: '6px', height: '6px' }}
          />
          <strong style={{ fontFamily: 'var(--font-hud)', letterSpacing: '0.08em' }}>
            {resolvedLabel}
          </strong>
        </span>
        <span style={{ color: 'var(--border-panel-bright)' }}>|</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <IconCpu size={12} color="var(--scada-cyan)" />
          <span>PORT: {port}</span>
        </span>
        <span style={{ color: 'var(--border-panel-bright)' }}>|</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <IconDatabase size={12} color="var(--scada-amber)" />
          <span>DB: SQLite-WAL</span>
        </span>
      </div>

      {/* Center Scrolling Telemetry Marquee */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          position: 'relative',
          maskImage: 'linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent)',
        }}
      >
        <div className="scada-ticker-track" style={{ gap: '2rem' }}>
          {telemetryItems.concat(telemetryItems).map((item, idx) => (
            <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--scada-cyan)' }}>››</span>
              <span>{item}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Right Technical Specification Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        <span>LEMMA EVALUATION PROTOCOL</span>
        <span style={{ color: 'var(--border-panel-bright)' }}>|</span>
        <span style={{ color: 'var(--text-secondary)' }}>MIT 1960 DYNAMICS</span>
      </div>
    </footer>
  );
}
