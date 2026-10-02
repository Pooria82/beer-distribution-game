import { useState } from 'react';
import { RoleType } from '../../../core/types.js';
import {
  IconRocket,
  IconCopy,
  IconCheck,
  IconExternalLink,
  IconZap,
  IconRetailer,
  IconWholesaler,
  IconDistributor,
  IconFactory,
  IconAlertTriangle,
  IconRefresh,
  IconChevronRight,
} from '../Common/Icons.js';

export interface ReviewerQuickStartProps {
  readonly roomId: string;
  readonly onToggleCollapse?: () => void;
}

const ROLES: readonly RoleType[] = ['retailer', 'wholesaler', 'distributor', 'factory'];

const ROLE_ICONS: Record<RoleType, React.ComponentType<{ size?: number; color?: string }>> = {
  retailer: IconRetailer,
  wholesaler: IconWholesaler,
  distributor: IconDistributor,
  factory: IconFactory,
};

const ROLE_COLORS: Record<RoleType, string> = {
  retailer: 'var(--role-retailer)',
  wholesaler: 'var(--role-wholesaler)',
  distributor: 'var(--role-distributor)',
  factory: 'var(--role-factory)',
};

export function ReviewerQuickStart({ roomId, onToggleCollapse }: ReviewerQuickStartProps) {
  const [copiedRole, setCopiedRole] = useState<string | null>(null);
  const [launchedRoles, setLaunchedRoles] = useState<Record<RoleType, boolean>>({
    retailer: false,
    wholesaler: false,
    distributor: false,
    factory: false,
  });
  const [popupBlocked, setPopupBlocked] = useState<boolean>(false);

  const getRoleUrl = (role: RoleType) => {
    const origin = window.location.origin;
    return `${origin}/?room=${encodeURIComponent(roomId)}&role=${role}`;
  };

  const launchRole = (role: RoleType) => {
    window.open(getRoleUrl(role), `beer_station_${role}`);
    setLaunchedRoles((prev) => ({ ...prev, [role]: true }));
  };

  const handleLaunchAll = () => {
    const updated: Record<RoleType, boolean> = { ...launchedRoles };
    let anyBlocked = false;

    ROLES.forEach((role) => {
      try {
        const win = window.open(getRoleUrl(role), `beer_station_${role}`);
        if (!win || win.closed || typeof win.closed === 'undefined') {
          anyBlocked = true;
        } else {
          updated[role] = true;
        }
      } catch {
        anyBlocked = true;
      }
    });

    setLaunchedRoles(updated);
    setPopupBlocked(anyBlocked);
  };

  const handleCopyLink = async (role: RoleType) => {
    try {
      await navigator.clipboard.writeText(getRoleUrl(role));
      setCopiedRole(role);
      setTimeout(() => setCopiedRole(null), 2000);
    } catch {
      // Fallback
    }
  };

  const allLaunched = ROLES.every((r) => launchedRoles[r]);
  const launchedCount = ROLES.filter((r) => launchedRoles[r]).length;
  const nextRoleToLaunch = ROLES.find((r) => !launchedRoles[r]);

  return (
    <div className="scada-panel" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Panel Header */}
      <div className="scada-panel-header" style={{ justifyContent: 'space-between' }}>
        <div className="scada-panel-title">
          <IconZap size={15} color="var(--scada-cyan)" />
          <span>SECTOR-03 // REVIEWER 1-CLICK HARNESS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span
            className="scada-badge"
            style={{
              color: allLaunched
                ? 'var(--scada-green)'
                : launchedCount > 0
                  ? 'var(--scada-cyan)'
                  : 'var(--scada-amber)',
              borderColor: allLaunched
                ? 'rgba(0, 255, 157, 0.4)'
                : 'rgba(0, 240, 255, 0.4)',
              background: allLaunched
                ? 'rgba(0, 255, 157, 0.08)'
                : 'rgba(0, 240, 255, 0.08)',
            }}
          >
            {allLaunched
              ? '4/4 ACTIVE'
              : launchedCount > 0
                ? `${launchedCount}/4 DISPATCHED`
                : 'STANDBY (0/4)'}
          </span>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="btn-scada"
              style={{ padding: '0.15rem 0.35rem', fontSize: '0.7rem' }}
              title="Collapse Sector 3 Sidebar"
            >
              <IconChevronRight size={13} color="var(--text-secondary)" />
            </button>
          )}
        </div>
      </div>

      <div
        className="scada-panel-body"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          flex: 1,
          overflowX: 'hidden',
          overflowY: 'auto',
        }}
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.4 }}>
          Evaluator Quick-Start Suite: Launches 4 isolated browser tabs configured with tab-scoped tokens for instantaneous multi-node simulation.
        </p>

        {/* 1-Click Master Launch Button (Glowing Cyan) */}
        {!allLaunched ? (
          <button
            type="button"
            onClick={
              popupBlocked && nextRoleToLaunch
                ? () => launchRole(nextRoleToLaunch)
                : handleLaunchAll
            }
            className="btn-scada btn-scada-cyan"
            style={{
              width: '100%',
              padding: '0.75rem',
              gap: '0.65rem',
              fontSize: '0.88rem',
              letterSpacing: '0.04em',
              whiteSpace: 'normal',
              textAlign: 'center',
            }}
          >
            <IconRocket size={17} />
            <span>
              {popupBlocked && nextRoleToLaunch
                ? `DISPATCH NEXT: ${nextRoleToLaunch.toUpperCase()} (${launchedCount + 1}/4)`
                : 'DISPATCH ALL 4 STATIONS (AUTO-OPEN 4 TABS)'}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleLaunchAll}
            className="btn-scada btn-scada-success"
            style={{
              width: '100%',
              padding: '0.75rem',
              gap: '0.65rem',
              fontSize: '0.88rem',
              letterSpacing: '0.04em',
            }}
          >
            <IconCheck size={18} color="#ffffff" />
            <span>✓ ALL 4 STATIONS DISPATCHED (4 TABS OPEN)</span>
          </button>
        )}

        {/* Pop-up Blocker Detection & Guidance Notice */}
        {popupBlocked && !allLaunched && (
          <div
            style={{
              padding: '0.65rem 0.8rem',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 'var(--radius-xs)',
              fontSize: '0.72rem',
              lineHeight: 1.45,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.45rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--scada-amber)', fontWeight: 700 }}>
              <IconAlertTriangle size={15} color="var(--scada-amber)" />
              <span>BROWSER POP-UP BLOCKER INTERCEPTED TABS</span>
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              Chrome / Edge restricts opening multiple tabs per click by default.
            </div>
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '0.4rem 0.6rem',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-panel)',
                color: 'var(--scada-cyan)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
              }}
            >
              💡 <strong>1-Click Fix:</strong> In your browser address bar (top right), click the <strong>Pop-up icon [🚫]</strong> &rarr; select <strong>"Always allow pop-ups from localhost:3000"</strong> &rarr; then click below:
            </div>
            <button
              type="button"
              onClick={handleLaunchAll}
              className="btn-scada"
              style={{
                padding: '0.35rem 0.6rem',
                fontSize: '0.72rem',
                gap: '0.4rem',
                color: 'var(--scada-cyan)',
                borderColor: 'var(--scada-cyan)',
              }}
            >
              <IconRefresh size={12} color="var(--scada-cyan)" />
              <span>RETRY AUTO-DISPATCH ALL 4 TABS</span>
            </button>
          </div>
        )}

        {/* Individual Direct Station Links (Single Column Layout to prevent any overflow) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-hud)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              OPERATIONAL STATION BAYS:
            </label>
            <span
              style={{
                fontSize: '0.68rem',
                color: launchedCount === 4 ? 'var(--scada-green)' : 'var(--scada-amber)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {launchedCount} OF 4 ACTIVE
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {ROLES.map((role) => {
              const RoleIconComponent = ROLE_ICONS[role];
              const isLaunched = launchedRoles[role];
              const roleColor = ROLE_COLORS[role];

              return (
                <div
                  key={role}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0.65rem',
                    background: isLaunched ? 'rgba(0, 255, 157, 0.05)' : 'var(--bg-panel-inset)',
                    border: `1px solid ${isLaunched ? 'rgba(0, 255, 157, 0.35)' : 'var(--border-panel)'}`,
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    transition: 'all 150ms ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <RoleIconComponent size={15} color={roleColor} />
                    <span style={{ textTransform: 'capitalize', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {role}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(role)}
                      className="btn-scada"
                      style={{ padding: '0.22rem 0.4rem', fontSize: '0.68rem' }}
                      title={`Copy ${role} URL`}
                    >
                      {copiedRole === role ? <IconCheck size={11} color="var(--scada-green)" /> : <IconCopy size={11} />}
                    </button>

                    <button
                      type="button"
                      onClick={() => launchRole(role)}
                      className="btn-scada"
                      style={{
                        padding: '0.22rem 0.55rem',
                        fontSize: '0.68rem',
                        color: isLaunched ? 'var(--scada-green)' : 'var(--scada-cyan)',
                        borderColor: isLaunched ? 'rgba(0, 255, 157, 0.4)' : 'rgba(0, 240, 255, 0.3)',
                      }}
                      title={`Launch ${role} in new tab`}
                    >
                      {isLaunched ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <IconCheck size={10} color="var(--scada-green)" />
                          <span>OPEN</span>
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <IconExternalLink size={10} />
                          <span>LAUNCH</span>
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SCADA Rule Specifications */}
        <div
          style={{
            marginTop: 'auto',
            padding: '0.55rem 0.75rem',
            background: 'rgba(0,0,0,0.35)',
            border: '1px solid var(--border-panel)',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>HOLDING PENALTY:</span>
            <span style={{ color: 'var(--text-primary)' }}>$0.50 / unit / round</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>BACKLOG DEFICIT:</span>
            <span style={{ color: 'var(--scada-red)' }}>$1.00 / unit / round</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>PIPELINE LATENCY:</span>
            <span style={{ color: 'var(--scada-cyan)' }}>2w Order + 2w Shipment</span>
          </div>
        </div>
      </div>
    </div>
  );
}
