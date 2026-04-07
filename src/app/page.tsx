'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';

const TEAM = [
  { name: 'Milton Carmona', slackId: 'U09L6U44VLK' },
  { name: 'Gabriela Vicini', slackId: 'U0ACXLE4294' },
  { name: 'Maria Isabel Pardo', slackId: 'U0AL2245151' },
  { name: 'Beatriz Marchi', slackId: 'U0AQMDB21C0' },
  { name: 'Verneri', slackId: 'U06PAKQN7LP' },
  { name: 'Jam', slackId: 'U090L9DA6K0' },
  { name: 'Geoffrey', slackId: 'U08HJ3XB3R7' },
];

const TYPES = [
  { value: 'pto', label: 'PTO', emoji: '🏖️' },
  { value: 'unpaid', label: 'Unpaid', emoji: '🏝️' },
  { value: 'sick', label: 'Sick Leave', emoji: '🤒' },
  { value: 'personal', label: 'Personal', emoji: '🧘' },
];

type Status = 'idle' | 'submitting' | 'success' | 'error';

// Film grain effect - exact dashboard implementation
function useGrain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    let raf: number;
    function draw() {
      const w = canvas!.width;
      const h = canvas!.height;
      const img = ctx!.createImageData(w, h);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() * 255;
        d[i] = v;
        d[i + 1] = v;
        d[i + 2] = v;
        d[i + 3] = 255;
      }
      ctx!.putImageData(img, 0, 0);
      raf = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return canvasRef;
}

