import { useState, useEffect } from 'react';
import { useSession } from './hooks/useSession.js';
import { useGameSocket } from './hooks/useGameSocket.js';
import { LobbyView } from './components/Lobby/LobbyView.js';
import { GameDashboard } from './components/Game/GameDashboard.js';
import { ResultsDashboard } from './components/Results/ResultsDashboard.js';
import { RoleType, PeerSummary } from '../core/types.js';

export function App() {
  const { session, setSession, setGameId, setRole, clearSession } = useSession();
  const [roomError, setRoomError] = useState<string | null>(null);
  const [roomPeers, setRoomPeers] = useState<Record<RoleType, PeerSummary> | null>(null);

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

  // Verify and sync room state when in lobby (even before picking a role)
  useEffect(() => {
    if (!session.gameId) {
      setRoomPeers(null);
      return;
    }

    let isMounted = true;
    const fetchRoom = async () => {
      try {
        const res = await fetch(`/api/games/${encodeURIComponent(session.gameId!)}`);
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { message?: string };
          throw new Error(data.message || 'Game room not found');
        }
        const data = (await res.json()) as {
          gameId: string;
          status: string;
          roles: Record<RoleType, { isOccupied: boolean; ready: boolean }>;
        };
        if (isMounted) {
          const peers: Record<RoleType, PeerSummary> = {
            retailer: {
              role: 'retailer',
              isOccupied: data.roles.retailer.isOccupied,
              hasSubmittedThisRound: data.roles.retailer.ready,
              isConnected: data.roles.retailer.isOccupied,
            },
            wholesaler: {
              role: 'wholesaler',
              isOccupied: data.roles.wholesaler.isOccupied,
              hasSubmittedThisRound: data.roles.wholesaler.ready,
              isConnected: data.roles.wholesaler.isOccupied,
            },
            distributor: {
              role: 'distributor',
              isOccupied: data.roles.distributor.isOccupied,
              hasSubmittedThisRound: data.roles.distributor.ready,
              isConnected: data.roles.distributor.isOccupied,
            },
            factory: {
              role: 'factory',
              isOccupied: data.roles.factory.isOccupied,
              hasSubmittedThisRound: data.roles.factory.ready,
              isConnected: data.roles.factory.isOccupied,
            },
          };
          setRoomPeers(peers);
          setRoomError(null);
        }
      } catch (err) {
        if (isMounted) {
          const errMsg = err instanceof Error ? err.message : 'Game room not found';
          setRoomError(errMsg.includes('not found') ? 'Game room not found' : errMsg);
          clearSession();
        }
      }
    };

    fetchRoom();
    const pollInterval = setInterval(fetchRoom, 2500);
    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [session.gameId, clearSession]);

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
          peers={socket.view?.peers || roomPeers || undefined}
          gameStarted={socket.view?.status === 'in_progress'}
          onRoomCreated={(id) => {
            setRoomError(null);
            setGameId(id);
          }}
          onRoomJoined={(id) => {
            setRoomError(null);
            setGameId(id);
          }}
          onSelectRole={setRole}
          onLeaveRoom={() => {
            setRoomError(null);
            clearSession();
          }}
          error={socket.error || roomError}
        />
      )}
    </div>
  );
}
export default App;
