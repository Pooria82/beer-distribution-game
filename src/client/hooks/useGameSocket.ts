import { useState, useEffect, useRef, useCallback } from 'react';
import { RoleType, PlayerView } from '../../core/types.js';
import {
  ClientMessage,
  ServerMessage,
  RoomStateMessage,
} from '../../server/protocol.js';
import { tabBus } from '../utils/channel.js';

export type SocketConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'superseded';

export interface UseGameSocketOptions {
  readonly gameId: string | null;
  readonly role: RoleType | null;
  readonly token: string | null;
  readonly onTokenReceived?: (token: string) => void;
  readonly wsUrl?: string;
}

export function useGameSocket(options: UseGameSocketOptions) {
  const { gameId, role, token, onTokenReceived, wsUrl: customWsUrl } = options;

  const [connectionStatus, setConnectionStatus] = useState<SocketConnectionStatus>('disconnected');
  const [view, setView] = useState<PlayerView | null>(null);
  const [roomState, setRoomState] = useState<RoomStateMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSuperseded, setIsSuperseded] = useState(false);
  const [gameStartedNotice, setGameStartedNotice] = useState(false);
  const [roundAdvancedNotice, setRoundAdvancedNotice] = useState<number | null>(null);
  const [gameCompletedNotice, setGameCompletedNotice] = useState<{ totalChainCost: number } | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isSupersededRef = useRef(false);
  const isIntentionalCloseRef = useRef(false);

  // Keep latest token and callbacks in refs to avoid socket churn
  const tokenRef = useRef(token);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const onTokenReceivedRef = useRef(onTokenReceived);
  useEffect(() => {
    onTokenReceivedRef.current = onTokenReceived;
  }, [onTokenReceived]);

  const viewRef = useRef<PlayerView | null>(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const send = useCallback((message: ClientMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  const submitOrder = useCallback((order: number) => {
    if (!Number.isInteger(order) || order < 0 || order > 10000) {
      setError('Order must be an integer between 0 and 10,000 units');
      return false;
    }
    const success = send({ type: 'SUBMIT_ORDER', order });
    if (success && gameId && role && viewRef.current) {
      tabBus.broadcast({
        type: 'ORDER_SUBMITTED',
        gameId,
        role,
        round: viewRef.current.currentRound,
      });
    }
    return success;
  }, [send, gameId, role]);

  const simulateRound = useCallback((targetRound?: number) => {
    return send({
      type: 'SIMULATE_ROUND',
      targetRound: targetRound ?? viewRef.current?.currentRound,
    });
  }, [send]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const connect = useCallback(() => {
    if (!gameId || isSupersededRef.current) return;
    isIntentionalCloseRef.current = false;

    // Clean up any pending reconnect timer
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setConnectionStatus((prev) => (prev === 'disconnected' ? 'connecting' : 'reconnecting'));

    // Construct WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const defaultWsUrl = `${protocol}//${host}/ws`;
    const targetUrl = customWsUrl || defaultWsUrl;

    const ws = new WebSocket(targetUrl);
    socketRef.current = ws;
    (window as any).__beerSocket = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');
      reconnectAttemptsRef.current = 0;
      setError(null);

      if (role) {
        // Issue JOIN_GAME intent with role and optional session token
        ws.send(
          JSON.stringify({
            type: 'JOIN_GAME',
            gameId,
            role,
            playerToken: tokenRef.current || undefined,
          }),
        );
      } else {
        // Issue WATCH_ROOM intent to receive real-time lobby updates
        ws.send(
          JSON.stringify({
            type: 'WATCH_ROOM',
            gameId,
          }),
        );
      }

      // Start 30s heartbeat keepalive
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'PING' }));
        }
      }, 30_000);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as ServerMessage;

        switch (msg.type) {
          case 'STATE_SYNC': {
            setView(msg.view);
            if (msg.playerToken && onTokenReceivedRef.current) {
              onTokenReceivedRef.current(msg.playerToken);
            }
            break;
          }

          case 'ROOM_STATE': {
            setRoomState(msg);
            break;
          }

          case 'GAME_STARTED': {
            setGameStartedNotice(true);
            tabBus.broadcast({ type: 'GAME_STARTED', gameId });
            break;
          }

          case 'ROUND_ADVANCED': {
            setRoundAdvancedNotice(msg.round);
            tabBus.broadcast({ type: 'ROUND_ADVANCED', gameId, round: msg.round });
            setTimeout(() => {
              setRoundAdvancedNotice((prev) => (prev === msg.round ? null : prev));
            }, 4000);
            break;
          }

          case 'GAME_COMPLETED': {
            setGameCompletedNotice({ totalChainCost: msg.totalChainCost });
            break;
          }

          case 'SUPERSEDED': {
            isSupersededRef.current = true;
            setIsSuperseded(true);
            setConnectionStatus('superseded');
            setError(msg.message || 'Session superseded in another window or tab.');
            break;
          }

          case 'ERROR_ALERT': {
            setError(msg.message);
            if (msg.code === 'UNAUTHORIZED_PLAYER') {
              setView(null);
              isIntentionalCloseRef.current = true;
              setConnectionStatus('disconnected');
              ws.close();
            }
            break;
          }

          case 'PONG': {
            // Heartbeat acknowledged
            break;
          }
        }
      } catch {
        // Invalid frame, ignore safely
      }
    };

    ws.onclose = (event) => {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }

      if (isIntentionalCloseRef.current) {
        return;
      }

      // Code 4001: Superseded by new session takeover
      if (event.code === 4001 || isSupersededRef.current) {
        setConnectionStatus('superseded');
        setIsSuperseded(true);
        return;
      }

      setConnectionStatus('reconnecting');

      // Exponential backoff auto-reconnect (1s, 2s, 4s, 8s, max 10s)
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10_000);
      reconnectAttemptsRef.current += 1;

      reconnectTimeoutRef.current = setTimeout(() => {
        if (!isSupersededRef.current && !isIntentionalCloseRef.current) {
          connect();
        }
      }, delay);
    };

    ws.onerror = () => {
      // WS error triggers onclose automatically
    };
  }, [gameId, role, customWsUrl]);

  // Connect whenever active role or gameId changes
  useEffect(() => {
    isSupersededRef.current = false;
    setIsSuperseded(false);

    if (!gameId) {
      setView(null);
      setRoomState(null);
      setConnectionStatus('disconnected');
      if (socketRef.current) {
        isIntentionalCloseRef.current = true;
        socketRef.current.close();
        socketRef.current = null;
      }
      return;
    }

    connect();

    return () => {
      isIntentionalCloseRef.current = true;
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [gameId, role, connect]);

  // Multi-Tab synchronization via BroadcastChannel
  useEffect(() => {
    const unsubscribe = tabBus.subscribe((event) => {
      if (!gameId || event.gameId !== gameId) return;

      if (event.type === 'ORDER_SUBMITTED') {
        // If a peer submitted in another tab, optimistically update peers in local view
        setView((prev) => {
          if (!prev) return prev;
          const updatedPeers = { ...prev.peers };
          if (updatedPeers[event.role]) {
            updatedPeers[event.role] = {
              ...updatedPeers[event.role],
              hasSubmittedThisRound: true,
            };
          }
          return {
            ...prev,
            peers: updatedPeers,
          };
        });
      } else if (event.type === 'ROUND_ADVANCED') {
        setRoundAdvancedNotice(event.round);
        setTimeout(() => {
          setRoundAdvancedNotice((prev) => (prev === event.round ? null : prev));
        }, 4000);
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ type: 'REQUEST_SYNC' }));
        }
      }
    });

    return unsubscribe;
  }, [gameId]);

  // Window/tab visibility wake-up: verify connection immediately when switching back to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && gameId && !isSupersededRef.current) {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
          connect();
        } else {
          socketRef.current.send(JSON.stringify({ type: 'REQUEST_SYNC' }));
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [gameId, connect]);

  return {
    connectionStatus,
    view,
    roomState,
    error,
    isSuperseded,
    gameStartedNotice,
    roundAdvancedNotice,
    gameCompletedNotice,
    send,
    submitOrder,
    simulateRound,
    clearError,
    reconnect: connect,
  };
}
