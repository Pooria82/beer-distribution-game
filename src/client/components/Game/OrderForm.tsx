import React, { useState, useRef, useEffect } from 'react';
import { RoleState } from '../../../core/types.js';
import {
  IconOrderNote,
  IconBot,
  IconHourglass,
  IconCheck,
} from '../Common/Icons.js';

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
        background: 'linear-gradient(180deg, rgba(19, 27, 46, 0.75) 0%, rgba(12, 16, 27, 0.85) 100%)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-accent)',
              }}
            >
              <IconOrderNote size={16} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Order Decision — Round {currentRound}
            </h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', marginTop: '0.25rem' }}>
            Submit order quantity to your upstream supplier. Shipped units take 2 rounds to arrive.
          </p>
        </div>

        {/* Reviewer / Bot Simulator Button */}
        {onSimulateRound && (
          <button
            type="button"
            onClick={onSimulateRound}
            className="btn btn-secondary"
            title="Automatically fills orders for any remaining unsubmitted roles"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
          >
            <IconBot size={15} color="var(--primary-500)" />
            <span>Simulate Remaining Roles</span>
          </button>
        )}
      </div>

      {myState.hasSubmittedThisRound ? (
        /* Submitted State Banner */
        <div
          style={{
            padding: '1.15rem 1.25rem',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399',
              }}
            >
              <IconHourglass size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#34d399', fontSize: '0.925rem' }}>
                Order Registered ({myState.lastOrderPlaced} units) • Waiting for Peers
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Your order is locked. Round {currentRound} will automatically progress once all 4 roles complete their turn.
              </div>
            </div>
          </div>

          <span
            className="badge"
            style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)' }}
          >
            <IconCheck size={12} /> Ready
          </span>
        </div>
      ) : (
        /* Active Order Input Form */
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ width: '150px' }}>
              <input
                ref={inputRef}
                type="number"
                min={0}
                max={10000}
                step={1}
                value={orderValue}
                onChange={(e) => setOrderValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="input-field metric-num"
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
            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginRight: '0.2rem' }}>Preset:</span>
              {[0, 4, 8, 12, 16].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setQuickValue(num)}
                  disabled={isSubmitting}
                  className="btn btn-ghost metric-num"
                  style={{
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.85rem',
                    border: '1px solid var(--border-subtle)',
                    minWidth: '34px',
                    borderRadius: 'var(--radius-sm)',
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
              style={{ padding: '0.65rem 1.35rem', marginLeft: 'auto', gap: '0.5rem' }}
            >
              <span>{isSubmitting ? 'Locking Order...' : 'Submit Order'}</span>
              <kbd style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem' }}>↵ Enter</kbd>
            </button>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span>Press <kbd>Enter</kbd> to submit immediately.</span>
            <span>Last order placed: <strong className="metric-num" style={{ color: 'var(--text-primary)' }}>{myState.lastOrderPlaced}</strong> units</span>
          </div>
        </form>
      )}
    </div>
  );
}
