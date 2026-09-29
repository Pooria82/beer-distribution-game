import React from 'react';
import { RoleType } from '../../../core/types.js';
import {
  IconRetailer,
  IconWholesaler,
  IconDistributor,
  IconFactory,
  IconCost,
} from '../Common/Icons.js';

export interface CostSummaryProps {
  readonly totalChainCost?: number | undefined;
  readonly finalScores?: Readonly<Record<RoleType, number>> | undefined;
  readonly myRole: RoleType;
  readonly myTotalCost: number;
}

interface RoleScoreMeta {
  readonly role: RoleType;
  readonly name: string;
  readonly icon: React.ReactNode;
  readonly color: string;
  readonly bg: string;
}

export function CostSummary({
  totalChainCost,
  finalScores,
  myRole,
  myTotalCost,
}: CostSummaryProps) {
  const displayTotal = totalChainCost ?? myTotalCost;

  const roleMetas: readonly RoleScoreMeta[] = [
    { role: 'retailer', name: 'Retailer', icon: <IconRetailer size={20} color="var(--role-retailer)" />, color: 'var(--role-retailer)', bg: 'var(--role-retailer-bg)' },
    { role: 'wholesaler', name: 'Wholesaler', icon: <IconWholesaler size={20} color="var(--role-wholesaler)" />, color: 'var(--role-wholesaler)', bg: 'var(--role-wholesaler-bg)' },
    { role: 'distributor', name: 'Distributor', icon: <IconDistributor size={20} color="var(--role-distributor)" />, color: 'var(--role-distributor)', bg: 'var(--role-distributor-bg)' },
    { role: 'factory', name: 'Factory', icon: <IconFactory size={20} color="var(--role-factory)" />, color: 'var(--role-factory)', bg: 'var(--role-factory-bg)' },
  ];

  return (
    <div style={{ marginBottom: '2rem' }}>
      {/* Total Supply Chain Cost Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '2.25rem',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(19, 27, 46, 0.85) 0%, rgba(12, 16, 27, 0.95) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          marginBottom: '1.5rem',
          boxShadow: '0 16px 48px -10px rgba(0, 0, 0, 0.8)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
          <IconCost size={18} color="var(--text-accent)" />
          <span
            className="badge"
            style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--text-accent)', fontSize: '0.8rem' }}
          >
            Supply Chain Aggregate Ledger
          </span>
        </div>

        <h2 style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.4rem' }}>
          Total Supply Chain Cost
        </h2>

        <div
          className="metric-num"
          style={{
            fontSize: '3.25rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            color: '#f8fafc',
            textShadow: '0 0 35px rgba(99, 102, 241, 0.4)',
          }}
        >
          ${displayTotal.toFixed(2)}
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginTop: '0.65rem' }}>
          Combined cost across all 20 rounds (Holding: $0.50/unit • Backlog: $1.00/unit)
        </p>
      </div>

      {/* 4 Roles Individual Cost Breakdown */}
      {finalScores && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
          }}
        >
          {roleMetas.map((meta) => {
            const cost = finalScores[meta.role] ?? 0;
            const isMe = myRole === meta.role;
            const percentage = displayTotal > 0 ? ((cost / displayTotal) * 100).toFixed(1) : '0';

            return (
              <div
                key={meta.role}
                className="glass-panel"
                style={{
                  padding: '1.25rem',
                  borderTop: `4px solid ${meta.color}`,
                  background: isMe ? meta.bg : undefined,
                  boxShadow: isMe ? `0 0 24px ${meta.bg}` : undefined,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ display: 'flex' }}>{meta.icon}</div>
                    <span style={{ fontWeight: 700, color: meta.color, fontSize: '0.95rem' }}>{meta.name}</span>
                  </div>
                  {isMe && (
                    <span className="badge" style={{ background: meta.color, color: '#fff', fontSize: '0.65rem' }}>
                      YOU
                    </span>
                  )}
                </div>

                <div className="metric-num" style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.4rem 0' }}>
                  ${cost.toFixed(2)}
                </div>

                <div className="metric-num" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {percentage}% of total chain cost
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
