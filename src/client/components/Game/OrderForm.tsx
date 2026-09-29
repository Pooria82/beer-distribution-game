import { useState, useRef, useEffect } from 'react';
import { RoleState } from '../../../core/types.js';

export interface OrderFormProps {
  readonly currentRound: number;
  readonly myState: RoleState;
  readonly onSubmitOrder: (order: number) => void;
  readonly onSimulateRound?: (() => void) | undefined;
}

export function OrderForm({
  currentRound,
  myState,
  onSubmitOrder,
  onSimulateRound,
}: OrderFormProps) {
  const [orderValue, setOrderValue] = useState<string>('4');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount and whenever currentRound changes
  useEffect(() => {
    setIsSubmitting(false);
    if (!myState.hasSubmittedThisRound) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [currentRound, myState.hasSubmittedThisRound]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting || myState.hasSubmittedThisRound) return;

    const parsed = parseInt(orderValue, 10);
    if (Number.isNaN(parsed) || parsed < 0) {
      return;
    }

    setIsSubmitting(true);
    onSubmitOrder(parsed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const setQuickValue = (val: number) => {
    setOrderValue(val.toString());
    inputRef.current?.focus();
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.5rem',
        marginBottom: '1.75rem',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.75) 100%)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📝</span>
            <span>Order Decision — Round {currentRound}</span>
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            Enter the number of units you wish to order from your upstream supplier. Orders take 2 rounds to arrive.
          </p>
        </div>

        {/* Reviewer / Bot Simulator Button */}
        {onSimulateRound && (
          <button
            type="button"
            onClick={onSimulateRound}
            className="btn btn-secondary"
            title="Automatically fills orders for any roles that haven't submitted yet"
            style={{ fontSize: '0.825rem', padding: '0.45rem 0.85rem' }}
          >
            <span>🤖</span>
            <span>Simulate Remaining Roles</span>
          </button>
        )}
      </div>

      {myState.hasSubmittedThisRound ? (
        /* Submitted State Banner */
        <div
          style={{
            padding: '1.25rem',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>⏳</span>
            <div>
              <div style={{ fontWeight: 700, color: '#34d399', fontSize: '0.95rem' }}>
                Order Placed ({myState.lastOrderPlaced} units) — Waiting for Peers
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Your order is registered. Round {currentRound} will automatically execute once all 4 roles have submitted.
              </div>
            </div>
          </div>

          <span
            className="badge"
            style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)' }}
          >
            Submitted ✓
          </span>
        </div>
      ) : (
        /* Active Order Input Form */
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ width: '160px' }}>
              <input
                ref={inputRef}
                type="number"
                min={0}
                max={10000}
                step={1}
                value={orderValue}
                onChange={(e) => setOrderValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="input-field"
                placeholder="0"
                disabled={isSubmitting}
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  padding: '0.65rem 0.75rem',
                }}
              />
            </div>

            {/* Quick Pick Chips */}
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '0.2rem' }}>Quick:</span>
              {[0, 4, 8, 12, 16].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setQuickValue(num)}
                  disabled={isSubmitting}
                  className="btn btn-ghost"
                  style={{
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.85rem',
                    border: '1px solid var(--border-subtle)',
                    minWidth: '36px',
                  }}
                >
                  {num}
                </button>
              ))}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !orderValue.trim()}
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.5rem', marginLeft: 'auto' }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Order (Enter ↵)'}
            </button>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Tip: Press <strong>Enter</strong> to instantly submit.</span>
            <span>Last order placed: {myState.lastOrderPlaced} units</span>
          </div>
        </form>
      )}
    </div>
  );
}
