'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { todayStr } from '@/lib/dates';
import { exportJSON, importJSON, resetAll, setLevel } from '@/lib/store';
import { STAGES, type Level } from '@/lib/types';
import { useAppState } from '@/lib/useAppState';

export default function PlanPage() {
  const state = useAppState();
  const router = useRouter();

  useEffect(() => {
    if (state && !state.plan) router.replace('/onboarding');
  }, [state, router]);

  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');

  if (!state || !state.plan) return null;
  const { plan } = state;

  const download = () => {
    const blob = new Blob([exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rings-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!window.confirm('用这个备份覆盖当前设备上的全部记录？')) return;
    setMsg(importJSON(await file.text()) ? '已经从备份恢复。' : '这个文件不是年轮的备份。');
    if (fileRef.current) fileRef.current.value = '';
  };

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

      <div className="field">
        <p className="label">觉得系统调得不对？可以手动调整，手动优先</p>
        <div className="levelctl">
          <button type="button" className="btn ghost" disabled={plan.level <= 1} onClick={() => setLevel((plan.level - 1) as Level)}>
            降到 L{Math.max(1, plan.level - 1)}
          </button>
          <button type="button" className="btn ghost" disabled={plan.level >= 5} onClick={() => setLevel((plan.level + 1) as Level)}>
            升到 L{Math.min(5, plan.level + 1)}
          </button>
        </div>
      </div>

      <div className="list">
        <Link href="/theory" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', minHeight: 50, alignItems: 'center', textDecoration: 'none' }}>
          <span>成长的底层逻辑</span>
          <span className="muted">回看七条原理 →</span>
        </Link>
      </div>
      <div className="list" style={{ marginTop: -22 }}>
        <Link href="/cards" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', minHeight: 50, alignItems: 'center', textDecoration: 'none' }}>
          <span>认知卡片</span>
          <span className="muted">{state.cards.length} 张 →</span>
        </Link>
      </div>

      <div className="field">
        <p className="label">数据只存在这台设备上。定期导出一份备份，换设备时再导入。</p>
        <div className="levelctl">
          <button type="button" className="btn ghost" onClick={download}>导出备份</button>
          <button type="button" className="btn ghost" onClick={() => fileRef.current?.click()}>从备份恢复</button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => upload(e.target.files?.[0])} />
        {msg && <p className="muted" style={{ fontSize: 13 }} role="status">{msg}</p>}
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
