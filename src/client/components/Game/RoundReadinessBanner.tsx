import React from 'react';
import { RoleType, PeerSummary } from '../../../core/types.js';
import {
  IconCheck,
  IconClock,
  IconRetailer,
  IconWholesaler,
  IconDistributor,
  IconFactory,
} from '../Common/Icons.js';

export interface RoundReadinessBannerProps {
  readonly currentRound: number;
  readonly myRole: RoleType;
  readonly peers: Readonly<Record<RoleType, PeerSummary>>;
}

const ROLES: readonly { role: RoleType; name: string; icon: React.ComponentType<{ size?: number; color?: string }>; color: string }[] = [
  { role: 'retailer', name: 'Retailer', icon: IconRetailer, color: 'var(--role-retailer)' },
  { role: 'wholesaler', name: 'Wholesaler', icon: IconWholesaler, color: 'var(--role-wholesaler)' },
  { role: 'distributor', name: 'Distributor', icon: IconDistributor, color: 'var(--role-distributor)' },
  { role: 'factory', name: 'Factory', icon: IconFactory, color: 'var(--role-factory)' },
];

export function RoundReadinessBanner({
  currentRound,
  myRole,
  peers,
}: RoundReadinessBannerProps) {
  const lockedCount = ROLES.filter((r) => peers[r.role]?.hasSubmittedThisRound).length;
  const allLocked = lockedCount === 4;

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border-panel-bright)',
        borderRadius: 'var(--radius-xs)',
        padding: '0.55rem 0.85rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      }}
    >
      {/* Left: 4 Station Lockstep Readiness Pills */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontFamily: 'var(--font-hud)',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          ROUND {String(currentRound).padStart(2, '0')} LOCKSTEP:
        </span>

        <div className="scada-readiness-pills">

        {ROLES.map((r) => {
          const isMe = r.role === myRole;
          const peer = peers[r.role];
          const isLocked = peer?.hasSubmittedThisRound ?? false;
          const IconComponent = r.icon;

          return (
            <div
              key={r.role}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.2rem 0.55rem',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                background: isLocked
                  ? 'rgba(0, 255, 157, 0.08)'
                  : isMe
                    ? 'rgba(245, 158, 11, 0.08)'
                    : 'rgba(0, 0, 0, 0.3)',
                border: `1px solid ${
                  isLocked
                    ? 'rgba(0, 255, 157, 0.4)'
                    : isMe
                      ? 'rgba(245, 158, 11, 0.4)'
                      : 'var(--border-panel)'
                }`,
                transition: 'all 200ms ease',
              }}
            >
              <span
                className={`scada-led ${isLocked ? 'scada-led-nominal' : 'scada-led-warn'}`}
                style={{ width: '6px', height: '6px' }}
              />
              <IconComponent size={13} color={r.color} />
              <strong style={{ color: isLocked ? 'var(--scada-green)' : 'var(--text-primary)', fontWeight: 600 }}>
                {r.name.toUpperCase()}
              </strong>
              {isMe && (
                <span style={{ color: 'var(--scada-cyan)', fontSize: '0.62rem', fontWeight: 700 }}>
                  (YOU)
                </span>
              )}
              <span
                style={{
                  fontSize: '0.65rem',
                  color: isLocked ? 'var(--scada-green)' : 'var(--text-muted)',
                  marginLeft: '0.15rem',
                }}
              >
                {isLocked ? '✓ LOCKED' : 'PENDING'}
              </span>
            </div>
          );
        })}
        </div>
      </div>

      {/* Right: Aggregate Readiness & Lockstep Sync Gauge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <div
            style={{
              width: '80px',
              height: '6px',
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '3px',
              overflow: 'hidden',
              border: '1px solid var(--border-panel)',
            }}
          >
            <div
              style={{
                width: `${(lockedCount / 4) * 100}%`,
                height: '100%',
                background: allLocked
                  ? 'var(--scada-green)'
                  : 'linear-gradient(90deg, var(--scada-cyan), var(--scada-amber))',
                transition: 'width 250ms ease',
              }}
            />
          </div>
          <span
            className="metric-num"
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: allLocked ? 'var(--scada-green)' : 'var(--scada-amber)',
            }}
          >
            {lockedCount} / 4
          </span>
        </div>

        <span
          style={{
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            color: allLocked ? 'var(--scada-green)' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
          }}
        >
          {allLocked ? (
            <>
              <IconCheck size={13} color="var(--scada-green)" />
              <span>ALL 4 OPERATORS READY • LOCKSTEP SYNCHRONIZED</span>
            </>
          ) : (
            <>
              <IconClock size={13} color="var(--scada-amber)" />
              <span>AWAITING {4 - lockedCount} MORE ORDER(S)</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}
