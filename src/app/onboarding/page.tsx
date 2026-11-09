'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { GrowthArt, LadderArt, SystemArt } from '@/components/Illustrations';
import { LogoMark } from '@/components/Logo';
import { postJSON } from '@/lib/api';
import { CRISIS_REPLY, type PlanDraft } from '@/lib/coach';
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
  const [description, setDescription] = useState('');
  const [aiOpen, setAiOpen] = useState(false);
  const [busy, setBusy] = useState<'draft' | 'ladder' | null>(null);
  const [aiMsg, setAiMsg] = useState('');
  const [crisis, setCrisis] = useState(false);

  // 第一次进来，先看成长理论
  useEffect(() => {
    if (state && !state.plan && !state.origin) router.replace('/welcome');
  }, [state, router]);

  // 带上起步时说过的那句困扰，直接用它来收敛主题
  const struggle = state?.origin?.struggle ?? '';
  useEffect(() => {
    if (struggle && !state?.plan) {
      setDescription(struggle);
      setAiOpen(true);
    }
  }, [struggle]); // eslint-disable-line react-hooks/exhaustive-deps

  // 修改主题时带出现有内容
  useEffect(() => {
    if (state?.plan) {
      const { startDate: _s, level: _l, ...rest } = state.plan;
      setD(rest);
    }
  }, [state?.plan?.startDate]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!state || (!state.plan && !state.origin)) return null;

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

  // AI 把一段描述收敛成主题和执行系统（PRD F1、F2），结果只是草稿，用户可以逐项修改
  const askDraft = async () => {
    setBusy('draft');
    setAiMsg('');
    try {
      const r = await postJSON<{ draft?: PlanDraft; crisis?: boolean }>('/api/plan-draft', { mode: 'full', description });
      if (r.crisis) {
        setCrisis(true);
        return;
      }
      if (r.draft) {
        setD(r.draft);
        setAiMsg('已经帮你起了个草稿，每一项都可以改。');
      }
    } catch (e) {
      setAiMsg((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const askLadder = async () => {
    setBusy('ladder');
    setAiMsg('');
    try {
      const r = await postJSON<{ ladder: Draft['ladder'] }>('/api/plan-draft', {
        mode: 'ladder',
        theme: d.theme,
        trigger: d.trigger,
        first: d.ladder[0],
      });
      setD((x) => ({ ...x, ladder: [x.ladder[0].trim() || r.ladder[0], ...r.ladder.slice(1)] as Draft['ladder'] }));
    } catch (e) {
      setAiMsg((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  if (crisis) {
    return (
      <div className="narrow">
        <h1 className="serif" style={{ fontSize: 26, lineHeight: 1.4 }}>先照顾好自己。</h1>
        <p style={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>{CRISIS_REPLY}</p>
        <button type="button" className="btn ghost block" onClick={() => setCrisis(false)}>返回</button>
      </div>
    );
  }

  const demo = () => {
    seedDemo();
    router.replace('/');
  };

  return (
    <div className="page">
      <div className="split wide-right">
        {/* PC 上左边是一张跟着输入实时变化的图 */}
        <aside className="desk-only sticky panel" aria-hidden="true">
          {step === 0 && <GrowthArt struggle={struggle || d.theme} />}
          {step === 1 && <SystemArt trigger={d.trigger} first={d.ladder[0]} environment={d.environment} />}
          {step === 2 && <LadderArt ladder={d.ladder} level={1} />}
        </aside>
        <div className="stack">
          <div className="steps" aria-label={`第 ${step + 1} 步，共 3 步`}>
            {[0, 1, 2].map((i) => (
              <span key={i} className={i <= step ? 'on' : undefined} />
            ))}
          </div>

          {step === 0 && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {!editing && !struggle && <LogoMark size={56} />}
                <p className="kicker">第 1 步 · 定方向</p>
                {!editing && struggle && (
                  <p className="serif" style={{ fontWeight: 500, fontSize: 16, lineHeight: 1.7, color: 'var(--ink-2)' }}>
                    你说：「{struggle}」
                  </p>
                )}
                <h1 className="serif" style={{ fontSize: 28, lineHeight: 1.35 }}>
                  接下来 90 天，<br />只练一件事。
                </h1>
                <p className="muted" style={{ fontSize: 14 }}>
                  {struggle && !editing
                    ? '把它收敛成一个看得见、做得到的行为。这是学习区原理：太大的目标会把你推进恐慌区。'
                    : '选一个看得见、做得到的行为。“提升沟通能力”太大，“在会议上说出自己的观点”刚好。'}
                </p>
              </div>
              <div className="note">
                {aiOpen ? (
                  <>
                    <label htmlFor="desc" className="kicker">{struggle ? '你说的那件事，可以再补充几句' : '说说最近最想突破、或者最困扰你的事'}</label>
                    <textarea
                      id="desc"
                      className="textarea"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="比如：开会时总是不敢说话，明明有想法，散会后又后悔"
                    />
                    <button type="button" className="btn block" style={{ minHeight: 46, marginTop: 6 }} disabled={busy !== null || description.trim().length < 4} onClick={askDraft}>
                      {busy === 'draft' ? '正在收敛成一件事…' : d.theme ? 'AI 重新收敛一次' : 'AI 帮我收敛成一件事'}
                    </button>
                  </>
                ) : (
                  <button type="button" className="linkbtn" onClick={() => setAiOpen(true)}>
                    不知道怎么写？说说你的困扰，让 AI 帮你起个草稿 →
                  </button>
                )}
                {aiMsg && step === 0 && <p className="muted" style={{ fontSize: 13 }}>{aiMsg}</p>}
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
              <button type="button" className="btn ghost block" style={{ minHeight: 46 }} disabled={busy !== null || !d.theme.trim()} onClick={askLadder}>
                {busy === 'ladder' ? '正在生成…' : d.ladder.slice(1).some((x) => x.trim()) ? '让 AI 重新生成 L2–L5' : '让 AI 帮我生成阶梯'}
              </button>
              {aiMsg && step === 2 && <p className="muted" style={{ fontSize: 13 }}>{aiMsg}</p>}
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
      </div>
    </div>
  );
}
