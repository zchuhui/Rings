'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { todayStr } from '@/lib/dates';
import { todayChallenge } from '@/lib/engine';
import { ENERGY_COLORS } from '@/lib/ring';
import { ADJ_KEY, saveEntry } from '@/lib/store';
import type { Energy, Feel, Outcome, SkipReason } from '@/lib/types';
import { useAppState } from '@/lib/useAppState';

const OUTCOMES: Array<[Outcome, string]> = [
  ['done', '做了'],
  ['partial', '做了一部分'],
  ['skipped', '没做'],
];
const FEELS: Array<[Feel, string]> = [
  ['easy', '太轻松'],
  ['right', '刚好'],
  ['hard', '太难'],
];
const REASONS: Array<[SkipReason, string]> = [
  ['hard', '太难'],
  ['forgot', '忘了'],
  ['tired', '没精力'],
  ['noscene', '情境没出现'],
  ['other', '其他'],
];

export default function CheckinPage() {
  const state = useAppState();
  const router = useRouter();
  const today = todayStr();
  const existing = state?.entries.find((e) => e.date === today);

  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [feel, setFeel] = useState<Feel | null>(null);
  const [reason, setReason] = useState<SkipReason | null>(null);
  const [note, setNote] = useState('');
  const [energy, setEnergy] = useState<Energy | null>(null);

  // 修改回顾时带出已有内容
  useEffect(() => {
    if (!existing) return;
    setOutcome(existing.outcome);
    setFeel(existing.feel ?? null);
    setReason(existing.reason ?? null);
    setNote(existing.note);
    setEnergy(existing.energy ?? null);
  }, [existing?.date]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (state && !state.plan) router.replace('/onboarding');
  }, [state, router]);

  if (!state || !state.plan) return null;

  const t = todayChallenge(state.plan, state.entries, today);
  const skipped = outcome === 'skipped';
  const ready = !!outcome && (skipped ? !!reason : !!feel);

  const submit = () => {
    if (!outcome || !ready) return;
    const adj = saveEntry({
      date: today,
      level: existing?.level ?? t.level,
      outcome,
      feel: skipped ? undefined : feel ?? undefined,
      reason: skipped ? reason ?? undefined : undefined,
      note: note.trim(),
      energy: energy ?? undefined,
    });
    try {
      sessionStorage.setItem(ADJ_KEY, JSON.stringify(adj));
    } catch {
      // 结果页会退回到通用文案
    }
    router.push('/checkin/done');
  };

  return (
    <div className="narrow">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p className="kicker">晚间回顾 · 30 秒</p>
          <h1 className="serif" style={{ fontSize: 26, marginTop: 4 }}>
            {t.text}
          </h1>
        </div>
        <Link href="/" aria-label="关闭" style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, textDecoration: 'none' }}>
          ×
        </Link>
      </div>

      <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="field">
        <legend className="label" style={{ marginBottom: 8 }}>今天做了吗？</legend>
        <div className="choices">
          {OUTCOMES.map(([k, label]) => (
            <button key={k} type="button" className="choice" aria-pressed={outcome === k} onClick={() => setOutcome(k)}>
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      {outcome && !skipped && (
        <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="field">
          <legend className="label" style={{ marginBottom: 8 }}>难度感觉如何？</legend>
          <div className="choices">
            {FEELS.map(([k, label]) => (
              <button key={k} type="button" className="choice" aria-pressed={feel === k} onClick={() => setFeel(k)}>
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {skipped && (
        <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="field">
          <legend className="label" style={{ marginBottom: 8 }}>是什么原因？选一个就好，它只用来调整系统。</legend>
          <div className="choices wrap">
            {REASONS.map(([k, label]) => (
              <button key={k} type="button" className="choice" aria-pressed={reason === k} onClick={() => setReason(k)}>
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="field">
        <label htmlFor="note">一句话记下发生了什么</label>
        <textarea
          id="note"
          className="textarea"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="比如：周会上问了上线时间，同事补充了很多细节"
        />
      </div>

      <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="field">
        <legend className="label" style={{ marginBottom: 8 }}>今天状态？它决定这一道的颜色（可跳过）</legend>
        <div className="energy-pick" role="group">
          {([1, 2, 3, 4, 5] as Energy[]).map((k) => (
            <button
              key={k}
              type="button"
              aria-label={`状态 ${k}`}
              aria-pressed={energy === k}
              onClick={() => setEnergy(energy === k ? null : k)}
            >
              <span style={{ background: ENERGY_COLORS[k] }} />
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }} className="muted">
          <span>低</span>
          <span>高</span>
        </div>
      </fieldset>

      <button type="button" className="btn block" disabled={!ready} onClick={submit}>
        {skipped ? '记下来' : '刻下这一道'}
      </button>
    </div>
  );
}
