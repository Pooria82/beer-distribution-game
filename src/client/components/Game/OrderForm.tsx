import React, { useState, useRef, useEffect } from 'react';
import { RoleState, RoleType, PeerSummary } from '../../../core/types.js';
import { SocketConnectionStatus } from '../../hooks/useGameSocket.js';
import {
  IconBot,
  IconHourglass,
  IconCheck,
  IconRadio,
  IconSliders,
} from '../Common/Icons.js';

export interface OrderFormProps {
  readonly currentRound: number;
  readonly myState: RoleState;
  readonly connectionStatus?: SocketConnectionStatus | undefined;
  readonly onSubmitOrder: (order: number) => boolean | void;
  readonly onSimulateRound?: (() => void) | undefined;
  readonly peers?: Readonly<Record<RoleType, PeerSummary>> | undefined;
}

export function OrderForm({
  currentRound,
  myState,
  connectionStatus,
  onSubmitOrder,
  onSimulateRound,
  peers,
}: OrderFormProps) {
  const [orderValue, setOrderValue] = useState<string>('4');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSuperseded = connectionStatus === 'superseded';
  const isLocked = myState.hasSubmittedThisRound || isSuperseded;

  const lockedCount = peers
    ? Object.values(peers).filter((p) => p.hasSubmittedThisRound).length
    : myState.hasSubmittedThisRound
      ? 1
      : 0;

  // Auto-focus input on mount and whenever currentRound changes
  useEffect(() => {
    setIsSubmitting(false);
    setIsSimulating(false);
    if (!isLocked) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [currentRound, isLocked]);

  // Re-focus input whenever window or tab regains focus
  useEffect(() => {
    const handleWindowFocus = () => {
      if (!isLocked) {
        inputRef.current?.focus();
      }
    };
    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [isLocked]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting || isLocked) return;

    const parsed = parseInt(orderValue, 10);
    if (Number.isNaN(parsed)) {
      return;
    }

    setIsSubmitting(true);
    const sent = onSubmitOrder(parsed);
    if (sent === false) {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Global keydown listener: Enables pressing Enter anywhere on the page to submit the round
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (e.defaultPrevented) return;
        if (isLocked || isSubmitting) return;

        const activeTag = document.activeElement?.tagName?.toLowerCase();
        if (activeTag === 'textarea') return;

        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [orderValue, isSubmitting, isLocked, onSubmitOrder]);

  const adjustValue = (delta: number) => {
    if (isLocked) return;
    const current = parseInt(orderValue, 10) || 0;
    const next = Math.max(0, current + delta);
    setOrderValue(next.toString());
    inputRef.current?.focus();
  };

  const setPreset = (val: number) => {
    if (isLocked) return;
    setOrderValue(val.toString());
    inputRef.current?.focus();
  };

  return (
    <div className="scada-panel" style={{ width: '100%' }}>
      {/* Panel Header */}
      <div className="scada-panel-header">
        <div className="scada-panel-title">
          <IconSliders size={15} color="var(--scada-amber)" />
          <span>ORDER ACTUATION CONSOLE // TRANSMISSION BAY</span>
        </div>
        <span
          className="scada-badge"
          style={{
            color: isSuperseded ? 'var(--scada-red)' : isLocked ? 'var(--scada-green)' : 'var(--scada-amber)',
            borderColor: isSuperseded ? 'rgba(239, 68, 68, 0.5)' : isLocked ? 'rgba(0, 255, 157, 0.4)' : 'rgba(245, 158, 11, 0.4)',
          }}
        >
          {isSuperseded ? 'SESSION SUPERSEDED' : isLocked ? 'ORDER LOCKED' : 'TRANSMITTER ARMED'}
        </span>
      </div>

      <div className="scada-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Main Numeric Actuator Controls */}
          <div className="scada-actuator-row">
            {/* Decrement Steppers */}
            <button
              type="button"
              disabled={isLocked || isSubmitting}
              onClick={() => adjustValue(-5)}
              className="btn-scada scada-stepper-btn"
            >
              -5
            </button>
            <button
              type="button"
              disabled={isLocked || isSubmitting}
              onClick={() => adjustValue(-1)}
              className="btn-scada scada-stepper-btn"
            >
              -1
            </button>

            {/* Central Big Number Input */}
            <div className="scada-actuator-input-container" style={{ flex: 1, position: 'relative' }}>
              <input
                ref={inputRef}
                type="number"
                min="0"
                step="1"
                disabled={isLocked || isSubmitting}
                data-action="order-input"
                value={orderValue}
                onChange={(e) => setOrderValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="scada-input"
                style={{
                  height: '100%',
                  textAlign: 'center',
                  fontSize: '1.75rem',
                  color: isLocked ? 'var(--scada-green)' : 'var(--scada-amber)',
                  letterSpacing: '0.05em',
                }}
              />
            </div>

            {/* Increment Steppers */}
            <button
              type="button"
              disabled={isLocked || isSubmitting}
              onClick={() => adjustValue(+1)}
              className="btn-scada scada-stepper-btn"
            >
              +1
            </button>
            <button
              type="button"
              disabled={isLocked || isSubmitting}
              onClick={() => adjustValue(+5)}
              className="btn-scada scada-stepper-btn"
            >
              +5
            </button>
            <button
              type="button"
              disabled={isLocked || isSubmitting}
              onClick={() => adjustValue(+10)}
              className="btn-scada scada-stepper-btn"
            >
              +10
            </button>
          </div>

          {/* Quick Presets Bar */}
          <div className="scada-presets-container">
            <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-hud)', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              BATCH PRESETS:
            </span>
            <div className="scada-presets-pills">
              {[0, 4, 8, 12, 16, 20].map((val) => (
                <button
                  key={val}
                  type="button"
                  disabled={isLocked || isSubmitting}
                  onClick={() => setPreset(val)}
                  className="btn-scada"
                  style={{
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    borderColor: orderValue === val.toString() ? 'var(--scada-cyan)' : undefined,
                  }}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Big Actuator Submit Button */}
          <button
            type="submit"
            disabled={isLocked || isSubmitting}
            data-action="transmit-order"
            className={`btn-scada scada-order-submit-btn ${isLocked ? '' : 'btn-scada-warning'}`}
            style={{
              padding: '0.85rem',
              fontSize: '1.05rem',
              letterSpacing: '0.1em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
            }}
          >
            {isLocked ? (
              <>
                <IconCheck size={18} color="var(--scada-green)" />
                <span style={{ color: 'var(--scada-green)' }}>
                  ORDER TRANSMITTED ({myState.lastOrderPlaced} UNITS) • {lockedCount} / 4 OPERATORS LOCKED
                </span>
              </>
            ) : isSubmitting ? (
              <>
                <IconHourglass size={18} />
                <span>ENCRYPTING & TRANSMITTING TELEMETRY...</span>
              </>
            ) : (
              <>
                <IconRadio size={18} />
                <span>TRANSMIT ORDER // ROUND {currentRound}</span>
                {lockedCount > 0 && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--scada-amber)',
                      fontFamily: 'var(--font-mono)',
                      marginLeft: '0.4rem',
                    }}
                  >
                    ({lockedCount}/4 READY)
                  </span>
                )}
                <kbd style={{ marginLeft: '0.5rem' }}>↵ ENTER</kbd>
              </>
            )}
          </button>
        </form>

        {/* Evaluator Sim Simulator Trigger */}
        {onSimulateRound && !isSuperseded && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.35rem',
              padding: '0.45rem 0.75rem',
              background: 'var(--bg-panel-inset)',
              border: '1px solid var(--border-panel)',
              borderRadius: 'var(--radius-xs)',
            }}
          >
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              EVALUATOR HARNESS // INSTANT STEP ADVANCE:
            </span>
            <button
              type="button"
              data-action="auto-complete-round"
              onClick={() => {
                if (isSubmitting || isSimulating || !onSimulateRound) return;
                setIsSimulating(true);
                if (!isLocked) {
                  handleSubmit();
                }
                onSimulateRound();
              }}
              disabled={isSubmitting || isSimulating}
              className="btn-scada"
              style={{
                padding: '0.25rem 0.6rem',
                fontSize: '0.72rem',
                opacity: isSimulating ? 0.6 : 1,
                cursor: isSimulating ? 'wait' : undefined,
              }}
            >
              <IconBot size={12} color="var(--scada-cyan)" />
              <span>{isSimulating ? 'COMPUTING ADVANCE...' : 'AUTO-COMPLETE ROUND'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
