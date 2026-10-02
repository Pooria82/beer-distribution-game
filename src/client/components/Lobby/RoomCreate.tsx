import { useState, useRef, useEffect } from 'react';
import { IconCpu, IconDice, IconRadio, IconTerminal, IconChevronLeft } from '../Common/Icons.js';

export interface RoomCreateProps {
  readonly onRoomCreated: (roomId: string) => void;
  readonly onRoomJoined: (roomId: string) => void;
  readonly isCreating?: boolean;
  readonly onToggleCollapse?: () => void;
}

export function RoomCreate({
  onRoomCreated,
  onRoomJoined,
  isCreating = false,
  onToggleCollapse,
}: RoomCreateProps) {
  const [customRoomId, setCustomRoomId] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the commission input when panel mounts
  useEffect(() => {
    customInputRef.current?.focus();
  }, []);

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'FACILITY-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCustomRoomId(code);
    setError(null);
    customInputRef.current?.focus();
  };

  const handleCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isCreating) return;
    const roomId = customRoomId.trim().toUpperCase() || undefined;

    try {
      setError(null);
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredId: roomId }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || 'Failed to create game room');
      }

      const data = (await res.json()) as { gameId: string };
      onRoomCreated(data.gameId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating room');
    }
  };

  const handleJoin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = joinRoomId.trim().toUpperCase();
    if (!cleanId) {
      setError('Please enter a valid authorization key');
      return;
    }
    setError(null);
    onRoomJoined(cleanId);
  };

  // Global Enter listener: When focus is anywhere on the page (not in another button/input)
  useEffect(() => {
    const handleGlobalEnter = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (e.defaultPrevented) return;
        const activeTag = document.activeElement?.tagName?.toLowerCase();
        if (activeTag === 'input' || activeTag === 'button' || activeTag === 'textarea') return;

        if (joinRoomId.trim()) {
          e.preventDefault();
          handleJoin();
        } else {
          e.preventDefault();
          handleCreate();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalEnter);
    return () => window.removeEventListener('keydown', handleGlobalEnter);
  }, [customRoomId, joinRoomId, isCreating]);

  return (
    <div className="scada-panel" style={{ width: '100%', height: '100%' }}>
      {/* Panel Header */}
      <div className="scada-panel-header" style={{ justifyContent: 'space-between' }}>
        <div className="scada-panel-title">
          <IconTerminal size={15} color="var(--scada-cyan)" />
          <span>SECTOR-01 // SESSION COMMISSIONING</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span
            className="scada-badge"
            style={{
              color: isCreating ? 'var(--scada-amber)' : 'var(--scada-cyan)',
              borderColor: isCreating ? 'rgba(245, 158, 11, 0.4)' : 'rgba(0, 240, 255, 0.4)',
            }}
          >
            {isCreating ? 'COMMISSIONING...' : 'BAY DISPATCH'}
          </span>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="btn-scada"
              style={{ padding: '0.15rem 0.35rem', fontSize: '0.7rem' }}
              title="Collapse Sector 1 Sidebar"
            >
              <IconChevronLeft size={13} color="var(--text-secondary)" />
            </button>
          )}
        </div>
      </div>

      <div className="scada-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.4 }}>
          Initialize an authoritative 4-station SCADA simulation room or connect to an active distributed node network.
        </p>

        {error && (
          <div
            style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: 'rgba(255, 51, 102, 0.12)',
              border: '1px solid rgba(255, 51, 102, 0.4)',
              borderRadius: 'var(--radius-xs)',
              color: '#fca5a5',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
            }}
          >
            [ALERT] {error}
          </div>
        )}

        {/* Action Bay 1: Commission Room */}
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-hud)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            A. COMMISSION NEW ROOM // ACCESS KEY
          </label>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              ref={customInputRef}
              type="text"
              className="scada-input"
              placeholder="AUTO OR CUSTOM ID"
              value={customRoomId}
              onChange={(e) => setCustomRoomId(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreate();
                }
              }}
              maxLength={20}
              style={{ fontSize: '0.8rem', letterSpacing: '0.04em' }}
            />
            <button
              type="button"
              onClick={generateRandomCode}
              className="btn-scada"
              title="Generate Random Access Key"
              style={{ padding: '0.5rem 0.75rem', flexShrink: 0 }}
            >
              <IconDice size={15} color="var(--scada-amber)" />
              <span style={{ fontSize: '0.78rem' }}>RND</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={isCreating}
            data-action="commission-room"
            className="btn-scada btn-scada-primary"
            style={{ width: '100%', padding: '0.65rem', marginTop: '0.25rem' }}
          >
            <IconCpu size={16} />
            <span>COMMISSION SESSION BAY</span>
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.25rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-panel)' }} />
          <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-hud)', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
            OR JOIN ACTIVE
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-panel)' }} />
        </div>

        {/* Action Bay 2: Join Room */}
        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-hud)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            B. CONNECT TO REMOTE TELEMETRY BAY
          </label>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="scada-input"
              placeholder="ENTER BAY CODE"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleJoin();
                }
              }}
              maxLength={20}
              style={{ fontSize: '0.8rem', letterSpacing: '0.04em' }}
            />
            <button
              type="submit"
              className="btn-scada"
              style={{ padding: '0.5rem 1rem', flexShrink: 0 }}
            >
              <IconRadio size={14} color="var(--scada-green)" />
              <span>LINK</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
