'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { LogoMark } from '@/components/Logo';
import { LoopDiagram, ZoneDiagram } from '@/components/TheoryDiagrams';
import { postJSON } from '@/lib/api';
import { CRISIS_REPLY, hasCrisisSignal } from '@/lib/coach';
import { todayStr } from '@/lib/dates';
import { ENERGY_COLORS } from '@/lib/ring';
import { saveOrigin, seedDemo } from '@/lib/store';
import {
  echoEnergy,
  echoPersistence,
  echoRatings,
  echoSelfTalk,
  echoStruggle,
  echoStuck,
  LAYERS,
  originLines,
  PERSISTENCE,
  principle,
  SELF_TALK,
  STUCK,
  THEORY_SUMMARY,
  type PrincipleId,
} from '@/lib/theory';
import type { Energy, Origin } from '@/lib/types';
import { useAppState } from '@/lib/useAppState';

const LAST = 7;

/**
 * 第一次进来：先讲清楚成长是怎么发生的，再定主题。
 * 每讲一条原理，问一个关于你自己的问题，并马上用你的话回应你。
 */
export default function WelcomePage() {
  const state = useAppState();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [o, setO] = useState<Origin>({ date: todayStr(), struggle: '' });
  const [struggleDone, setStruggleDone] = useState(false);
  const [reflection, setReflection] = useState<{ text: string; crisis?: boolean } | null>(null);
  const [reflecting, setReflecting] = useState(false);

  // 已经有主题的人，回看理论去理论页；本页自己跳走（看示例）时不拦
  const leaving = useRef(false);
  useEffect(() => {
    if (state?.plan && !leaving.current) router.replace('/theory');
  }, [state?.plan, router]);

  // 走到最后一页时，请教练读一遍全部回答
  useEffect(() => {
    if (step !== LAST || reflection || reflecting) return;
    setReflecting(true);
    postJSON<{ text: string; crisis?: boolean }>('/api/reflect', { kind: 'origin', origin: o })
      .then(setReflection)
      .catch(() => setReflection({ text: '' }))
      .finally(() => setReflecting(false));
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!state || state.plan) return null;

  const set = (patch: Partial<Origin>) => setO((x) => ({ ...x, ...patch }));
  const next = () => {
    setStep((s) => Math.min(LAST, s + 1));
    window.scrollTo({ top: 0 });
  };
  const back = () => {
    // 回去改了答案，教练要重新读
    if (step === LAST) setReflection(null);
    setStep((s) => Math.max(0, s - 1));
  };

  const finish = (origin: Origin) => {
    saveOrigin(origin);
    router.push('/onboarding');
  };

  const skip = () => finish({ date: todayStr(), struggle: '' });

  const ratings = o.ratings ?? {};
  const crisis = hasCrisisSignal(o.struggle);

  return (
    <div className="narrow welcome">
      {step > 0 && (
        <div className="steps" aria-label={`第 ${step} 页，共 ${LAST} 页`}>
          {Array.from({ length: LAST }, (_, i) => (
            <span key={i} className={i < step ? 'on' : undefined} />
          ))}
        </div>
      )}

      {step === 0 && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <LogoMark size={56} />
            <h1 className="serif" style={{ fontSize: 30, lineHeight: 1.4 }}>
              在开始之前，
              <br />
              我想先认识你。
            </h1>
            <p style={{ color: 'var(--ink-2)', lineHeight: 1.8 }}>
              这里不会一上来就让你填目标。接下来几页，会用 3 分钟讲清楚成长到底是怎么发生的。每一页，我会问你一个关于你自己的小问题。
            </p>
            <p className="muted" style={{ fontSize: 14 }}>
              你说的每一句话，我都会记着。它们会在之后的 90 天里，一次次回到你面前。
            </p>
          </div>
          <button type="button" className="btn block" onClick={next}>开始</button>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontSize: 13 }}>
            <button type="button" className="linkbtn quiet" onClick={skip}>我已经了解，直接开始</button>
            <button
              type="button"
              className="linkbtn quiet"
              onClick={() => {
                leaving.current = true;
                seedDemo();
                router.replace('/');
              }}
            >
              先看看练了 20 天的样子
            </button>
          </div>
        </>
      )}

      {step === 1 && (
        <Lesson id="growth" n={1}>
          <div className="field">
            <label htmlFor="struggle" className="label">最近有哪件事，让你觉得有点搞不定？</label>
            <textarea
              id="struggle"
              className="textarea"
              rows={3}
              value={o.struggle}
              onChange={(e) => {
                set({ struggle: e.target.value });
                setStruggleDone(false);
              }}
              placeholder="比如：开会时总是不敢说话，明明有想法，散会后又后悔"
            />
          </div>
          {!struggleDone ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn ghost" onClick={back}>上一步</button>
              <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setStruggleDone(true)}>
                {o.struggle.trim() ? '说出来了' : '暂时说不上来'}
              </button>
            </div>
          ) : (
            <>
              {crisis ? <Echo label="先停一下">{CRISIS_REPLY}</Echo> : <Echo>{echoStruggle(o.struggle)}</Echo>}
              <Nav onBack={back} onNext={next} />
            </>
          )}
        </Lesson>
      )}

      {step === 2 && (
        <Lesson id="growth" n={2} titleOverride="应对能力有三层：认知、能力、心性。" hideBody>
          <p style={{ color: 'var(--ink-2)', lineHeight: 1.8, fontSize: 15 }}>
            认知高而能力弱，会眼高手低；能力强而心性弱，一遇挫折就崩。凭感觉给自己现在的三层打个分，没有对错。
          </p>
          {LAYERS.map((l) => (
            <fieldset key={l.key} className="field" style={{ border: 0, padding: 0, margin: 0 }}>
              <legend className="label" style={{ marginBottom: 8 }}>
                <b style={{ color: 'var(--ink)' }}>{l.name}</b> · {l.hint}
              </legend>
              <div className="choices">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="choice"
                    aria-pressed={ratings[l.key] === n}
                    onClick={() => set({ ratings: { ...ratings, [l.key]: n } })}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
          {echoRatings(ratings) && <Echo>{echoRatings(ratings)}</Echo>}
          <Nav onBack={back} onNext={next} disabled={!echoRatings(ratings)} />
        </Lesson>
      )}

      {step === 3 && (
        <Lesson id="loop" n={3} figure={<LoopDiagram />}>
          <Choices
            question="以前想改变的时候，你最常卡在哪一步？"
            options={STUCK}
            value={o.stuck}
            onChange={(stuck) => set({ stuck })}
          />
          {o.stuck && <Echo>{echoStuck(o.stuck)}</Echo>}
          <Nav onBack={back} onNext={next} disabled={!o.stuck} />
        </Lesson>
      )}

      {step === 4 && (
        <Lesson id="zone" n={4} figure={<ZoneDiagram />} extra={principle('system')}>
          <Choices
            question="过去立下的目标，你通常能坚持多久？"
            options={PERSISTENCE}
            value={o.persistence}
            onChange={(persistence) => set({ persistence })}
          />
          {o.persistence && <Echo>{echoPersistence(o.persistence)}</Echo>}
          <Nav onBack={back} onNext={next} disabled={!o.persistence} />
        </Lesson>
      )}

      {step === 5 && (
        <Lesson id="energy" n={5} extra={principle('environment')}>
          <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="label" style={{ marginBottom: 8 }}>最近一周，你的状态怎么样？睡眠、情绪、专注放在一起感受一下。</legend>
            <div className="energy-pick" role="group">
              {([1, 2, 3, 4, 5] as Energy[]).map((k) => (
                <button key={k} type="button" aria-label={`状态 ${k}`} aria-pressed={o.energy === k} onClick={() => set({ energy: k })}>
                  <span style={{ background: ENERGY_COLORS[k] }} />
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }} className="muted">
              <span>很低</span>
              <span>很好</span>
            </div>
          </fieldset>
          {o.energy && <Echo>{echoEnergy(o.energy)}</Echo>}
          <Nav onBack={back} onNext={next} disabled={!o.energy} />
        </Lesson>
      )}

      {step === 6 && (
        <Lesson id="mind" n={6}>
          <Choices
            question="一件事没做到的时候，你心里通常会对自己说什么？"
            options={SELF_TALK}
            value={o.selfTalk}
            onChange={(selfTalk) => set({ selfTalk })}
            column
          />
          {o.selfTalk && <Echo>{echoSelfTalk(o.selfTalk)}</Echo>}
          <Nav onBack={back} onNext={next} disabled={!o.selfTalk} nextLabel="看看我听到了什么" />
        </Lesson>
      )}

      {step === LAST && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p className="kicker">我听到的你</p>
            <h1 className="serif" style={{ fontSize: 28, lineHeight: 1.4 }}>这是你刚才告诉我的。</h1>
          </div>
          <div className="list">
            {originLines(o).map((l) => (
              <div key={l.q} style={{ alignItems: 'flex-start', padding: '12px 0' }}>
                <span className="muted" style={{ flex: '0 0 auto' }}>{l.q}</span>
                <span style={{ textAlign: 'right' }}>{l.a}</span>
              </div>
            ))}
          </div>

          {(reflecting || reflection?.text) && (
            <Echo label={reflection?.crisis ? '先停一下' : '教练读完你的回答'}>
              {reflecting ? <span className="pending">正在读你的回答…</span> : reflection?.text}
            </Echo>
          )}

          <div className="note">
            <p className="kicker">把这些串起来，就是一句话</p>
            <p className="serif" style={{ fontWeight: 500, fontSize: 16, lineHeight: 1.8 }}>{THEORY_SUMMARY}</p>
          </div>

          <p className="muted" style={{ fontSize: 14 }}>
            接下来，我们一起把「{o.struggle.trim() || '你想改变的那件事'}」收敛成 90 天里只练的一件事。
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn ghost" onClick={back}>上一步</button>
            <button
              type="button"
              className="btn"
              style={{ flex: 1 }}
              disabled={reflecting}
              onClick={() => finish({ ...o, struggle: o.struggle.trim(), reflection: reflection?.crisis ? undefined : reflection?.text || undefined })}
            >
              从这里出发
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Lesson({
  id,
  n,
  figure,
  extra,
  titleOverride,
  hideBody,
  children,
}: {
  id: PrincipleId;
  n: number;
  figure?: ReactNode;
  extra?: ReturnType<typeof principle>;
  titleOverride?: string;
  hideBody?: boolean;
  children: ReactNode;
}) {
  const p = principle(id);
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p className="kicker">成长的底层逻辑 · {n} / 6 · {p.name}{extra ? ` · ${extra.name}` : ''}</p>
        <h1 className="serif" style={{ fontSize: 26, lineHeight: 1.45 }}>{titleOverride ?? p.core}</h1>
        {figure}
        {!hideBody && <p style={{ color: 'var(--ink-2)', lineHeight: 1.8, fontSize: 15 }}>{p.body}</p>}
        {extra && (
          <p style={{ color: 'var(--ink-2)', lineHeight: 1.8, fontSize: 15 }}>
            <b>{extra.core}</b>
            {extra.body}
          </p>
        )}
      </div>
      <hr className="divider" />
      {children}
    </>
  );
}

function Choices<K extends string>({
  question,
  options,
  value,
  onChange,
  column,
}: {
  question: string;
  options: ReadonlyArray<{ key: K; label: string }>;
  value?: K;
  onChange: (k: K) => void;
  column?: boolean;
}) {
  return (
    <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
      <legend className="label" style={{ marginBottom: 8 }}>{question}</legend>
      <div className={column ? 'choices column' : 'choices wrap'}>
        {options.map((x) => (
          <button key={x.key} type="button" className="choice" aria-pressed={value === x.key} onClick={() => onChange(x.key)}>
            {x.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** 每一个回答之后的回应：用你的话，接住你 */
function Echo({ label = '我听到的', children }: { label?: string; children: ReactNode }) {
  return (
    <div className="echo" aria-live="polite">
      <p className="kicker">{label}</p>
      <p>{children}</p>
    </div>
  );
}

function Nav({ onBack, onNext, disabled, nextLabel = '继续' }: { onBack: () => void; onNext: () => void; disabled?: boolean; nextLabel?: string }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <button type="button" className="btn ghost" onClick={onBack}>上一步</button>
      <button type="button" className="btn" style={{ flex: 1 }} disabled={disabled} onClick={onNext}>{nextLabel}</button>
    </div>
  );
}
