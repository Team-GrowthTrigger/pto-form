'use client';

import { useState, FormEvent } from 'react';

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

const inputClasses =
  'w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#002fff]/50 focus:ring-1 focus:ring-[#002fff]/20 transition-all';

export default function PTOPage() {
  const [status, setStatus] = useState<Status>('idle');
  const [name, setName] = useState('');
  const [type, setType] = useState('pto');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [backup, setBackup] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const backupOptions = TEAM.filter((m) => m.name !== name);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
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
        const data = await res.json();
        throw new Error(data.error || 'Submission failed');
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
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 relative">
        <div className="text-center animate-fade-in relative z-10">
          <div className="w-20 h-20 mx-auto mb-8 relative">
            <svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              fill="none"
              className="absolute inset-0"
            >
              <circle
                className="animate-circle"
                cx="40"
                cy="40"
                r="36"
                stroke="#002fff"
                strokeWidth="2"
                fill="none"
              />
            </svg>
            <svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              fill="none"
              className="absolute inset-0"
            >
              <path
                className="animate-check"
                d="M26 40l10 10 18-20"
                stroke="#002fff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>

          <h2 className="font-display text-3xl font-bold mb-2">
            You&apos;re all set
          </h2>
          <p className="text-white/40 mb-8 text-sm">
            The team has been notified on Slack
          </p>

          <div className="inline-flex flex-col gap-2 text-sm text-white/50 mb-10 bg-white/[0.025] border border-white/[0.06] rounded-xl px-6 py-4">
            <span>
              📅 <span className="text-white/70">{dateRange}</span>
            </span>
            <span>
              📋 <span className="text-white/70">{typeLabel}</span>
            </span>
            <span>
              🫡 Backup:{' '}
              <span className="text-white/70">{backup}</span>
            </span>
          </div>

          <div>
            <button
              onClick={reset}
              className="text-[#002fff] hover:text-white transition-colors text-sm font-medium"
            >
              Submit another request →
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 relative">
      <div className="w-full max-w-lg relative z-10">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-[#002fff] mb-4">
            GrowthTrigger
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            Time Off Request
          </h1>
          <p className="text-white/30 text-sm">
            Take a break. You earned it.
          </p>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8 shadow-[0_0_80px_rgba(0,47,255,0.03)] animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-widest text-white/40 mb-2">
                Your Name
              </label>
              <select
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (backup === e.target.value) setBackup('');
                }}
                className={`${inputClasses} appearance-none cursor-pointer`}
              >
                <option value="" disabled>
                  Select your name
                </option>
                {TEAM.map((m) => (
                  <option key={m.slackId} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Request Type */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-widest text-white/40 mb-3">
                Request Type
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`px-3 py-3 rounded-xl text-xs font-medium border transition-all duration-200 ${
                      type === t.value
                        ? 'bg-[#002fff]/10 border-[#002fff]/30 text-white shadow-[0_0_20px_rgba(0,47,255,0.1)]'
                        : 'bg-white/[0.02] border-white/[0.06] text-white/35 hover:text-white/60 hover:border-white/[0.12]'
                    }`}
                  >
                    <span className="block text-lg mb-1">{t.emoji}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-widest text-white/40 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  min={today}
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (endDate && endDate < e.target.value) setEndDate('');
                  }}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-widest text-white/40 mb-2">
                  End Date{' '}
                  <span className="text-white/15 normal-case tracking-normal">
                    (optional)
                  </span>
                </label>
                <input
                  type="date"
                  min={startDate || today}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inputClasses}
                />
              </div>
            </div>

            {/* Backup */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-widest text-white/40 mb-2">
                Who&apos;s Got Your Back?
              </label>
              <select
                required
                value={backup}
                onChange={(e) => setBackup(e.target.value)}
                className={`${inputClasses} appearance-none cursor-pointer`}
              >
                <option value="" disabled>
                  Select backup person
                </option>
                {backupOptions.map((m) => (
                  <option key={m.slackId} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-widest text-white/40 mb-2">
                Notes{' '}
                <span className="text-white/15 normal-case tracking-normal">
                  (optional)
                </span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Anything the team should know..."
                className={`${inputClasses} resize-none placeholder:text-white/15`}
              />
            </div>

            {/* Error */}
            {errorMsg && (
              <div className="text-red-400/80 text-sm text-center bg-red-400/[0.06] border border-red-400/10 rounded-xl px-4 py-3">
                {errorMsg}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full py-3.5 rounded-xl bg-[#002fff] text-white text-sm font-semibold transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,47,255,0.35)] hover:bg-[#0035ff] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
            >
              {status === 'submitting' ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit Request'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-white/10 text-xs mt-8 animate-slide-up-delay">
          Powered by GrowthTrigger
        </p>
      </div>
    </main>
  );
}
