'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Ring, RingLegend } from '@/components/Ring';
import { daysBetween, todayStr } from '@/lib/dates';
import { countGrooves } from '@/lib/engine';
import { STAGES, THEME_DAYS } from '@/lib/types';
import { useAppState } from '@/lib/useAppState';

export default function RingsPage() {
  const state = useAppState();
  const router = useRouter();

  useEffect(() => {
    if (state && !state.plan) router.replace('/onboarding');
  }, [state, router]);

  if (!state || !state.plan) return null;

  const { plan, entries } = state;
  const today = todayStr();
  const day = Math.min(daysBetween(plan.startDate, today) + 1, THEME_DAYS);

  return (
    <div className="page">
      <div className="split wide-left" style={{ alignItems: 'center' }}>
        <div style={{ maxWidth: 560, width: '100%', margin: '0 auto' }}>
          <Ring entries={entries} startDate={plan.startDate} today={today} showOuter>
            <p className="ring-count">{countGrooves(entries)}</p>
            <p className="ring-sub">道纹</p>
          </Ring>
        </div>

        <div className="stack">
          <div className="page-head">
            <p className="kicker">第一圈 · {plan.theme}</p>
            <h1 className="page-title">你的年轮，独一无二。</h1>
            <p className="muted">每一道纹都是你走过的一天。第 90 天，它会长成只属于你的图案。</p>
          </div>

          <RingLegend />

          <div className="stats">
            <div>
              <p className="num">{day}</p>
              <p>天 / 90</p>
            </div>
            <div>
              <p className="serif" style={{ fontSize: 22, lineHeight: 1.2, color: 'var(--forest)' }}>{STAGES[plan.level]}</p>
              <p>生长阶段 L{plan.level}</p>
            </div>
            <div>
              <p className="num">{entries.filter((e) => e.note).length}</p>
              <p>条记录</p>
            </div>
          </div>

          <button type="button" className="btn ghost block" disabled title="下一版开放">
            生成年轮海报 · 即将开放
          </button>
        </div>
      </div>
    </div>
  );
}
