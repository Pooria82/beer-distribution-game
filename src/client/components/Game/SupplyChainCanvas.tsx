import React from 'react';
import { RoleType, PeerSummary } from '../../../core/types.js';
import {
  IconRetailer,
  IconWholesaler,
  IconDistributor,
  IconFactory,
  IconArrowRight,
  IconArrowLeft,
  IconCheck,
  IconHourglass,
} from '../Common/Icons.js';

export interface SupplyChainCanvasProps {
  readonly myRole: RoleType;
  readonly peers: Readonly<Record<RoleType, PeerSummary>>;
  readonly currentRound: number;
}

interface NodeConfig {
  readonly role: RoleType;
  readonly name: string;
  readonly icon: React.ReactNode;
  readonly color: string;
  readonly bg: string;
  readonly border: string;
}

export function SupplyChainCanvas({ myRole, peers, currentRound }: SupplyChainCanvasProps) {
  const chainNodes: readonly NodeConfig[] = [
    {
      role: 'retailer',
      name: 'Retailer',
      icon: <IconRetailer size={22} color="var(--role-retailer)" />,
      color: 'var(--role-retailer)',
      bg: 'var(--role-retailer-bg)',
      border: 'var(--role-retailer-border)',
    },
    {
      role: 'wholesaler',
      name: 'Wholesaler',
      icon: <IconWholesaler size={22} color="var(--role-wholesaler)" />,
      color: 'var(--role-wholesaler)',
      bg: 'var(--role-wholesaler-bg)',
      border: 'var(--role-wholesaler-border)',
    },
    {
      role: 'distributor',
      name: 'Distributor',
      icon: <IconDistributor size={22} color="var(--role-distributor)" />,
      color: 'var(--role-distributor)',
      bg: 'var(--role-distributor-bg)',
      border: 'var(--role-distributor-border)',
    },
    {
      role: 'factory',
      name: 'Factory',
      icon: <IconFactory size={22} color="var(--role-factory)" />,
      color: 'var(--role-factory)',
      bg: 'var(--role-factory-bg)',
      border: 'var(--role-factory-border)',
    },
  ];

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.5rem',
        marginBottom: '1.75rem',
        overflowX: 'auto',
      }}
    >
      {/* Legend & Direction Flow Indicators */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Supply Chain Network Topology
          </span>
          <span
            className="badge"
            style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
          >
            Round {currentRound}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
            <span style={{ color: '#38bdf8', display: 'flex' }}><IconArrowRight size={14} /></span>
            <span>Orders Flow Upstream (Retailer → Factory)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
            <span style={{ color: '#34d399', display: 'flex' }}><IconArrowLeft size={14} /></span>
            <span>Shipments Flow Downstream (2-Round Delay)</span>
          </div>
        </div>
      </div>

      {/* Interactive 4-Node Chain Layout */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minWidth: '820px',
          position: 'relative',
          padding: '0.75rem 0',
        }}
      >
        {chainNodes.map((node, index) => {
          const peer = peers[node.role];
          const isMe = myRole === node.role;
          const hasSubmitted = peer?.hasSubmittedThisRound ?? false;
          const isConnected = peer?.isConnected ?? false;

          return (
            <div key={node.role} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              {/* Node Card */}
              <div
                style={{
                  flex: 1,
                  padding: '1.15rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  background: isMe ? node.bg : 'rgba(255, 255, 255, 0.02)',
                  border: `2px solid ${isMe ? node.color : node.border}`,
                  boxShadow: isMe ? `0 0 28px ${node.bg}` : 'none',
                  transition: 'all 200ms ease',
                  position: 'relative',
                }}
              >
                {/* "YOU" Floating Badge */}
                {isMe && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '12px',
                      background: node.color,
                      color: '#ffffff',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      letterSpacing: '0.05em',
                      boxShadow: `0 2px 10px ${node.bg}`,
                    }}
                  >
                    YOU
                  </span>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.65rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-sm)',
                      background: node.bg,
                      border: `1px solid ${node.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {node.icon}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.975rem', color: isMe ? node.color : 'var(--text-primary)', fontWeight: 700 }}>
                      {node.name}
                    </h4>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      Node {index + 1}
                    </span>
                  </div>
                </div>

                {/* Status Badges */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.75rem' }}>
                  {/* Submission Readiness */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      background: hasSubmitted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.12)',
                      color: hasSubmitted ? 'var(--status-success)' : 'var(--status-warning)',
                      fontWeight: 600,
                    }}
                  >
                    <span>Turn status:</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {hasSubmitted ? (
                        <>
                          <IconCheck size={12} /> Ready
                        </>
                      ) : (
                        <>
                          <IconHourglass size={12} /> Deciding
                        </>
                      )}
                    </span>
                  </div>

                  {/* Presence Status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: isConnected ? 'var(--status-success)' : 'var(--status-danger)',
                        display: 'inline-block',
                      }}
                      className={isConnected ? 'status-pulse' : ''}
                    />
                    <span>{isConnected ? 'Connected' : 'Offline'}</span>
                  </div>
                </div>
              </div>

              {/* Connecting Pipeline Transit Stream (between nodes) */}
              {index < chainNodes.length - 1 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '64px',
                    padding: '0 0.4rem',
                    gap: '0.45rem',
                  }}
                >
                  {/* Order flow up (→) */}
                  <div
                    title="Order signal transmitted upstream"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '0.675rem',
                      color: '#38bdf8',
                      fontWeight: 700,
                      gap: '0.15rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    <span>Order</span>
                    <IconArrowRight size={10} color="#38bdf8" />
                  </div>

                  {/* Animated SVG Stream Lines */}
                  <svg width="48" height="12" viewBox="0 0 48 12" style={{ overflow: 'visible' }}>
                    {/* Orders Top Stream Line */}
                    <line x1="0" y1="3" x2="48" y2="3" stroke="#38bdf8" strokeWidth="2" className="flow-stream-orders" />
                    {/* Shipments Bottom Stream Line */}
                    <line x1="0" y1="9" x2="48" y2="9" stroke="#34d399" strokeWidth="2" className="flow-stream-shipments" />
                  </svg>

                  {/* Shipment flow down (←) */}
                  <div
                    title="Goods delivered with 2-round lag"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '0.675rem',
                      color: '#34d399',
                      fontWeight: 700,
                      gap: '0.15rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    <IconArrowLeft size={10} color="#34d399" />
                    <span>Ship</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
