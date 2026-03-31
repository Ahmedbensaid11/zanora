import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://localhost:8083/api';

const formatPrice = (val) =>
  val != null ? `$${Number(val).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—';

const formatDate = (val) =>
  val ? new Date(val).toLocaleString() : 'Never';

const pulse = `
  @keyframes pulse-ring {
    0%   { transform: scale(0.8); opacity: 1; }
    100% { transform: scale(1.6); opacity: 0; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes bar-grow {
    from { width: 0; }
  }
`;

export default function MLHealthPage() {
  const [health, setHealth]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [training, setTraining]     = useState(false);
  const [trainResult, setTrainResult] = useState(null);
  const [trainError, setTrainError] = useState(null);
  const [pollTimer, setPollTimer]   = useState(null);

  const fetchHealth = useCallback(async () => {
    try {
      const res  = await fetch(`${API_BASE}/health`);
      const data = await res.json();
      setHealth(data);
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const id = setInterval(fetchHealth, 10_000);
    return () => clearInterval(id);
  }, [fetchHealth]);

  const handleTrain = async () => {
    setTraining(true);
    setTrainResult(null);
    setTrainError(null);

    try {
      const res  = await fetch(`${API_BASE}/predictions/train`, { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        setTrainError(data.error || 'Training failed');
      } else {
        setTrainResult(data);
        fetchHealth();
      }
    } catch (e) {
      setTrainError(e.message || 'Network error');
    } finally {
      setTraining(false);
    }
  };

  const status     = health?.status ?? 'unknown';
  const isTrained  = health?.model_trained;
  const isTraining = health?.is_training || training;
  const metrics    = health?.metrics;

  const statusColor =
    status === 'healthy'   ? '#22d3a5' :
    status === 'untrained' ? '#f59e0b' :
    '#ef4444';

  const statusLabel =
    isTraining ? 'Training…' :
    status === 'healthy'   ? 'Healthy' :
    status === 'untrained' ? 'Untrained' :
    'Unknown';

  const metricItems = metrics ? [
    { label: 'MAE',        value: metrics.meanAbsoluteError      != null ? `$${Number(metrics.meanAbsoluteError).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—' },
    { label: 'RMSE',       value: metrics.rootMeanSquaredError   != null ? `$${Number(metrics.rootMeanSquaredError).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—' },
    { label: 'R²',         value: metrics.r2Score                != null ? Number(metrics.r2Score).toFixed(4) : '—' },
    { label: 'Train Size', value: metrics.trainingSize           ?? '—' },
    { label: 'Test Size',  value: metrics.testSize               ?? '—' },
    { label: 'Algorithm',  value: metrics.modelType              ?? '—' },
  ] : [];

  const r2Pct = metrics?.r2Score != null ? Math.max(0, Math.min(100, metrics.r2Score * 100)) : 0;

  return (
    <>
      <style>{pulse}</style>

      <div style={styles.page}>

        {/* ── Header ── */}
        <div style={styles.header}>
          <div>
            <p style={styles.breadcrumb}>Real Estate AI</p>
            <h1 style={styles.title}>Model Health</h1>
          </div>

          <button
            onClick={handleTrain}
            disabled={isTraining}
            style={{ ...styles.trainBtn, ...(isTraining ? styles.trainBtnDisabled : {}) }}
          >
            {isTraining
              ? <><SpinIcon /> Training…</>
              : <><BoltIcon /> Train Model</>}
          </button>
        </div>

        {/* ── Status Card ── */}
        <div style={{ ...styles.card, animation: 'fade-in 0.4s ease both' }}>
          <div style={styles.statusRow}>
            <div style={styles.statusDotWrap}>
              {!isTraining && (
                <span style={{ ...styles.statusRing, borderColor: statusColor }} />
              )}
              <span style={{ ...styles.statusDot, background: statusColor }}>
                {isTraining && <span style={styles.spinDot} />}
              </span>
            </div>

            <div>
              <p style={{ ...styles.statusLabel, color: statusColor }}>{statusLabel}</p>
              <p style={styles.statusSub}>
                Last trained: {formatDate(health?.last_training)}
              </p>
            </div>

            <button onClick={fetchHealth} style={styles.refreshBtn} title="Refresh">
              <RefreshIcon />
            </button>
          </div>
        </div>

        {/* ── Alerts ── */}
        {trainResult && (
          <div style={{ ...styles.alert, ...styles.alertSuccess, animation: 'fade-in 0.3s ease both' }}>
            <CheckIcon color="#22d3a5" />
            <div>
              <strong style={{ color: '#22d3a5' }}>Training complete</strong>
              <p style={styles.alertSub}>
                R² {trainResult.r2Score?.toFixed(4)} · MAE {formatPrice(trainResult.meanAbsoluteError)} · RMSE {formatPrice(trainResult.rootMeanSquaredError)}
              </p>
            </div>
            <button onClick={() => setTrainResult(null)} style={styles.alertClose}>✕</button>
          </div>
        )}

        {trainError && (
          <div style={{ ...styles.alert, ...styles.alertError, animation: 'fade-in 0.3s ease both' }}>
            <XIcon color="#ef4444" />
            <div>
              <strong style={{ color: '#ef4444' }}>Training failed</strong>
              <p style={styles.alertSub}>{trainError}</p>
            </div>
            <button onClick={() => setTrainError(null)} style={styles.alertClose}>✕</button>
          </div>
        )}

        {/* ── Metrics Grid ── */}
        {isTrained && metricItems.length > 0 && (
          <div style={{ animation: 'fade-in 0.5s ease 0.1s both' }}>
            <p style={styles.sectionLabel}>Performance Metrics</p>
            <div style={styles.metricsGrid}>
              {metricItems.map((m, i) => (
                <div key={i} style={styles.metricCard}>
                  <p style={styles.metricLabel}>{m.label}</p>
                  <p style={styles.metricValue}>{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── R² bar ── */}
        {isTrained && metrics?.r2 != null && (
          <div style={{ ...styles.card, animation: 'fade-in 0.5s ease 0.2s both' }}>
            <div style={styles.barHeader}>
              <p style={styles.barLabel}>Model Accuracy (R²)</p>
              <p style={styles.barValue}>{(metrics.r2 * 100).toFixed(1)}%</p>
            </div>
            <div style={styles.barTrack}>
              <div
                style={{
                  ...styles.barFill,
                  width: `${r2Pct}%`,
                  background: r2Pct > 75 ? '#22d3a5' : r2Pct > 50 ? '#f59e0b' : '#ef4444',
                  animation: 'bar-grow 0.8s ease 0.3s both',
                }}
              />
            </div>
            <div style={styles.barLegend}>
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !isTrained && !isTraining && (
          <div style={{ ...styles.emptyCard, animation: 'fade-in 0.4s ease 0.1s both' }}>
            <BrainIcon />
            <p style={styles.emptyTitle}>Model not trained yet</p>
            <p style={styles.emptySub}>Click "Train Model" to build the prediction model from your listing data.</p>
          </div>
        )}

        {loading && (
          <div style={styles.emptyCard}>
            <p style={{ color: 'var(--color-text-muted)' }}>Loading…</p>
          </div>
        )}
      </div>
    </>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────── */
const styles = {
  page: {
    padding: '32px 28px',
    maxWidth: 860,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  header: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  breadcrumb: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    fontSize: 'var(--font-size-2xl)',
    fontWeight: 'var(--font-weight-bold)',
    color: 'var(--color-text-primary)',
    margin: 0,
  },
  trainBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 22px',
    background: 'var(--color-primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-lg)',
    fontWeight: 'var(--font-weight-semibold)',
    fontSize: 'var(--font-size-base)',
    cursor: 'pointer',
    transition: 'var(--transition-base)',
    boxShadow: '0 0 0 0 transparent',
  },
  trainBtnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  card: {
    background: 'var(--color-bg-surface)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 'var(--radius-xl)',
    padding: '20px 24px',
  },

  /* status */
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  statusDotWrap: {
    position: 'relative',
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statusRing: {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    border: '2px solid',
    animation: 'pulse-ring 1.8s ease-out infinite',
  },
  statusDot: {
    width: 18,
    height: 18,
    borderRadius: '50%',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    animation: 'spin 0.8s linear infinite',
    display: 'inline-block',
  },
  statusLabel: {
    fontWeight: 'var(--font-weight-bold)',
    fontSize: 'var(--font-size-md)',
    margin: 0,
  },
  statusSub: {
    color: 'var(--color-text-muted)',
    fontSize: 'var(--font-size-xs)',
    marginTop: 2,
  },
  refreshBtn: {
    marginLeft: 'auto',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    padding: '6px 8px',
    display: 'flex',
    alignItems: 'center',
    transition: 'var(--transition-base)',
  },

  /* alerts */
  alert: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '14px 18px',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid',
  },
  alertSuccess: {
    background: 'rgba(34,211,165,0.08)',
    borderColor: 'rgba(34,211,165,0.25)',
  },
  alertError: {
    background: 'rgba(239,68,68,0.08)',
    borderColor: 'rgba(239,68,68,0.25)',
  },
  alertSub: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
    marginTop: 2,
  },
  alertClose: {
    marginLeft: 'auto',
    background: 'transparent',
    border: 'none',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    fontSize: 14,
    padding: '0 4px',
  },

  /* metrics */
  sectionLabel: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
    gap: 12,
  },
  metricCard: {
    background: 'var(--color-bg-surface)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 'var(--radius-lg)',
    padding: '14px 16px',
  },
  metricLabel: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 'var(--font-size-lg)',
    fontWeight: 'var(--font-weight-bold)',
    color: 'var(--color-text-primary)',
    margin: 0,
  },

  /* bar */
  barHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  barLabel: {
    color: 'var(--color-text-secondary)',
    fontSize: 'var(--font-size-sm)',
    margin: 0,
  },
  barValue: {
    fontWeight: 'var(--font-weight-bold)',
    color: 'var(--color-text-primary)',
    fontSize: 'var(--font-size-md)',
    margin: 0,
  },
  barTrack: {
    height: 8,
    background: 'rgba(255,255,255,0.07)',
    borderRadius: 'var(--radius-full)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 'var(--radius-full)',
  },
  barLegend: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
    marginTop: 6,
  },

  /* empty */
  emptyCard: {
    background: 'var(--color-bg-surface)',
    border: '1px dashed rgba(255,255,255,0.1)',
    borderRadius: 'var(--radius-xl)',
    padding: '48px 32px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--color-text-primary)',
    fontSize: 'var(--font-size-md)',
    margin: 0,
  },
  emptySub: {
    color: 'var(--color-text-muted)',
    fontSize: 'var(--font-size-sm)',
    maxWidth: 340,
    margin: 0,
  },
};

/* ── Icon helpers ──────────────────────────────────────────────────── */
const BoltIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

const SpinIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const CheckIcon = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const XIcon = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

const BrainIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
    <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/>
    <path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/>
    <path d="M6 18a4 4 0 0 1-1.967-.516"/><path d="M19.967 17.484A4 4 0 0 1 18 18"/>
  </svg>
);