import { draftPrompt, hasCrisisSignal, ladderPrompt, parseDraft, parseLadderOnly } from '@/lib/coach';
import { AIError, chatJSON, errorResponse } from '@/lib/server/deepseek';

/**
 * 起步设置里的 AI 帮手（PRD F1、F2）。
 * mode=full：把一段描述收敛成主题、身份宣言、触发情境和五级阶梯
 * mode=ladder：按已填的主题生成五级阶梯
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const text = (k: string, max = 500) => (typeof body[k] === 'string' ? (body[k] as string).trim().slice(0, max) : '');

    if (body.mode === 'ladder') {
      const theme = text('theme', 100);
      if (!theme) throw new AIError('先写下想练的主题', 400);
      const ladder = await chatJSON(ladderPrompt({ theme, trigger: text('trigger', 100), first: text('first', 100) }), parseLadderOnly);
      return Response.json({ ladder });
    }

    const description = text('description');
    if (description.length < 4) throw new AIError('多写几个字，说说最近最困扰你的事', 400);
    if (hasCrisisSignal(description)) return Response.json({ crisis: true });
    const draft = await chatJSON(draftPrompt(description), parseDraft);
    return Response.json({ draft });
  } catch (e) {
    return errorResponse(e);
  }
}
