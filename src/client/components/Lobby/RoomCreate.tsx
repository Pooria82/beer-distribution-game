import { useState } from 'react';

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
    <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🍺</span>
          <span>Start or Join a Session</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', fontSize: '0.95rem' }}>
          Create a new multiplayer supply chain simulation or join an existing team room.
        </p>

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 'var(--radius-md)',
              color: '#fca5a5',
              fontSize: '0.9rem',
              marginBottom: '1.5rem',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
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
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                New Game Room
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Optional Room Code (e.g. BEER-42)"
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
                  title="Generate Random Room Code"
                  style={{ padding: '0.65rem 0.85rem' }}
                >
                  🎲
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 'auto' }}
            >
              {isCreating ? 'Creating...' : 'Create New Game Room'}
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
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                Join Existing Room
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
              Enter Game Room
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
