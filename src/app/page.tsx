'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Ring, RingLegend } from '@/components/Ring';
import { daysBetween, todayStr } from '@/lib/dates';
import { countGrooves, todayChallenge } from '@/lib/engine';
import { useAppState } from '@/lib/useAppState';
import { STAGES, THEME_DAYS } from '@/lib/types';

export default function HomePage() {
  const state = useAppState();
  const router = useRouter();

  useEffect(() => {
    if (state && !state.plan) router.replace('/onboarding');
  }, [state, router]);

  if (!state || !state.plan) return null;

  const { plan, entries } = state;
  const today = todayStr();
  const t = todayChallenge(plan, entries, today);
  const done = entries.find((e) => e.date === today);
  const day = daysBetween(plan.startDate, today) + 1;
  const finished = day > THEME_DAYS;

  return (
    <div className="home">
      <section className="home-ring" aria-label="我的年轮">
        <Ring entries={entries} startDate={plan.startDate} today={today}>
          <p className="ring-count">{countGrooves(entries)}</p>
          <p className="ring-sub">道纹</p>
        </Ring>
        <div style={{ marginTop: 8 }}>
          <RingLegend withToday={!done} />
        </div>
      </section>

      <section className="home-main">
        <p className="kicker rule">
          第 {Math.min(day, THEME_DAYS)} 天 · {STAGES[t.level]} L{t.level}
        </p>

        {t.returning && (
          <p className="banner">欢迎回来，离开了 {t.daysAway} 天。年轮一道都没少，今天从最小的一步重新开始。</p>
        )}
        {t.recharging && <p className="banner">这几天状态偏低，今天只做最小的一步，先把底座修好。</p>}
        {finished && <p className="banner">第一圈已经长完了。下一版会在这里生成 90 天报告，并帮你选下一个主题。</p>}

        <h1 className="challenge">{t.text}</h1>
        <p className="muted">触发：{plan.trigger}</p>

        {done ? (
          <div className="note">
            <p className="kicker">今天这一道已经刻下</p>
            <p className="muted" style={{ fontSize: 14 }}>
              {done.note ? `“${done.note}”` : '明天见。'}
            </p>
            <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
              <Link href="/checkin/done" style={{ fontSize: 14, fontWeight: 600 }}>
                查看
              </Link>
              <Link href="/checkin" style={{ fontSize: 14, color: 'var(--muted)' }}>
                修改回顾
              </Link>
            </div>
          </div>
        ) : (
          <Link href="/checkin" className="btn block" style={{ marginTop: 6 }}>
            完成了，刻下今天这一道
          </Link>
        )}

        <Link href="/weekly" className="linkrow" style={{ marginTop: 6 }}>
          <span>
            本周复盘 <span className="muted">· 和 AI 教练聊聊这一周</span>
          </span>
          <span aria-hidden="true">→</span>
        </Link>
        {state.cards.length > 0 && (
          <Link href="/cards" className="linkrow" style={{ marginTop: -13, borderTop: 0 }}>
            <span>
              认知卡片 <span className="muted">· {state.cards.length} 张</span>
            </span>
            <span aria-hidden="true">→</span>
          </Link>
        )}

        <p className="serif" style={{ fontWeight: 500, fontSize: 17, marginTop: 6 }}>
          “{plan.identity.replace(/[。.]$/, '')}。”
        </p>
      </section>
    </div>
  );
}
