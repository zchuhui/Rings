'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Ring } from '@/components/Ring';
import { todayStr } from '@/lib/dates';
import { countGrooves, type Adjustment } from '@/lib/engine';
import { ADJ_KEY } from '@/lib/store';
import { useAppState } from '@/lib/useAppState';

const COLOR_WORDS: Record<number, string> = {
  1: '沙色：今天状态偏低，能做到已经很好',
  2: '琥珀色：状态一般，但你还是来了',
  3: '橄榄色：状态平稳',
  4: '叶绿色：今天状态不错',
  5: '深林绿：今天状态很好',
};

export default function DonePage() {
  const state = useAppState();
  const router = useRouter();
  const [adj, setAdj] = useState<Adjustment | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(ADJ_KEY);
      if (raw) setAdj(JSON.parse(raw) as Adjustment);
    } catch {
      // 没有暂存就不显示调整
    }
  }, []);

  useEffect(() => {
    if (state && !state.plan) router.replace('/onboarding');
  }, [state, router]);

  if (!state || !state.plan) return null;

  const today = todayStr();
  const entry = state.entries.find((e) => e.date === today);
  if (!entry) {
    return (
      <div className="narrow">
        <p>今天还没有回顾。</p>
        <Link href="/checkin" className="btn block">去回顾</Link>
      </div>
    );
  }

  const n = countGrooves(state.entries);
  const skipped = entry.outcome === 'skipped';

  return (
    <div className="narrow" style={{ gap: 18 }}>
      <div style={{ maxWidth: 360, width: '100%', margin: '0 auto' }}>
        <Ring entries={state.entries} startDate={state.plan.startDate} today={today} highlightDate={today}>
          <p className="ring-count">{n}</p>
          <p className="ring-sub">道纹</p>
        </Ring>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 className="serif" style={{ fontSize: 30, lineHeight: 1.35 }}>
          {skipped ? (
            <>记下了，<br />这也是有用的数据。</>
          ) : (
            <>第 {n} 道纹，<br />长好了。</>
          )}
        </h1>
        <p className="muted">
          {skipped
            ? `没做不清零，年轮仍是 ${n} 道。`
            : entry.energy
              ? `这一道是${COLOR_WORDS[entry.energy]}。`
              : '没有记录状态，这一道用了平稳的橄榄色。'}
        </p>
      </div>

      {adj && (
        <div className="note">
          <p className="kicker">系统调整</p>
          <p style={{ fontWeight: 600, fontSize: 17 }}>{adj.title}</p>
          {adj.body && <p className="muted" style={{ fontSize: 14 }}>{adj.body}</p>}
        </div>
      )}

      {entry.note && (
        <p className="serif" style={{ fontWeight: 500, fontSize: 16, lineHeight: 1.7, color: 'var(--ink-2)' }}>
          “{entry.note}”
        </p>
      )}

      <Link href="/" className="btn block">
        明早见
      </Link>
    </div>
  );
}
