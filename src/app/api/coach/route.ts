import { COACH_OPENER, CRISIS_REPLY, coachSystem, hasCrisisSignal } from '@/lib/coach';
import { chat, errorResponse } from '@/lib/server/deepseek';
import { readContext } from './context';

/** 每周复盘的一轮对话（PRD F6） */
export async function POST(req: Request) {
  try {
    const { ctx, messages } = readContext(await req.json().catch(() => ({})));
    const last = messages.at(-1);
    if (last?.role === 'user' && hasCrisisSignal(last.content)) {
      return Response.json({ reply: CRISIS_REPLY, crisis: true });
    }
    const history = messages.length ? messages : [{ role: 'user' as const, content: COACH_OPENER }];
    if (history[0].role === 'assistant') history.unshift({ role: 'user', content: COACH_OPENER });
    const reply = await chat(history, { system: coachSystem(ctx), maxTokens: 400 });
    return Response.json({ reply });
  } catch (e) {
    return errorResponse(e);
  }
}
