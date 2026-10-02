import { PlayerView } from '../../../core/types.js';
import { SocketConnectionStatus } from '../../hooks/useGameSocket.js';
import { SupplyChainCanvas } from './SupplyChainCanvas.js';
import { MetricCards } from './MetricCards.js';
import { OrderForm } from './OrderForm.js';
import { HistoryTable } from './HistoryTable.js';
import { RoundReadinessBanner } from './RoundReadinessBanner.js';
import { ControlRoomHeader } from '../Common/ControlRoomHeader.js';
import { ControlRoomFooter } from '../Common/ControlRoomFooter.js';
import {
  IconZap,
  IconAlertTriangle,
} from '../Common/Icons.js';

export interface GameDashboardProps {
  readonly view: PlayerView;
  readonly connectionStatus: SocketConnectionStatus;
  readonly error?: string | null | undefined;
  readonly onSubmitOrder: (order: number) => boolean | void;
  readonly onSimulateRound?: (() => void) | undefined;
  readonly onLeaveRoom: () => void;
  readonly roundAdvancedNotice?: number | null | undefined;
}

export function GameDashboard({
  view,
  connectionStatus,
  error,
  onSubmitOrder,
  onSimulateRound,
  onLeaveRoom,
  roundAdvancedNotice,
}: GameDashboardProps) {
  const { currentRound, totalRounds, myRole, myState, peers, currentIntermediate } = view;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
      }}
    >
      {/* Top SCADA Control Room Header */}
      <ControlRoomHeader
        roomId={view.gameId}
        currentRole={myRole}
        currentRound={currentRound}
        totalRounds={totalRounds}
        connectionStatus={connectionStatus}
        onLeave={onLeaveRoom}
      />

      {/* Main Full-Width Cockpit Workspace */}
      <main className="scada-main-workspace" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {/* Round Advanced Announcement Banner */}
        {roundAdvancedNotice && (
          <div
            className="hazard-stripes animate-fade-in"
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-xs)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontFamily: 'var(--font-hud)',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            <IconZap size={16} color="var(--scada-amber)" />
            <span>
              [EVENT] ROUND {roundAdvancedNotice} HAS COMMENCED // ALL 4 STATIONS SYNCHRONIZED IN LOCKSTEP
            </span>
          </div>
        )}

        {/* Error Alert Banner */}
        {error && (
          <div
            className="hazard-stripes-danger animate-fade-in"
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-xs)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              color: '#fecaca',
              fontSize: '0.825rem',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <IconAlertTriangle size={16} color="var(--scada-red)" />
            <span>[TELEMETRY ALERT] {error}</span>
          </div>
        )}

        {/* Real-Time Lockstep Round Readiness Banner */}
        <RoundReadinessBanner
          currentRound={currentRound}
          myRole={myRole}
          peers={peers}
        />

        {/* Dense 3-Column Cockpit Grid with Responsive Priority Flow */}
        <div className="scada-cockpit-grid">
          {/* Column 1: SCADA Supply Chain Pipeline */}
          <div className="scada-col-pipeline" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <SupplyChainCanvas myRole={myRole} peers={peers} currentRound={currentRound} />
          </div>

          {/* Column 2: Core Telemetry Cluster & Order Actuator */}
          <div className="scada-col-order" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', minWidth: 0 }}>
            {/* Tactical Order Actuator Console */}
            <div className="scada-order-form-wrapper">
              <OrderForm
                currentRound={currentRound}
                myState={myState}
                peers={peers}
                connectionStatus={connectionStatus}
                onSubmitOrder={onSubmitOrder}
                onSimulateRound={onSimulateRound}
              />
            </div>

            {/* Telemetry Instruments Cluster */}
            <div className="scada-metrics-wrapper">
              <MetricCards myState={myState} intermediate={currentIntermediate} />
            </div>
          </div>

          {/* Column 3: Black Box Telemetry Ledger */}
          <div className="scada-col-history" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <HistoryTable history={myState.history} />
          </div>
        </div>
      </main>

      {/* Bottom Industrial Status Ticker */}
      <ControlRoomFooter
        roomId={view.gameId}
        role={myRole}
        error={error}
        status={
          error
            ? 'alarm'
            : connectionStatus === 'connected'
              ? 'nominal'
              : connectionStatus === 'reconnecting'
                ? 'degraded'
                : 'alarm'
        }
        statusText={
          error
            ? 'SYS.FAULT'
            : connectionStatus === 'connected'
              ? 'SYS.NOMINAL'
              : connectionStatus === 'reconnecting'
                ? 'SYS.RECONNECTING'
                : 'SYS.OFFLINE'
        }
      />
    </div>
  );
}
