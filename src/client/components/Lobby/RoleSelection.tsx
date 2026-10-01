import { RoleType, PeerSummary } from '../../../core/types.js';
import {
  IconRetailer,
  IconWholesaler,
  IconDistributor,
  IconFactory,
  IconCheck,
  IconRadio,
  IconCrosshair,
  IconLock,
} from '../Common/Icons.js';

export interface RoleSelectionProps {
  readonly currentRole: RoleType | null;
  readonly peers?: Readonly<Record<RoleType, PeerSummary>> | undefined;
  readonly onSelectRole: (role: RoleType) => void;
  readonly disabled?: boolean;
}

interface RoleConfig {
  readonly role: RoleType;
  readonly callsign: string;
  readonly nodeTitle: string;
  readonly description: string;
  readonly upstreamRole: string;
  readonly downstreamRole: string;
  readonly icon: React.ReactNode;
  readonly color: string;
}

const ROLES: readonly RoleConfig[] = [
  {
    role: 'retailer',
    callsign: 'NODE_01',
    nodeTitle: 'RETAIL OUTLET',
    description: 'Direct consumer interface. Fulfills exogenous customer beer orders directly from stock.',
    upstreamRole: 'Wholesaler (Orders ↑)',
    downstreamRole: 'Consumers (Sales ↓)',
    icon: <IconRetailer size={24} color="var(--role-retailer)" />,
    color: 'var(--role-retailer)',
  },
  {
    role: 'wholesaler',
    callsign: 'NODE_02',
    nodeTitle: 'WHOLESALE DEPOT',
    description: 'Regional distribution buffer. Fulfills retailer demand and orders bulk stock from distributor.',
    upstreamRole: 'Distributor (Orders ↑)',
    downstreamRole: 'Retailer (Shipments ↓)',
    icon: <IconWholesaler size={24} color="var(--role-wholesaler)" />,
    color: 'var(--role-wholesaler)',
  },
  {
    role: 'distributor',
    callsign: 'NODE_03',
    nodeTitle: 'LOGISTICS HUB',
    description: 'Bulk logistics node. Buffers stock for wholesaler while issuing production orders to factory.',
    upstreamRole: 'Factory (Orders ↑)',
    downstreamRole: 'Wholesaler (Shipments ↓)',
    icon: <IconDistributor size={24} color="var(--role-distributor)" />,
    color: 'var(--role-distributor)',
  },
  {
    role: 'factory',
    callsign: 'NODE_04',
    nodeTitle: 'BREWING FACILITY',
    description: 'Production origin node. Produces beer with 2-week brewing delay and infinite capacity.',
    upstreamRole: 'Production Line (Batches ↑)',
    downstreamRole: 'Distributor (Shipments ↓)',
    icon: <IconFactory size={24} color="var(--role-factory)" />,
    color: 'var(--role-factory)',
  },
];

export function RoleSelection({
  currentRole,
  peers,
  onSelectRole,
  disabled = false,
}: RoleSelectionProps) {
  return (
    <div className="scada-panel" style={{ width: '100%', height: '100%' }}>
      {/* Panel Header */}
      <div className="scada-panel-header">
        <div className="scada-panel-title">
          <IconCrosshair size={15} color="var(--scada-green)" />
          <span>SECTOR-02 // STATION DISPATCH & OPERATOR SLOTS</span>
        </div>
        <span className="scada-badge" style={{ color: 'var(--scada-green)' }}>
          4 STATIONS ACTIVE
        </span>
      </div>

      <div className="scada-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
          Select your operational station. Multi-tab evaluation allows 4 simultaneous browser tabs to occupy distinct nodes.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {ROLES.map((r) => {
            const isSelected = currentRole === r.role;
            const peer = peers?.[r.role];
            const isOccupied = peer?.isOccupied ?? false;
            const isOccupiedByOther = isOccupied && !isSelected;

            return (
              <div
                key={r.role}
                style={{
                  backgroundColor: isSelected
                    ? 'rgba(0, 240, 255, 0.06)'
                    : 'var(--bg-panel-inset)',
                  border: isSelected
                    ? `1px solid ${r.color}`
                    : '1px solid var(--border-panel)',
                  boxShadow: isSelected ? `0 0 12px ${r.color}33` : 'none',
                  borderRadius: 'var(--radius-xs)',
                  padding: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                  position: 'relative',
                  transition: 'all 120ms ease',
                }}
              >
                {/* Top Role Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: 'var(--radius-xs)',
                        background: 'var(--bg-panel)',
                        border: `1px solid ${r.color}55`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {r.icon}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {r.callsign}
                        </span>
                        <strong
                          style={{
                            fontFamily: 'var(--font-hud)',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            color: r.color,
                          }}
                        >
                          {r.nodeTitle}
                        </strong>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        {r.role}
                      </span>
                    </div>
                  </div>

                  {/* Occupancy Indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span
                      className={`scada-led ${
                        isSelected
                          ? 'scada-led-nominal'
                          : isOccupiedByOther
                            ? 'scada-led-warn'
                            : 'scada-led-nominal'
                      }`}
                      style={{ width: '6px', height: '6px' }}
                    />
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontFamily: 'var(--font-mono)',
                        color: isSelected
                          ? 'var(--scada-green)'
                          : isOccupiedByOther
                            ? 'var(--scada-amber)'
                            : 'var(--text-muted)',
                      }}
                    >
                      {isSelected ? 'YOUR STATION' : isOccupiedByOther ? 'OCCUPIED' : 'VACANT'}
                    </span>
                  </div>
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: 1.35, minHeight: '34px' }}>
                  {r.description}
                </p>

                {/* Pipeline Node Specs */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem',
                    fontSize: '0.68rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-muted)',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '0.4rem 0.5rem',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-panel)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>INFLOW:</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{r.upstreamRole}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>OUTFLOW:</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{r.downstreamRole}</span>
                  </div>
                </div>

                {/* Dispatch Button */}
                <button
                  type="button"
                  onClick={() => onSelectRole(r.role)}
                  disabled={disabled || isOccupiedByOther}
                  className={`btn-scada ${isSelected ? 'btn-scada-primary' : ''}`}
                  style={{
                    width: '100%',
                    padding: '0.45rem',
                    fontSize: '0.8rem',
                    borderColor: isSelected ? r.color : undefined,
                    cursor: isOccupiedByOther ? 'not-allowed' : undefined,
                    opacity: isOccupiedByOther ? 0.5 : 1,
                  }}
                >
                  {isSelected ? (
                    <>
                      <IconCheck size={14} color="#ffffff" />
                      <span>YOUR STATION</span>
                    </>
                  ) : isOccupiedByOther ? (
                    <>
                      <IconLock size={13} color="var(--scada-amber)" />
                      <span style={{ color: 'var(--scada-amber)' }}>SLOT OCCUPIED</span>
                    </>
                  ) : (
                    <>
                      <IconRadio size={13} />
                      <span>OCCUPY STATION</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
