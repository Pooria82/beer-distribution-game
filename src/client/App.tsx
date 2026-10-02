import { useState, useEffect } from 'react';
import { useSession } from './hooks/useSession.js';
import { useGameSocket } from './hooks/useGameSocket.js';
import { LobbyView } from './components/Lobby/LobbyView.js';
import { GameDashboard } from './components/Game/GameDashboard.js';
import { ResultsDashboard } from './components/Results/ResultsDashboard.js';
import { RoleType, PeerSummary } from '../core/types.js';
import { tabBus } from './utils/channel.js';

export function App() {
  const { session, setSession, setGameId, setRole, leaveStation, clearSession } = useSession();
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

  // Real-time synchronization of room state from WebSocket (WATCH_ROOM / ROOM_STATE)
  useEffect(() => {
    if (socket.roomState && socket.roomState.gameId === session.gameId) {
      const r = socket.roomState.roles;
      const peers: Record<RoleType, PeerSummary> = {
        retailer: {
          role: 'retailer',
          isOccupied: r.retailer.isOccupied,
          hasSubmittedThisRound: r.retailer.ready,
          isConnected: r.retailer.isOccupied,
        },
        wholesaler: {
          role: 'wholesaler',
          isOccupied: r.wholesaler.isOccupied,
          hasSubmittedThisRound: r.wholesaler.ready,
          isConnected: r.wholesaler.isOccupied,
        },
        distributor: {
          role: 'distributor',
          isOccupied: r.distributor.isOccupied,
          hasSubmittedThisRound: r.distributor.ready,
          isConnected: r.distributor.isOccupied,
        },
        factory: {
          role: 'factory',
          isOccupied: r.factory.isOccupied,
          hasSubmittedThisRound: r.factory.ready,
          isConnected: r.factory.isOccupied,
        },
      };
      setRoomPeers(peers);
      setRoomError(null);
    }
  }, [socket.roomState, session.gameId]);

  // Instant multi-tab synchronization via BroadcastChannel for role claims/releases
  useEffect(() => {
    const unsubscribe = tabBus.subscribe((event) => {
      if (!session.gameId || event.gameId !== session.gameId) return;

      if (event.type === 'ROLE_CLAIMED') {
        setRoomPeers((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            [event.role]: {
              ...prev[event.role],
              isOccupied: true,
              isConnected: true,
            },
          };
        });
      } else if (event.type === 'ROLE_RELEASED') {
        setRoomPeers((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            [event.role]: {
              ...prev[event.role],
              isOccupied: false,
              isConnected: false,
            },
          };
        });
      }
    });

    return unsubscribe;
  }, [session.gameId]);

  // Verify and sync room state when in lobby (before picking a role)
  useEffect(() => {
    if (!session.gameId || session.role !== null) {
      if (!session.gameId) setRoomPeers(null);
      return;
    }

    let isMounted = true;
    const fetchRoom = async () => {
      try {
        const res = await fetch(`/api/games/${encodeURIComponent(session.gameId!)}`);
        if (!res.ok) {
          if (res.status === 404) {
            if (isMounted) {
              setRoomError('Game room not found');
              clearSession();
            }
          }
          return;
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
      } catch {
        // Transient network drops or offline states must NOT wipe the active session
      }
    };

    fetchRoom();
    const pollInterval = setInterval(fetchRoom, 2500);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchRoom();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [session.gameId, clearSession]);

  const isGameCompleted = socket.view?.status === 'completed' && session.gameId !== null && session.role !== null;
  const isGameActive = socket.view?.status === 'in_progress' && session.gameId !== null && session.role !== null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', backgroundColor: 'var(--bg-app)' }}>
      {isGameCompleted && socket.view ? (
        <ResultsDashboard
          view={socket.view}
          onPlayAgain={clearSession}
          error={socket.error}
        />
      ) : isGameActive && socket.view ? (
        <GameDashboard
          view={socket.view}
          connectionStatus={socket.connectionStatus}
          error={socket.error}
          onSubmitOrder={socket.submitOrder}
          onSimulateRound={socket.simulateRound}
          onLeaveRoom={leaveStation}
          roundAdvancedNotice={socket.roundAdvancedNotice}
        />
      ) : (
        <LobbyView
          roomId={session.gameId}
          currentRole={session.role}
          peers={socket.view?.peers || roomPeers || undefined}
          gameStarted={socket.view?.status === 'in_progress' || socket.roomState?.status === 'in_progress'}
          onRoomCreated={(id) => {
            setRoomError(null);
            setGameId(id);
          }}
          onRoomJoined={(id) => {
            setRoomError(null);
            setGameId(id);
          }}
          onSelectRole={(role) => {
            socket.clearError();
            setRoomError(null);
            setRole(role);
            if (session.gameId) {
              tabBus.broadcast({ type: 'ROLE_CLAIMED', gameId: session.gameId, role });
            }
          }}
          onLeaveRoom={() => {
            socket.clearError();
            if (session.role) {
              if (session.gameId) {
                tabBus.broadcast({ type: 'ROLE_RELEASED', gameId: session.gameId, role: session.role });
              }
              leaveStation();
            } else {
              setRoomError(null);
              clearSession();
            }
          }}
          onClearError={() => {
            socket.clearError();
            setRoomError(null);
          }}
          error={socket.error || roomError}
        />
      )}
    </div>
  );
}
export default App;
