import React from 'react';
import { RoleType } from '../../../core/types.js';
import {
  IconRetailer,
  IconWholesaler,
  IconDistributor,
  IconFactory,
  IconGauge,
} from '../Common/Icons.js';

export interface CostSummaryProps {
  readonly totalChainCost?: number | undefined;
  readonly finalScores?: Readonly<Record<RoleType, number>> | undefined;
  readonly myRole: RoleType;
  readonly myTotalCost: number;
}

interface RoleScoreMeta {
  readonly role: RoleType;
  readonly callsign: string;
  readonly name: string;
  readonly icon: React.ReactNode;
  readonly color: string;
}

export function CostSummary({
  totalChainCost,
  finalScores,
  myRole,
  myTotalCost,
}: CostSummaryProps) {
  const displayTotal = totalChainCost ?? myTotalCost;

  const roleMetas: readonly RoleScoreMeta[] = [
    { role: 'retailer', callsign: 'NODE_01', name: 'Retailer', icon: <IconRetailer size={18} color="var(--role-retailer)" />, color: 'var(--role-retailer)' },
    { role: 'wholesaler', callsign: 'NODE_02', name: 'Wholesaler', icon: <IconWholesaler size={18} color="var(--role-wholesaler)" />, color: 'var(--role-wholesaler)' },
    { role: 'distributor', callsign: 'NODE_03', name: 'Distributor', icon: <IconDistributor size={18} color="var(--role-distributor)" />, color: 'var(--role-distributor)' },
    { role: 'factory', callsign: 'NODE_04', name: 'Factory', icon: <IconFactory size={18} color="var(--role-factory)" />, color: 'var(--role-factory)' },
  ];

  return (
    <div className="scada-panel" style={{ width: '100%', marginBottom: '1rem' }}>
      {/* Panel Header */}
      <div className="scada-panel-header">
        <div className="scada-panel-title">
          <IconGauge size={15} color="var(--scada-amber)" />
          <span>MISSION DEBRIEF // CUMULATIVE FINANCIAL BURDEN</span>
        </div>
        <span className="scada-badge" style={{ color: 'var(--scada-amber)', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
          TOTAL LOSS AUDIT
        </span>
      </div>

      <div className="scada-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Total Chain Loss Hero Readout */}
        <div
          style={{
            padding: '1.25rem',
            background: 'var(--bg-panel-inset)',
            border: '1px solid var(--border-panel-bright)',
            borderRadius: 'var(--radius-xs)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-hud)', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
              CUMULATIVE SUPPLY CHAIN LOSS
            </div>
            <div
              className="metric-num"
              data-metric="chain-cost"
              style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                color: 'var(--scada-green)',
                lineHeight: 1.1,
              }}
            >
              ${displayTotal.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Sum of Holding Penalties ($0.50/u) + Backlog Deficit Charges ($1.00/u) Across All 20 Rounds
            </div>
          </div>

          <div
            style={{
              padding: '0.75rem 1.25rem',
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-panel)',
              borderRadius: 'var(--radius-xs)',
              textAlign: 'right',
            }}
          >
            <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-hud)', color: 'var(--text-muted)' }}>YOUR STATION CONTRIBUTION</div>
            <div className="metric-num" data-metric="my-cost" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--scada-cyan)' }}>
              ${myTotalCost.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              {displayTotal > 0 ? `${((myTotalCost / displayTotal) * 100).toFixed(1)}% of chain total` : '0%'}
            </div>
          </div>
        </div>

        {/* 4 Station Individual Breakdown */}
        {finalScores && (
          <div className="scada-cost-grid">
            {roleMetas.map((meta) => {
              const score = finalScores[meta.role] ?? 0;
              const isMe = meta.role === myRole;
              const pct = displayTotal > 0 ? ((score / displayTotal) * 100).toFixed(1) : '0';

              return (
                <div
                  key={meta.role}
                  style={{
                    padding: '0.65rem 0.85rem',
                    background: isMe ? 'rgba(0, 240, 255, 0.08)' : 'var(--bg-panel-inset)',
                    border: isMe ? '1px solid var(--scada-cyan)' : '1px solid var(--border-panel)',
                    boxShadow: isMe ? '0 0 12px rgba(0, 240, 255, 0.22), inset 0 0 8px rgba(0, 240, 255, 0.05)' : undefined,
                    borderRadius: 'var(--radius-xs)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      {meta.icon}
                      <span style={{ fontFamily: 'var(--font-hud)', fontSize: '0.85rem', fontWeight: 700, color: meta.color }}>
                        {meta.name.toUpperCase()}
                      </span>
                    </div>
                    {isMe && (
                      <span
                        className="scada-badge"
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          padding: '0.08rem 0.45rem',
                          color: 'var(--scada-cyan)',
                          borderColor: 'rgba(0, 240, 255, 0.5)',
                          background: 'rgba(0, 240, 255, 0.15)',
                          boxShadow: '0 0 8px rgba(0, 240, 255, 0.3)',
                          letterSpacing: '0.05em',
                        }}
                      >
                        YOU
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                    <span className="metric-num" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      ${score.toFixed(2)}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      ({pct}%)
                    </span>
                  </div>

                  {/* Segmented Loss Share Bar */}
                  <div className="scada-segment-meter" style={{ height: '6px' }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        background: meta.color,
                        boxShadow: `0 0 6px ${meta.color}`,
                        borderRadius: '1px',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
