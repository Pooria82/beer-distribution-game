import { useSession } from './hooks/useSession.js';
import { useGameSocket } from './hooks/useGameSocket.js';
import { LobbyView } from './components/Lobby/LobbyView.js';
import { GameDashboard } from './components/Game/GameDashboard.js';
import { ResultsDashboard } from './components/Results/ResultsDashboard.js';

export function App() {
  const { session, setSession, setGameId, setRole, clearSession } = useSession();

  const socket = useGameSocket({
    gameId: session.gameId,
    role: session.role,
    token: session.token,
    onTokenReceived: (token: string) => {
      if (session.gameId && session.role) {
        setSession(session.gameId, session.role, token);
      }
    },
  });

  const isGameCompleted = socket.view?.status === 'completed';
  const isGameActive = socket.view?.status === 'in_progress' && session.role !== null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {isGameCompleted && socket.view ? (
          <ResultsDashboard view={socket.view} onPlayAgain={clearSession} />
        ) : isGameActive && socket.view ? (
          <GameDashboard
            view={socket.view}
            connectionStatus={socket.connectionStatus}
            error={socket.error}
            onSubmitOrder={socket.submitOrder}
            onSimulateRound={socket.simulateRound}
            onLeaveRoom={clearSession}
            roundAdvancedNotice={socket.roundAdvancedNotice}
          />
        ) : (
          <LobbyView
            roomId={session.gameId}
            currentRole={session.role}
            peers={socket.view?.peers}
            gameStarted={socket.view?.status === 'in_progress'}
            onRoomCreated={setGameId}
            onRoomJoined={setGameId}
            onSelectRole={setRole}
            onLeaveRoom={clearSession}
            error={socket.error}
          />
        )}
      </main>

      {/* Global Application Footer */}
      <footer
        style={{
          padding: '1.5rem',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(8, 12, 20, 0.85)',
          marginTop: 'auto',
        }}
      >
        <p>
          MIT Beer Distribution Game • Senior Full-Stack Implementation for Lemma Evaluation
        </p>
        <p style={{ marginTop: '0.25rem', opacity: 0.75 }}>
          Built with React 19, TypeScript, Express, WebSockets, and SQLite WAL Persistence
        </p>
      </footer>
    </div>
  );
}
export default App;
