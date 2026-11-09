'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { postJSON } from '@/lib/api';
import { describeChange, type ReviewSummary } from '@/lib/coach';
import { addDays } from '@/lib/dates';
import { finishReview, getState, saveReviewMessages, startReview } from '@/lib/store';
import type { ChatMessage, Entry } from '@/lib/types';
import { useAppState } from '@/lib/useAppState';

/** 用户至少回答几轮之后，才能整理成卡片和调整 */
const MIN_TURNS = 2;

/**
 * 每周 AI 复盘（PRD F6）：教练提问 → 用户回答 → 整理出认知卡片和下周调整 → 用户确认后生效。
 */
export function CoachReview({ week, today }: { week: Entry[]; today: string }) {
  const state = useAppState();
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState<'chat' | 'summary' | null>(null);
  const [error, setError] = useState('');
  const [paused, setPaused] = useState(false);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [cardPicks, setCardPicks] = useState<boolean[]>([]);
  const [changePicks, setChangePicks] = useState<boolean[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  const review = state?.reviews
    .filter((r) => r.date >= addDays(today, -6))
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const messages = review?.messages ?? [];

  useEffect(() => {
    if (messages.length > 1) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, busy]);

  if (!state?.plan) return null;
  const plan = state.plan;

  const context = () => {
    const s = getState();
    const cards = [...s.cards].sort((a, b) => Number(b.pinned) - Number(a.pinned));
    return { plan: s.plan, week, cards };
  };

  const send = async (date: string, history: ChatMessage[]) => {
    setBusy('chat');
    setError('');
    try {
      const r = await postJSON<{ reply: string; crisis?: boolean }>('/api/coach', { ...context(), messages: history });
      saveReviewMessages(date, [...history, { role: 'assistant', content: r.reply }]);
      if (r.crisis) setPaused(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const begin = () => {
    const r = startReview(today);
    if (r.messages.length === 0) void send(r.date, []);
  };

  const reply = () => {
    const text = input.trim();
    if (!review || !text || busy) return;
    const history: ChatMessage[] = [...messages, { role: 'user', content: text }];
    saveReviewMessages(review.date, history);
    setInput('');
    void send(review.date, history);
  };

  const summarize = async () => {
    if (!review) return;
    setBusy('summary');
    setError('');
    try {
      const r = await postJSON<ReviewSummary>('/api/coach/summary', { ...context(), messages });
      setSummary(r);
      setCardPicks(r.cards.map(() => true));
      setChangePicks(r.changes.map(() => true));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const confirm = () => {
    if (!review || !summary) return;
    finishReview(
      review.date,
      summary.cards.filter((_, i) => cardPicks[i]),
      summary.changes.filter((_, i) => changePicks[i]),
    );
    setSummary(null);
  };

  const turns = messages.filter((m) => m.role === 'user').length;
  // 请求失败或页面刷新后，对话停在等待教练的状态
  const stalled = !!review && !review.done && !paused && busy === null && (messages.length === 0 || messages.at(-1)?.role === 'user');

  // 还没开始
  if (!review) {
    return (
      <div className="note">
        <p className="kicker">AI 教练复盘 · 约 15 分钟</p>
        <p className="muted" style={{ fontSize: 14 }}>
          教练会带你回看这些记录，用提问帮你区分事实和判断，最后整理出一两张认知卡片和下周的系统调整。调整要你确认后才生效。
        </p>
        <button type="button" className="btn block" style={{ marginTop: 6 }} disabled={week.length === 0} onClick={begin}>
          {week.length === 0 ? '这周有记录后再来复盘' : '开始本周复盘'}
        </button>
      </div>
    );
  }

  return (
    <section className="field" aria-label="AI 教练复盘">
      <p className="kicker rule">{review.done ? '本周复盘 · 已完成' : 'AI 教练复盘'}</p>

      <div className="chat">
        {messages.map((m, i) => (
          <p key={i} className={`bubble ${m.role === 'user' ? 'me' : 'coach'}`}>
            {m.content}
          </p>
        ))}
        {busy === 'chat' && (
          <p className="bubble coach pending" aria-live="polite">
            <span>教练在看你的记录…</span>
          </p>
        )}
        <div ref={endRef} />
      </div>

      {error && <p className="error" role="alert">{error}</p>}
      {stalled && (
        <button type="button" className="linkbtn" onClick={() => send(review.date, messages)}>
          {messages.length === 0 ? '请教练开场 →' : '教练还没回答，重试 →'}
        </button>
      )}

      {review.done ? (
        <div className="note">
          <p style={{ fontWeight: 600 }}>这一周的复盘已经收好了。</p>
          <p className="muted" style={{ fontSize: 14 }}>
            卡片在 <Link href="/cards">认知卡片</Link> 里，确认过的调整已经写进 <Link href="/plan">我的主题</Link>。下周再见。
          </p>
        </div>
      ) : summary ? (
        <div className="field" style={{ gap: 14 }}>
          {summary.cards.length > 0 && (
            <>
              <p className="label">认知卡片 · 选择要收下的</p>
              {summary.cards.map((c, i) => (
                <label key={i} className="card pick">
                  <input type="checkbox" checked={cardPicks[i]} onChange={(e) => setCardPicks(cardPicks.map((v, j) => (j === i ? e.target.checked : v)))} />
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span className="card-text">{c.text}</span>
                    {c.source && <span className="card-source">来自：“{c.source}”</span>}
                  </span>
                </label>
              ))}
            </>
          )}
          {summary.changes.length > 0 && (
            <>
              <p className="label">下周的系统调整 · 确认后生效</p>
              {summary.changes.map((c, i) => {
                const { label, before } = describeChange(c, plan);
                return (
                  <label key={i} className="card pick">
                    <input type="checkbox" checked={changePicks[i]} onChange={(e) => setChangePicks(changePicks.map((v, j) => (j === i ? e.target.checked : v)))} />
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span className="kicker">{label}</span>
                      <span className="diff">
                        <s>{before}</s>
                        <b>{c.value}</b>
                      </span>
                      {c.reason && <span className="muted" style={{ fontSize: 13 }}>{c.reason}</span>}
                      <span className="card-source">依据：“{c.quote}”</span>
                    </span>
                  </label>
                );
              })}
            </>
          )}
          <button type="button" className="btn block" onClick={confirm}>收下，复盘完成</button>
          <button type="button" className="linkbtn quiet" style={{ alignSelf: 'center' }} onClick={() => setSummary(null)}>
            回到对话再聊聊
          </button>
        </div>
      ) : (
        <>
          {!paused && (
            <div className="composer">
              <label htmlFor="coach-input" className="sr-only">回答教练</label>
              <textarea
                id="coach-input"
                className="textarea"
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    reply();
                  }
                }}
                placeholder="说说实际发生了什么"
                disabled={busy !== null || messages.length === 0}
              />
              <button type="button" className="btn" disabled={busy !== null || !input.trim()} onClick={reply}>
                发送
              </button>
            </div>
          )}
          {!paused && turns >= MIN_TURNS && (
            <button type="button" className="btn ghost block" disabled={busy !== null} onClick={summarize}>
              {busy === 'summary' ? '正在整理…' : '聊得差不多了，整理成卡片和调整'}
            </button>
          )}
          {!paused && turns < MIN_TURNS && messages.length > 0 && (
            <p className="muted" style={{ fontSize: 12 }}>再聊 {MIN_TURNS - turns} 轮，就可以整理成卡片和调整。</p>
          )}
        </>
      )}
    </section>
  );
}
