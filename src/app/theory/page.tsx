'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { CompoundArt, EnergyArt, EnvironmentArt, GrowthArt, LoopArt, MindArt, ZoneArt } from '@/components/Illustrations';
import { originFor, PRINCIPLES, THEORY_SUMMARY, type PrincipleId } from '@/lib/theory';
import type { Origin } from '@/lib/types';
import { useAppState } from '@/lib/useAppState';

/** 每条原理的插图，带上用户自己的回答 */
function artFor(id: PrincipleId, o: Origin | null): ReactNode {
  switch (id) {
    case 'growth':
      return <GrowthArt struggle={o?.struggle} />;
    case 'loop':
      return <LoopArt stuck={o?.stuck} />;
    case 'zone':
      return <ZoneArt persistence={o?.persistence} />;
    case 'system':
      return <CompoundArt />;
    case 'energy':
      return <EnergyArt energy={o?.energy} />;
    case 'environment':
      return <EnvironmentArt />;
    case 'mind':
      return <MindArt selfTalk={o?.selfTalk} />;
  }
}

/** 成长的底层逻辑：随时回看，每条原理旁边放着你第一天说过的话 */
export default function TheoryPage() {
  const state = useAppState();
  if (!state) return null;
  const origin = state.origin;

  return (
    <div className="page theory-page">
      <div className="page-head">
        <p className="kicker">成长的底层逻辑</p>
        <h1 className="page-title">年轮里的每一个设计，都来自这七条。</h1>
        {origin?.reflection && (
          <div className="echo" style={{ marginTop: 10, maxWidth: 720 }}>
            <p className="kicker">第 1 天，教练读完你的回答</p>
            <p>{origin.reflection}</p>
          </div>
        )}
      </div>

      {PRINCIPLES.map((p, i) => {
        const mine = origin ? originFor(p.id, origin) : [];
        return (
          <section key={p.id} id={p.id} className={i % 2 ? 'theory split flip' : 'theory split'}>
            <div className="theory-art">{artFor(p.id, origin)}</div>
            <div className="stack" style={{ gap: 12 }}>
              <p className="kicker">{i + 1} · {p.name}</p>
              <h2>{p.core}</h2>
              <p className="lesson-body">{p.body}</p>
              <p className="in-app">在年轮里：{p.inApp}</p>
              {mine.length > 0 && (
                <div className="echo" style={{ animation: 'none' }}>
                  <p className="kicker">你说过</p>
                  {mine.map((m) => (
                    <p key={m}>{m}</p>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })}

      <div className="note" style={{ maxWidth: 720, margin: '0 auto', width: '100%' }}>
        <p className="kicker">串起来就是一句话</p>
        <p className="serif" style={{ fontWeight: 500, fontSize: 17, lineHeight: 1.8 }}>{THEORY_SUMMARY}</p>
      </div>
      <Link href={state.plan ? '/' : '/welcome'} className="btn block" style={{ maxWidth: 420, margin: '0 auto' }}>
        {state.plan ? '回到今天' : '从头开始'}
      </Link>
    </div>
  );
}
