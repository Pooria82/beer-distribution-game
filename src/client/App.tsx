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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', backgroundColor: 'var(--bg-app)' }}>
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
    </div>
  );
}
export default App;
