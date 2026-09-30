import React from 'react';
import { RoleType, PeerSummary } from '../../../core/types.js';
import {
  IconRetailer,
  IconWholesaler,
  IconDistributor,
  IconFactory,
  IconPipeline,
  IconValve,
} from '../Common/Icons.js';

export interface SupplyChainCanvasProps {
  readonly myRole: RoleType;
  readonly peers: Readonly<Record<RoleType, PeerSummary>>;
  readonly currentRound: number;
}

interface NodeConfig {
  readonly role: RoleType;
  readonly callsign: string;
  readonly name: string;
  readonly icon: React.ReactNode;
  readonly color: string;
}

export function SupplyChainCanvas({ myRole, peers, currentRound }: SupplyChainCanvasProps) {
  const chainNodes: readonly NodeConfig[] = [
    {
      role: 'retailer',
      callsign: 'NODE_01',
      name: 'Retailer',
      icon: <IconRetailer size={20} color="var(--role-retailer)" />,
      color: 'var(--role-retailer)',
    },
    {
      role: 'wholesaler',
      callsign: 'NODE_02',
      name: 'Wholesaler',
      icon: <IconWholesaler size={20} color="var(--role-wholesaler)" />,
      color: 'var(--role-wholesaler)',
    },
    {
      role: 'distributor',
      callsign: 'NODE_03',
      name: 'Distributor',
      icon: <IconDistributor size={20} color="var(--role-distributor)" />,
      color: 'var(--role-distributor)',
    },
    {
      role: 'factory',
      callsign: 'NODE_04',
      name: 'Factory',
      icon: <IconFactory size={20} color="var(--role-factory)" />,
      color: 'var(--role-factory)',
    },
  ];

  return (
    <div className="scada-panel" style={{ width: '100%', height: '100%' }}>
      {/* Panel Header */}
      <div className="scada-panel-header">
        <div className="scada-panel-title">
          <IconPipeline size={15} color="var(--scada-cyan)" />
          <span>SCADA PIPELINE // 4-STAGE NETWORK TOPOLOGY</span>
        </div>
        <span className="scada-badge" style={{ color: 'var(--scada-cyan)' }}>
          ROUND {currentRound} ACTIVE
        </span>
      </div>

      <div className="scada-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {/* Pipeline Flow Direction Legend */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
            padding: '0.35rem 0.65rem',
            background: 'var(--bg-panel-inset)',
            border: '1px solid var(--border-panel)',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ width: '12px', height: '2px', background: '#a855f7', display: 'inline-block' }} />
            <span style={{ color: '#c084fc' }}>ORDERS UPSTREAM (↑ RET → FAC)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ width: '12px', height: '2px', background: '#34d399', display: 'inline-block' }} />
            <span style={{ color: '#6ee7b7' }}>SHIPMENTS DOWNSTREAM (↓ FAC → RET)</span>
          </div>
        </div>

        {/* Vertical SCADA Supply Chain Pipeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {chainNodes.map((node, index) => {
            const isMe = node.role === myRole;
            const peer = peers[node.role];
            const isReady = peer?.hasSubmittedThisRound ?? false;
            const isNextNode = index < chainNodes.length - 1;

            return (
              <React.Fragment key={node.role}>
                {/* Node Station Chassis Card */}
                <div
                  style={{
                    backgroundColor: isMe ? 'rgba(0, 240, 255, 0.05)' : 'var(--bg-panel-inset)',
                    border: isMe ? `1px solid ${node.color}` : '1px solid var(--border-panel)',
                    boxShadow: isMe ? `0 0 10px ${node.color}33` : 'none',
                    borderRadius: 'var(--radius-xs)',
                    padding: '0.65rem 0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: 'var(--radius-xs)',
                        background: 'var(--bg-panel)',
                        border: `1px solid ${node.color}55`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {node.icon}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {node.callsign}
                        </span>
                        <strong
                          style={{
                            fontFamily: 'var(--font-hud)',
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            color: node.color,
                          }}
                        >
                          {node.name.toUpperCase()}
                        </strong>
                        {isMe && (
                          <span
                            className="scada-badge"
                            style={{
                              fontSize: '0.6rem',
                              padding: '0.05rem 0.35rem',
                              color: 'var(--scada-cyan)',
                              borderColor: 'rgba(0,240,255,0.4)',
                              background: 'rgba(0,240,255,0.1)',
                            }}
                          >
                            YOUR STATION
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        OPERATOR: {peer?.isOccupied ? (peer.isConnected ? 'ONLINE OPERATOR' : 'RECONNECTING') : 'VACANT'}
                      </div>
                    </div>
                  </div>

                  {/* Readiness LED Beacon */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span
                      className={`scada-led ${isReady ? 'scada-led-nominal' : 'scada-led-warn'}`}
                      style={{ width: '7px', height: '7px' }}
                    />
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontFamily: 'var(--font-mono)',
                        color: isReady ? 'var(--scada-green)' : 'var(--scada-amber)',
                        fontWeight: 700,
                      }}
                    >
                      {isReady ? 'ORDER LOCKED' : 'TRANSMITTING...'}
                    </span>
                  </div>
                </div>

                {/* Animated Intermediate Fluid Pipeline (Between Nodes) */}
                {isNextNode && (
                  <div
                    style={{
                      height: '36px',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '-0.2rem 0',
                    }}
                  >
                    {/* SVG Dual-Piping Animation */}
                    <svg
                      width="100%"
                      height="36"
                      viewBox="0 0 300 36"
                      preserveAspectRatio="none"
                      style={{ position: 'absolute', inset: 0 }}
                    >
                      {/* Left Pipe: Upstream Orders (Purple) */}
                      <line x1="80" y1="36" x2="80" y2="0" stroke="rgba(168, 85, 247, 0.25)" strokeWidth="4" />
                      <line
                        x1="80"
                        y1="36"
                        x2="80"
                        y2="0"
                        stroke="#a855f7"
                        strokeWidth="2.5"
                        className="flow-stream-orders"
                      />

                      {/* Right Pipe: Downstream Beer Shipment (Green) */}
                      <line x1="220" y1="0" x2="220" y2="36" stroke="rgba(0, 255, 157, 0.25)" strokeWidth="4" />
                      <line
                        x1="220"
                        y1="0"
                        x2="220"
                        y2="36"
                        stroke="#00ff9d"
                        strokeWidth="2.5"
                        className="flow-stream-shipments"
                      />
                    </svg>

                    {/* Central Pipeline Transit Reservoir Valve */}
                    <div
                      style={{
                        zIndex: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.15rem 0.5rem',
                        background: 'var(--bg-panel)',
                        border: '1px solid var(--border-panel-bright)',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '0.65rem',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <IconValve size={11} color="var(--scada-cyan)" />
                      <span>STAGE TRANSIT [2-WEEK DELAY]</span>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
