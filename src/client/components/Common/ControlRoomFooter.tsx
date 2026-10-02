import { IconCpu, IconDatabase } from './Icons.js';

export function ControlRoomFooter() {
  const telemetryItems = [
    'SCADA CORE // ACTIVE',
    'ARCHITECTURE: HEXAGONAL DOMAIN (PORTS & ADAPTERS)',
    'PERSISTENCE: SQLITE WAL (WRITE-AHEAD LOGGING) 100% STATE RESILIENT',
    'NETWORK: AUTHORITATIVE WEBSOCKET MULTIPLAYER [MUTEX CONCURRENCY BARRIER]',
    'ALGORITHM: DETERMINISTIC 4-STAGE PIPELINE (2-WEEK ORDER / 2-WEEK SHIPMENT)',
    'FOG-OF-WAR: CRYPTOGRAPHIC BOUNDARY SANITIZATION ACTIVE',
    'PACKET INTEGRITY: 100% OK • LATENCY: < 12MS',
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
      {/* Left Static Hardware Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--scada-green)' }}>
          <span className="scada-led scada-led-nominal" style={{ width: '6px', height: '6px' }} />
          <strong style={{ fontFamily: 'var(--font-hud)', letterSpacing: '0.08em' }}>SYS.NOMINAL</strong>
        </span>
        <span style={{ color: 'var(--border-panel-bright)' }}>|</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <IconCpu size={12} color="var(--scada-cyan)" />
          <span>PORT: 3000</span>
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
