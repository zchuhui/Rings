'use client';

import Link from 'next/link';
import { LoopDiagram, ZoneDiagram } from '@/components/TheoryDiagrams';
import { originFor, PRINCIPLES, THEORY_SUMMARY } from '@/lib/theory';
import { useAppState } from '@/lib/useAppState';

/** 成长的底层逻辑：随时回看，每条原理旁边放着你第一天说过的话 */
export default function TheoryPage() {
  const state = useAppState();
  if (!state) return null;
  const origin = state.origin;

  return (
    <div className="narrow" style={{ gap: 8 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 14 }}>
        <p className="kicker">成长的底层逻辑</p>
        <h1 className="serif" style={{ fontSize: 28, lineHeight: 1.4 }}>年轮里的每一个设计，都来自这七条。</h1>
        {origin?.reflection && (
          <div className="echo">
            <p className="kicker">第 1 天，教练读完你的回答</p>
            <p>{origin.reflection}</p>
          </div>
        )}
      </div>

      {PRINCIPLES.map((p, i) => {
        const mine = origin ? originFor(p.id, origin) : [];
        return (
          <section key={p.id} id={p.id} className="theory">
            <p className="kicker">{i + 1} · {p.name}</p>
            <h2>{p.core}</h2>
            {p.id === 'loop' && <LoopDiagram />}
            {p.id === 'zone' && <ZoneDiagram />}
            <p style={{ color: 'var(--ink-2)', lineHeight: 1.8 }}>{p.body}</p>
            <p className="in-app">在年轮里：{p.inApp}</p>
            {mine.length > 0 && (
              <div className="echo" style={{ animation: 'none' }}>
                <p className="kicker">你说过</p>
                {mine.map((m) => (
                  <p key={m}>{m}</p>
                ))}
              </div>
            )}
          </section>
        );
      })}

      <div className="note" style={{ marginTop: 8 }}>
        <p className="kicker">串起来就是一句话</p>
        <p className="serif" style={{ fontWeight: 500, fontSize: 16, lineHeight: 1.8 }}>{THEORY_SUMMARY}</p>
      </div>
      <Link href={state.plan ? '/' : '/welcome'} className="btn block" style={{ marginTop: 14 }}>
        {state.plan ? '回到今天' : '从头开始'}
      </Link>
    </div>
  );
}
