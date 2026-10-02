import { useState, useCallback } from 'react';
import { RoleType } from '../../core/types.js';

export interface GameSession {
  readonly gameId: string | null;
  readonly role: RoleType | null;
  readonly token: string | null;
}

const STORAGE_PREFIX = 'beer_game_';

function getStorageKey(gameId: string, role: string): string {
  return `${STORAGE_PREFIX}token_${gameId}_${role}`;
}

function getStoredToken(gameId: string, role: string): string | null {
  try {
    return (
      sessionStorage.getItem(getStorageKey(gameId, role)) ||
      localStorage.getItem(getStorageKey(gameId, role))
    );
  } catch {
    return null;
  }
}

function persistToken(gameId: string, role: string, token: string): void {
  try {
    sessionStorage.setItem(getStorageKey(gameId, role), token);
    localStorage.setItem(getStorageKey(gameId, role), token);
  } catch {
    // fallback if quota or security error
  }
}

function removePersistedToken(gameId: string, role: string): void {
  try {
    sessionStorage.removeItem(getStorageKey(gameId, role));
    localStorage.removeItem(getStorageKey(gameId, role));
  } catch {
    // fallback
  }
}

export function useSession() {
  const [session, setSessionState] = useState<GameSession>(() => {
    if (typeof window === 'undefined') {
      return { gameId: null, role: null, token: null };
    }

    // 1. Check URL parameters first (e.g. ?game=ROOM1&role=retailer&token=xyz)
    const params = new URLSearchParams(window.location.search);
    const urlGameId = params.get('game') || params.get('gameId') || params.get('room');
    const urlRole = params.get('role') as RoleType | null;
    const urlToken = params.get('token');

    // 2. Check tab-scoped sessionStorage or persistent localStorage
    const activeGameId =
      urlGameId ||
      sessionStorage.getItem(`${STORAGE_PREFIX}active_game`) ||
      localStorage.getItem(`${STORAGE_PREFIX}active_game`);
    const activeRole =
      urlRole || (sessionStorage.getItem(`${STORAGE_PREFIX}active_role`) as RoleType | null);

    let activeToken: string | null = urlToken;
    if (!activeToken && activeGameId && activeRole) {
      activeToken = getStoredToken(activeGameId, activeRole);
    }

    // Cache to storage if loaded from URL
    if (activeGameId) {
      sessionStorage.setItem(`${STORAGE_PREFIX}active_game`, activeGameId);
      localStorage.setItem(`${STORAGE_PREFIX}active_game`, activeGameId);
    }
    if (activeRole) {
      sessionStorage.setItem(`${STORAGE_PREFIX}active_role`, activeRole);
    }
    if (activeGameId && activeRole && activeToken) {
      persistToken(activeGameId, activeRole, activeToken);
    }

    return {
      gameId: activeGameId || null,
      role: activeRole || null,
      token: activeToken || null,
    };
  });

  // Sync state changes with sessionStorage, localStorage & URL bar
  const setSession = useCallback((gameId: string, role: RoleType, token: string) => {
    sessionStorage.setItem(`${STORAGE_PREFIX}active_game`, gameId);
    sessionStorage.setItem(`${STORAGE_PREFIX}active_role`, role);
    localStorage.setItem(`${STORAGE_PREFIX}active_game`, gameId);
    persistToken(gameId, role, token);

    // Update URL query parameters cleanly without reload
    const url = new URL(window.location.href);
    url.searchParams.set('game', gameId);
    url.searchParams.set('role', role);
    url.searchParams.set('token', token);
    window.history.replaceState({}, '', url.toString());

    setSessionState({ gameId, role, token });
  }, []);

  const setGameId = useCallback((gameId: string) => {
    sessionStorage.setItem(`${STORAGE_PREFIX}active_game`, gameId);
    localStorage.setItem(`${STORAGE_PREFIX}active_game`, gameId);
    const url = new URL(window.location.href);
    url.searchParams.set('game', gameId);
    window.history.replaceState({}, '', url.toString());

    setSessionState((prev) => ({
      gameId,
      role: prev.role,
      token: prev.role ? getStoredToken(gameId, prev.role) : null,
    }));
  }, []);

  const setRole = useCallback((role: RoleType) => {
    sessionStorage.setItem(`${STORAGE_PREFIX}active_role`, role);
    const url = new URL(window.location.href);
    url.searchParams.set('role', role);
    window.history.replaceState({}, '', url.toString());

    setSessionState((prev) => {
      const token = prev.gameId ? getStoredToken(prev.gameId, role) : null;
      if (token) {
        url.searchParams.set('token', token);
      } else {
        url.searchParams.delete('token');
      }
      window.history.replaceState({}, '', url.toString());
      return {
        gameId: prev.gameId,
        role,
        token,
      };
    });
  }, []);

  const leaveStation = useCallback(() => {
    if (session.gameId && session.role) {
      removePersistedToken(session.gameId, session.role);
    }
    sessionStorage.removeItem(`${STORAGE_PREFIX}active_role`);

    const url = new URL(window.location.href);
    url.searchParams.delete('game');
    url.searchParams.delete('room');
    url.searchParams.delete('gameId');
    url.searchParams.delete('role');
    url.searchParams.delete('token');
    window.history.replaceState({}, '', url.toString());

    setSessionState((prev) => ({
      gameId: prev.gameId,
      role: null,
      token: null,
    }));
  }, [session.gameId, session.role]);

  const clearSession = useCallback(() => {
    // Purge active station token and active pointers
    if (session.gameId && session.role) {
      removePersistedToken(session.gameId, session.role);
    }
    sessionStorage.removeItem(`${STORAGE_PREFIX}active_game`);
    sessionStorage.removeItem(`${STORAGE_PREFIX}active_role`);
    localStorage.removeItem(`${STORAGE_PREFIX}active_game`);

    // Clean all session-scoped beer_game storage keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => sessionStorage.removeItem(key));

    const url = new URL(window.location.href);
    url.searchParams.delete('game');
    url.searchParams.delete('room');
    url.searchParams.delete('gameId');
    url.searchParams.delete('role');
    url.searchParams.delete('token');
    const cleanUrl = url.pathname + (url.search ? url.search : '');
    window.history.replaceState({}, '', cleanUrl);

    setSessionState({ gameId: null, role: null, token: null });
  }, [session.gameId, session.role]);

  const getShareableLink = useCallback(
    (role?: RoleType, includeToken = false): string => {
      if (!session.gameId) return window.location.origin;
      const url = new URL(window.location.origin);
      url.searchParams.set('game', session.gameId);
      if (role) {
        url.searchParams.set('role', role);
        if (includeToken && session.token && session.role === role) {
          url.searchParams.set('token', session.token);
        }
      }
      return url.toString();
    },
    [session.gameId, session.role, session.token],
  );

  return {
    session,
    setSession,
    setGameId,
    setRole,
    leaveStation,
    clearSession,
    getShareableLink,
  };
}
