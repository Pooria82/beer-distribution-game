import { PlayerView } from '../../../core/types.js';
import { CostSummary } from './CostSummary.js';
import { BullwhipChart } from './BullwhipChart.js';
import { HistoryTable } from '../Game/HistoryTable.js';
import { ControlRoomHeader } from '../Common/ControlRoomHeader.js';
import { ControlRoomFooter } from '../Common/ControlRoomFooter.js';
import {
  IconRefresh,
  IconCheck,
  IconAlertTriangle,
} from '../Common/Icons.js';

export interface ResultsDashboardProps {
  readonly view: PlayerView;
  readonly onPlayAgain: () => void;
  readonly error?: string | null | undefined;
}

export function ResultsDashboard({ view, onPlayAgain, error }: ResultsDashboardProps) {
  const { totalChainCost, finalScores, myRole, myState, gameId } = view;

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
        roomId={gameId}
        currentRole={myRole}
        currentRound={20}
        totalRounds={20}
        connectionStatus="connected"
        onLeave={onPlayAgain}
      />

      {/* Main Full-Width Post-Mission Analysis Workspace */}
      <main
        style={{
          flex: 1,
          width: '100%',
          padding: '0.85rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
        }}
      >
        {/* Error Alert Banner if an illegal action was attempted */}
        {error && (
          <div
            className="hazard-stripes-danger animate-fade-in"
            style={{
              padding: '0.65rem 1rem',
              borderRadius: 'var(--radius-xs)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              color: '#fecaca',
              fontSize: '0.825rem',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <IconAlertTriangle size={18} color="var(--scada-red)" />
            <span>[CRITICAL TELEMETRY FAULT] {error}</span>
          </div>
        )}

        {/* Debrief Top Action Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            padding: '0.75rem 1.25rem',
            backgroundColor: 'var(--bg-panel-inset)',
            border: '1px solid var(--border-panel-bright)',
            borderRadius: 'var(--radius-xs)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-xs)',
                background: 'rgba(0, 255, 157, 0.1)',
                border: '1px solid rgba(0, 255, 157, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconCheck size={18} color="var(--scada-green)" />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-hud)',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    color: '#ffffff',
                    textTransform: 'uppercase',
                  }}
                >
                  MISSION RESULTS // POST-OPERATION DEBRIEF
                </span>
                <span
                  className="scada-badge"
                  style={{ color: 'var(--scada-green)', borderColor: 'rgba(0, 255, 157, 0.4)' }}
                >
                  FOG-OF-WAR LIFTED
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
                Authoritative multi-station consensus complete. Full supply chain telemetry and bullwhip metrics revealed.
              </p>
            </div>
          </div>

          {/* Re-Commission Simulation Button */}
          <button
            type="button"
            onClick={onPlayAgain}
            className="btn-scada btn-scada-primary"
            style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem' }}
          >
            <IconRefresh size={15} />
            <span>COMMISSION NEW SESSION // RETURN TO LOBBY</span>
          </button>
        </div>

        {/* 1. Cumulative Financial Loss Debrief Across 4 Stations */}
        <CostSummary
          totalChainCost={totalChainCost}
          finalScores={finalScores}
          myRole={myRole}
          myTotalCost={myState.totalCost}
        />

        {/* 2. Oscilloscope Bullwhip Waveform Analyzer */}
        <BullwhipChart history={myState.history} myRole={myRole} />

        {/* 3. Black Box 20-Round Flight Recorder Ledger */}
        <HistoryTable history={myState.history} />

        {/* Tactical Return to Lobby Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '1.5rem 0 1rem 0',
          }}
        >
          <button
            type="button"
            onClick={onPlayAgain}
            className="btn-scada btn-scada-primary"
            style={{
              padding: '0.85rem 2.25rem',
              fontSize: '1rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.35)',
            }}
          >
            <IconRefresh size={18} />
            <span>RETURN TO LOBBY // RE-COMMISSION</span>
          </button>
        </div>
      </main>

      {/* Bottom Industrial Status Ticker */}
      <ControlRoomFooter />
    </div>
  );
}
