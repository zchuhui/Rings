import { COACH_OPENER, coachSystem, parseSummary, summaryPrompt } from '@/lib/coach';
import { chatJSON, errorResponse } from '@/lib/server/deepseek';
import { readContext } from '../context';

/** 复盘结束：整理出认知卡片和下周的系统调整（PRD F6、F7） */
export async function POST(req: Request) {
  try {
    const { ctx, messages } = readContext(await req.json().catch(() => ({})));
    const history = [...messages];
    if (history[0]?.role !== 'user') history.unshift({ role: 'user', content: COACH_OPENER });
    const summary = await chatJSON([...history, summaryPrompt()], parseSummary, {
      system: coachSystem(ctx),
      temperature: 0.4,
    });
    return Response.json(summary);
  } catch (e) {
    return errorResponse(e);
  }
}
