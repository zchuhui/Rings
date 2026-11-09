'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogoMark } from '@/components/Logo';
import { todayStr } from '@/lib/dates';
import { savePlan, seedDemo } from '@/lib/store';
import type { Plan } from '@/lib/types';
import { useAppState } from '@/lib/useAppState';

type Draft = Omit<Plan, 'startDate' | 'level'>;

const EMPTY: Draft = {
  theme: '',
  identity: '',
  trigger: '',
  environment: '',
  ladder: ['', '', '', '', ''],
};

const EXAMPLE: Draft = {
  theme: '在会议上说出自己的观点',
  identity: '我是一个会说出自己想法的人。',
  trigger: '会议开始后的前 10 分钟内',
  environment: '会前写一个要点，放在笔记本第一页',
  ladder: ['会议中说一句话', '在会议上提一个问题', '表达一个完整的观点', '补充或提出不同意见', '主持一个议题的讨论'],
};

const LEVEL_HINTS = ['最小的一步，2 分钟内能做完', '稍微难一点', '需要伸手才够得着', '更有挑战', '这个主题的“毕业”状态'];

export default function OnboardingPage() {
  const state = useAppState();
  const router = useRouter();
  const editing = !!state?.plan;
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>(EMPTY);

  // 修改主题时带出现有内容
  useEffect(() => {
    if (state?.plan) {
      const { startDate: _s, level: _l, ...rest } = state.plan;
      setD(rest);
    }
  }, [state?.plan?.startDate]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!state) return null;

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const setLevel = (i: number, v: string) =>
    setD((x) => {
      const ladder = [...x.ladder] as Draft['ladder'];
      ladder[i] = v;
      return { ...x, ladder };
    });

  const valid = [
    !!d.theme.trim() && !!d.identity.trim(),
    !!d.ladder[0].trim() && !!d.trigger.trim(),
    d.ladder.every((s) => !!s.trim()),
  ];

  const finish = () => {
    const prev = state.plan;
    savePlan({
      ...d,
      theme: d.theme.trim(),
      identity: d.identity.trim(),
      trigger: d.trigger.trim(),
      environment: d.environment.trim(),
      ladder: d.ladder.map((s) => s.trim()) as Draft['ladder'],
      startDate: prev?.startDate ?? todayStr(),
      level: prev?.level ?? 1,
    });
    router.replace('/');
  };

  const demo = () => {
    seedDemo();
    router.replace('/');
  };

  return (
    <div className="narrow">
      <div className="steps" aria-label={`第 ${step + 1} 步，共 3 步`}>
        {[0, 1, 2].map((i) => (
          <span key={i} className={i <= step ? 'on' : undefined} />
        ))}
      </div>

      {step === 0 && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {!editing && <LogoMark size={56} />}
            <p className="kicker">第 1 步 · 定方向</p>
            <h1 className="serif" style={{ fontSize: 28, lineHeight: 1.35 }}>
              接下来 90 天，<br />只练一件事。
            </h1>
            <p className="muted" style={{ fontSize: 14 }}>
              选一个看得见、做得到的行为。“提升沟通能力”太大，“在会议上说出自己的观点”刚好。
            </p>
          </div>
          <div className="field">
            <label htmlFor="theme">我想练的是</label>
            <input id="theme" className="input" value={d.theme} onChange={(e) => set('theme', e.target.value)} placeholder="在会议上说出自己的观点" />
          </div>
          <div className="field">
            <label htmlFor="identity">把它写成一句身份宣言</label>
            <input id="identity" className="input" value={d.identity} onChange={(e) => set('identity', e.target.value)} placeholder="我是一个会说出自己想法的人。" />
          </div>
          <button type="button" className="btn block" disabled={!valid[0]} onClick={() => setStep(1)}>下一步</button>
          {!editing && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontSize: 13 }}>
              <button type="button" onClick={() => setD(EXAMPLE)} style={{ border: 0, background: 'none', minHeight: 44, cursor: 'pointer', textDecoration: 'underline' }}>
                用示例填写
              </button>
              <button type="button" onClick={demo} style={{ border: 0, background: 'none', minHeight: 44, cursor: 'pointer', textDecoration: 'underline', color: 'var(--muted)' }}>
                先看看练了 20 天的样子
              </button>
            </div>
          )}
        </>
      )}

      {step === 1 && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p className="kicker">第 2 步 · 搭系统</p>
            <h1 className="serif" style={{ fontSize: 28, lineHeight: 1.35 }}>不靠意志力，<br />靠一个小系统。</h1>
          </div>
          <div className="field">
            <label htmlFor="l1">最小行为：2 分钟内能做完的一步</label>
            <input id="l1" className="input" value={d.ladder[0]} onChange={(e) => setLevel(0, e.target.value)} placeholder="会议中说一句话" />
          </div>
          <div className="field">
            <label htmlFor="trigger">触发情境：在什么时候做</label>
            <input id="trigger" className="input" value={d.trigger} onChange={(e) => set('trigger', e.target.value)} placeholder="会议开始后的前 10 分钟内" />
          </div>
          <div className="field">
            <label htmlFor="env">环境调整：让它更容易发生（可选）</label>
            <input id="env" className="input" value={d.environment} onChange={(e) => set('environment', e.target.value)} placeholder="会前写一个要点，放在笔记本第一页" />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn ghost" onClick={() => setStep(0)}>上一步</button>
            <button type="button" className="btn" style={{ flex: 1 }} disabled={!valid[1]} onClick={() => setStep(2)}>下一步</button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p className="kicker">第 3 步 · 难度阶梯</p>
            <h1 className="serif" style={{ fontSize: 28, lineHeight: 1.35 }}>从种子到成林，<br />一共五级。</h1>
            <p className="muted" style={{ fontSize: 14 }}>你从 L1 开始。系统会根据每天的反馈自动升降，让挑战始终比你现在的能力难一点点。</p>
          </div>
          {d.ladder.map((v, i) => (
            <div className="field" key={i}>
              <label htmlFor={`lv${i}`}>L{i + 1} · {LEVEL_HINTS[i]}</label>
              <input id={`lv${i}`} className="input" value={v} onChange={(e) => setLevel(i, e.target.value)} placeholder={EXAMPLE.ladder[i]} />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn ghost" onClick={() => setStep(1)}>上一步</button>
            <button type="button" className="btn" style={{ flex: 1 }} disabled={!valid[2]} onClick={finish}>
              {editing ? '保存' : '开始第一天'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
