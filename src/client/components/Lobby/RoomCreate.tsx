import { useState } from 'react';
import { IconBeer, IconDice } from '../Common/Icons.js';

export interface RoomCreateProps {
  readonly onRoomCreated: (roomId: string) => void;
  readonly onRoomJoined: (roomId: string) => void;
  readonly isCreating?: boolean;
}

export function RoomCreate({ onRoomCreated, onRoomJoined, isCreating = false }: RoomCreateProps) {
  const [customRoomId, setCustomRoomId] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'BEER-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCustomRoomId(code);
    setError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = joinRoomId.trim().toUpperCase();
    if (!cleanId) {
      setError('Please enter a valid room code');
      return;
    }
    setError(null);
    onRoomJoined(cleanId);
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', width: '100%' }}>
      <div className="glass-panel" style={{ padding: '2.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-accent)',
            }}
          >
            <IconBeer size={22} color="var(--primary-500)" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Start or Join a Session</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Create a new 4-node multiplayer room or join an existing simulation.
            </p>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#fca5a5',
              fontSize: '0.875rem',
              margin: '1.25rem 0',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginTop: '1.5rem' }}>
          {/* Create Room Box */}
          <form
            onSubmit={handleCreate}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              background: 'rgba(255, 255, 255, 0.02)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.45rem', color: 'var(--text-primary)' }}>
                Create New Room
              </label>
              <div style={{ display: 'flex', gap: '0.45rem' }}>
                <input
                  type="text"
                  placeholder="Code (e.g. BEER-42)"
                  value={customRoomId}
                  onChange={(e) => setCustomRoomId(e.target.value.toUpperCase())}
                  className="input-field"
                  style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  maxLength={16}
                />
                <button
                  type="button"
                  onClick={generateRandomCode}
                  className="btn btn-secondary"
                  title="Generate Random Code"
                  style={{ padding: '0.65rem 0.85rem' }}
                >
                  <IconDice size={18} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 'auto' }}
            >
              {isCreating ? 'Creating Room...' : 'Create Room'}
            </button>
          </form>

          {/* Join Room Box */}
          <form
            onSubmit={handleJoin}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              background: 'rgba(255, 255, 255, 0.02)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.45rem', color: 'var(--text-primary)' }}>
                Enter Existing Room
              </label>
              <input
                type="text"
                placeholder="Enter Room Code"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                className="input-field"
                style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
                maxLength={16}
              />
            </div>

            <button
              type="submit"
              disabled={!joinRoomId.trim()}
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: 'auto' }}
            >
              Join Session
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
