import type { CoachContext } from '@/lib/coach';
import { AIError } from '@/lib/server/deepseek';
import type { Card, ChatMessage, Entry, Origin, Plan } from '@/lib/types';

/** 校验页面传来的复盘上下文，并限制大小 */
export function readContext(body: Record<string, unknown>): { ctx: CoachContext; messages: ChatMessage[] } {
  const plan = body.plan as Plan | undefined;
  if (!plan || typeof plan.theme !== 'string' || !Array.isArray(plan.ladder)) throw new AIError('缺少成长主题', 400);
  const week = (Array.isArray(body.week) ? body.week : []).slice(0, 14) as Entry[];
  const cards = (Array.isArray(body.cards) ? body.cards : []).slice(0, 10) as Card[];
  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m: ChatMessage) => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string')
    .slice(-30)
    .map((m: ChatMessage) => ({ role: m.role, content: m.content.slice(0, 1000) }));
  const o = body.origin as Origin | null | undefined;
  const origin = o && typeof o.struggle === 'string' ? { ...o, struggle: o.struggle.slice(0, 300) } : null;
  return { ctx: { plan, week, cards, origin }, messages };
}