export default function PTOPage() {
  const [status, setStatus] = useState<Status>('idle');
  const [name, setName] = useState('');
  const [type, setType] = useState('pto');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [backup, setBackup] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const grainRef = useGrain();
  const today = new Date().toISOString().split('T')[0];
  // Minimum date: 21 days from now (3-week advance notice), except sick leave
  const minDate = new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0];
  const enforceAdvanceNotice = type !== 'sick';
  const effectiveMinDate = enforceAdvanceNotice ? minDate : today;
  const backupOptions = TEAM.filter((m) => m.name !== name);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (enforceAdvanceNotice && startDate < minDate) {
      setErrorMsg('Time off must be requested at least 3 weeks (21 days) in advance. For emergencies, contact Milton or Verneri directly.');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member: TEAM.find((m) => m.name === name),
          type,
          startDate,
          endDate: endDate || startDate,
          backup: TEAM.find((m) => m.name === backup),
          notes,
        }),
      });

      if (!res.ok) {
        let message = 'Submission failed';
        try {
          const data = await res.json();
          message = data.error || message;
        } catch {
          message = `Server error (${res.status})`;
        }
        throw new Error(message);
      }

      setStatus('success');
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(
        err instanceof Error ? err.message : 'Something went wrong'
      );
    }
  }

  function reset() {
    setStatus('idle');
    setName('');
    setType('pto');
    setStartDate('');
    setEndDate('');
    setBackup('');
    setNotes('');
    setErrorMsg('');
  }

  if (status === 'success') {
    const typeLabel = TYPES.find((t) => t.value === type)?.label || type;
    const formatDisplay = (d: string) => {
      const [, m, day] = d.split('-').map(Number);
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      return `${months[m - 1]} ${day}`;
    };
    const displayEnd = endDate || startDate;
    const dateRange =
      startDate === displayEnd
        ? formatDisplay(startDate)
        : `${formatDisplay(startDate)} → ${formatDisplay(displayEnd)}`;

    return (
      <main className="min-h-screen bg-[#0a0a0a] relative">
        <canvas ref={grainRef} id="grain" />
        <div className="grid-bg" />

        <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
          <div className="text-center anim">
            {/* Animated ring - dashboard style */}
            <div className="float mb-10">
              <svg
                width="180"
                height="180"
                viewBox="0 0 180 180"
                className="mx-auto glow-pulse"
              >
                <circle
                  cx="90" cy="90" r="70"
                  fill="none"
                  stroke="rgba(255,255,255,0.04)"
                  strokeWidth="4"
                />
                <circle
                  cx="90" cy="90" r="70"
                  fill="none"
                  stroke="var(--blue)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  className="ring-fill"
                  transform="rotate(-90 90 90)"
                />
                <path
                  className="animate-check"
                  d="M62 90l18 18 38-40"
                  stroke="var(--blue)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>

            <h2
              className="mb-2"
              style={{
                fontFamily: "'Satoshi', 'Inter', sans-serif",
                fontSize: '2rem',
                fontWeight: 900,
                letterSpacing: '-0.03em',
              }}
            >
              You&apos;re all set
            </h2>
            <p
              className="mb-10"
              style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem' }}
            >
              The team has been notified on Slack
            </p>

            <div className="gt-card inline-block text-left mb-10" style={{ padding: '20px 28px' }}>
              <div className="space-y-2" style={{ fontSize: '0.9rem' }}>
                <div style={{ color: 'rgba(255,255,255,0.5)' }}>
                  📅 <span style={{ color: 'rgba(255,255,255,0.7)' }}>{dateRange}</span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)' }}>
                  📋 <span style={{ color: 'rgba(255,255,255,0.7)' }}>{typeLabel}</span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)' }}>
                  🫡 Backup:{' '}
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>{backup}</span>
                </div>
              </div>
            </div>

            <div>
              <button
                onClick={reset}
                className="text-sm font-medium transition-colors"
                style={{ color: 'var(--blue)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--blue)')}
              >
                Submit another request →
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] relative">
      {/* Background layers - exact dashboard match */}
      <canvas ref={grainRef} id="grain" />
      <div className="grid-bg" />

      <div className="relative z-10" style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px 100px' }}>
        {/* Hero section */}
        <div className="relative" style={{ paddingBottom: 48 }}>
          <div className="hero-glow" />

          {/* GT Logo */}
          <div className="logo-anim text-center" style={{ marginBottom: 40 }}>
            <img
              src="https://framerusercontent.com/images/RJR6OSQ36lUju0aWuXOenvAzf38.png"
              alt="GrowthTrigger"
              style={{ height: 32, display: 'inline-block' }}
            />
          </div>

          {/* Page title - dashboard style */}
          <h1
            className="anim text-center"
            style={{
              fontFamily: "'Satoshi', 'Inter', sans-serif",
              fontSize: '1.3rem',
              fontWeight: 500,
              letterSpacing: '0.15em',
              textTransform: 'uppercase' as const,
              color: 'rgba(255,255,255,0.4)',
              marginBottom: 8,
            }}
          >
            Time Off <span style={{ color: 'white', fontWeight: 700 }}>Request</span>
          </h1>

          {/* Status dot */}
          <div className="anim anim-d1 flex items-center justify-center gap-2" style={{ marginTop: 16 }}>
            <div
              className="dot-glow"
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--blue)',
              }}
            />
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
              Take a break. You earned it.
            </span>
          </div>
        </div>

        {/* Form card */}
        <div className="gt-card anim anim-d2">
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Name */}
              <div>
                <label className="gt-label">Your Name</label>
                <select
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (backup === e.target.value) setBackup('');
                  }}
                  className="gt-input"
                  style={{ appearance: 'none', cursor: 'pointer' }}
                >
                  <option value="" disabled>Select your name</option>
                  {TEAM.map((m) => (
                    <option key={m.slackId} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Request Type */}
              <div>
                <label className="gt-label">Request Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={`type-pill ${type === t.value ? 'active' : ''}`}
                    >
                      <span style={{ display: 'block', fontSize: '1.1rem', marginBottom: 4 }}>
                        {t.emoji}
                      </span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="gt-label">Start Date</label>
                  <input
                    type="date"
                    required
                    min={effectiveMinDate}
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (endDate && endDate < e.target.value) setEndDate('');
                    }}
                    className="gt-input"
                  />
                </div>
                <div>
                  <label className="gt-label">
                    End Date <span className="gt-label-sub">(optional)</span>
                  </label>
                  <input
                    type="date"
                    min={startDate || today}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="gt-input"
                  />
                </div>
              </div>

              {/* Backup */}
              <div>
                <label className="gt-label">Who&apos;s Got Your Back?</label>
                <select
                  required
                  value={backup}
                  onChange={(e) => setBackup(e.target.value)}
                  className="gt-input"
                  style={{ appearance: 'none', cursor: 'pointer' }}
                >
                  <option value="" disabled>Select backup person</option>
                  {backupOptions.map((m) => (
                    <option key={m.slackId} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="gt-label">
                  Notes <span className="gt-label-sub">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Anything the team should know..."
                  className="gt-input"
                  style={{ resize: 'none' }}
                />
              </div>

              {/* Error */}
              {errorMsg && (
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: '#ff6b6b',
                    textAlign: 'center',
                    background: 'rgba(255,107,107,0.06)',
                    border: '1px solid rgba(255,107,107,0.1)',
                    borderRadius: 10,
                    padding: '12px 16px',
                  }}
                >
                  {errorMsg}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="gt-btn"
              >
                {status === 'submitting' ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer - exact dashboard style */}
        <div className="gt-footer anim anim-d4" style={{ marginTop: 48 }}>
          <p>GrowthTrigger Time Off Portal · HRardo Bot</p>
          <p>Powered by GrowthTrigger</p>
        </div>
      </div>
    </main>
  );
}
