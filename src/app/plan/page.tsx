'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { resetAll } from '@/lib/store';
import { STAGES, type Level } from '@/lib/types';
import { useAppState } from '@/lib/useAppState';

export default function PlanPage() {
  const state = useAppState();
  const router = useRouter();

  useEffect(() => {
    if (state && !state.plan) router.replace('/onboarding');
  }, [state, router]);

  if (!state || !state.plan) return null;
  const { plan } = state;

  const reset = () => {
    if (window.confirm('清除这台设备上的全部记录，重新开始？')) {
      resetAll();
      router.replace('/onboarding');
    }
  };

  return (
    <div className="narrow">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p className="kicker">我的 90 天主题</p>
        <h1 className="serif" style={{ fontSize: 28 }}>{plan.theme}</h1>
        <p className="serif" style={{ fontWeight: 500, fontSize: 17, color: 'var(--ink-2)' }}>“{plan.identity.replace(/[。.]$/, '')}。”</p>
      </div>

      <div className="list">
        <div><span className="muted">触发情境</span><span style={{ textAlign: 'right' }}>{plan.trigger}</span></div>
        <div><span className="muted">环境调整</span><span style={{ textAlign: 'right' }}>{plan.environment || '—'}</span></div>
      </div>

      <div className="field">
        <p className="label">难度阶梯 · 系统会根据你的反馈自动升降</p>
        <div className="ladder">
          {plan.ladder.map((text, i) => {
            const lv = (i + 1) as Level;
            return (
              <div key={lv} className={lv === plan.level ? 'on' : undefined}>
                <b>L{lv}</b>
                <span style={{ flex: 1 }}>{text}</span>
                <span className="muted" style={{ fontSize: 12 }}>{STAGES[lv]}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        <Link href="/onboarding" className="btn ghost block">修改主题和阶梯</Link>
        <button type="button" onClick={reset} style={{ minHeight: 44, border: 0, background: 'none', color: 'var(--muted)', fontSize: 13, textDecoration: 'underline', cursor: 'pointer' }}>
          清除本地数据，重新开始
        </button>
      </div>
    </div>
  );
}
