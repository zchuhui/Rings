'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { shortLabel } from '@/lib/dates';
import { deleteCard, updateCard } from '@/lib/store';
import type { Card } from '@/lib/types';
import { useAppState } from '@/lib/useAppState';

/** 认知卡片库（PRD F7）：置顶在前，其余按日期倒序，按主题归档 */
export default function CardsPage() {
  const state = useAppState();
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => {
    if (state && !state.plan) router.replace('/onboarding');
  }, [state, router]);

  if (!state || !state.plan) return null;

  const cards = [...state.cards].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.date.localeCompare(a.date));
  const themes = [...new Set(cards.map((c) => c.theme))];

  const save = (c: Card) => {
    const text = draft.trim();
    if (text) updateCard(c.id, { text });
    setEditing(null);
  };

  return (
    <div className="narrow">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p className="kicker">认知卡片 · {cards.length} 张</p>
        <h1 className="serif" style={{ fontSize: 28 }}>你自己说过的真话。</h1>
        <p className="muted" style={{ fontSize: 14 }}>每周复盘后，教练会帮你把一句认知收成一张卡片。下次复盘时，它会帮你发现跨周的规律。</p>
      </div>

      {cards.length === 0 && (
        <div className="note">
          <p>还没有卡片。</p>
          <Link href="/weekly" className="muted" style={{ fontSize: 14 }}>去做本周复盘 →</Link>
        </div>
      )}

      {themes.map((theme) => (
        <section key={theme} className="field" style={{ gap: 12 }}>
          {themes.length > 1 && <p className="kicker rule">{theme}</p>}
          {cards
            .filter((c) => c.theme === theme)
            .map((c) => (
              <article key={c.id} className={c.pinned ? 'card pinned' : 'card'}>
                {editing === c.id ? (
                  <>
                    <label htmlFor={`edit-${c.id}`} className="sr-only">编辑卡片</label>
                    <textarea id={`edit-${c.id}`} className="textarea" rows={2} value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus />
                    <div className="card-actions">
                      <button type="button" onClick={() => save(c)} style={{ color: 'var(--forest)', fontWeight: 600 }}>保存</button>
                      <button type="button" onClick={() => setEditing(null)}>取消</button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="card-text">{c.text}</p>
                    {c.source && <p className="card-source">来自：“{c.source}”</p>}
                    <div className="card-actions">
                      <span className="muted">{shortLabel(c.date)}</span>
                      <span style={{ flex: 1 }} />
                      <button type="button" onClick={() => updateCard(c.id, { pinned: !c.pinned })}>{c.pinned ? '取消置顶' : '置顶'}</button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(c.id);
                          setDraft(c.text);
                        }}
                      >
                        编辑
                      </button>
                      {confirming === c.id ? (
                        <>
                          <button type="button" onClick={() => deleteCard(c.id)} style={{ color: '#9a3b23', fontWeight: 600 }}>确认删除</button>
                          <button type="button" onClick={() => setConfirming(null)}>算了</button>
                        </>
                      ) : (
                        <button type="button" onClick={() => setConfirming(c.id)}>删除</button>
                      )}
                    </div>
                  </>
                )}
              </article>
            ))}
        </section>
      ))}
    </div>
  );
}
