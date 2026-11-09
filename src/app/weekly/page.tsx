'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { CoachReview } from '@/components/CoachReview';
import { addDays, shortLabel, todayStr } from '@/lib/dates';
import { ENERGY_COLORS } from '@/lib/ring';
import type { Entry } from '@/lib/types';
import { useAppState } from '@/lib/useAppState';

const OUTCOME_WORDS: Record<Entry['outcome'], string> = { done: '做了', partial: '做了一部分', skipped: '没做' };
const FEEL_WORDS = { easy: '太轻松', right: '刚好', hard: '太难' } as const;
const REASON_WORDS = { hard: '太难', forgot: '忘了', tired: '没精力', noscene: '情境没出现', other: '其他' } as const;

export default function WeeklyPage() {
  const state = useAppState();
  const router = useRouter();

  useEffect(() => {
    if (state && !state.plan) router.replace('/onboarding');
  }, [state, router]);

  if (!state || !state.plan) return null;

  const today = todayStr();
  const from = addDays(today, -6);
  const week = state.entries.filter((e) => e.date >= from && e.date <= today).sort((a, b) => b.date.localeCompare(a.date));
  const grown = week.filter((e) => e.outcome !== 'skipped').length;
  const right = week.filter((e) => e.feel === 'right').length;

  return (
    <div className="narrow">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p className="kicker">最近 7 天</p>
        <h1 className="serif" style={{ fontSize: 28 }}>这一周，长了 {grown} 道纹。</h1>
        <p className="muted" style={{ fontSize: 14 }}>其中 {right} 天难度刚好，正待在学习区。</p>
      </div>

      <div className="list">
        {week.length === 0 && <div className="muted">这周还没有记录。</div>}
        {week.map((e) => (
          <div key={e.date} style={{ alignItems: 'flex-start', padding: '12px 0' }}>
            <span style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <i
                aria-hidden="true"
                style={{
                  marginTop: 7,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  flex: '0 0 10px',
                  background: e.outcome === 'skipped' ? '#B5AD9C' : ENERGY_COLORS[e.energy ?? 3],
                }}
              />
              <span>
                <span style={{ display: 'block' }}>{e.note || <span className="muted">（没有写记录）</span>}</span>
                <span className="muted" style={{ fontSize: 12 }}>
                  L{e.level} · {OUTCOME_WORDS[e.outcome]}
                  {e.feel ? ` · ${FEEL_WORDS[e.feel]}` : ''}
                  {e.reason ? ` · ${REASON_WORDS[e.reason]}` : ''}
                </span>
              </span>
            </span>
            <span className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{shortLabel(e.date)}</span>
          </div>
        ))}
      </div>

      <CoachReview week={week} today={today} />
    </div>
  );
}
