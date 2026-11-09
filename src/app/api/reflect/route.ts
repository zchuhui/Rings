import { CRISIS_REPLY, cleanEcho, entryEchoPrompt, hasCrisisSignal, originEchoPrompt } from '@/lib/coach';
import { AIError, chat, errorResponse } from '@/lib/server/deepseek';
import type { Entry, Origin } from '@/lib/types';

/**
 * 被看见：教练读完之后的回应。
 * kind=origin：看完成长理论后，对全部回答写一段话
 * kind=entry：晚间回顾后，对今天的记录说一句话
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    if (body.kind === 'origin') {
      const o = body.origin as Origin | undefined;
      if (!o || typeof o.struggle !== 'string') throw new AIError('缺少回答', 400);
      const origin: Origin = { ...o, struggle: o.struggle.slice(0, 300) };
      if (hasCrisisSignal(origin.struggle)) return Response.json({ crisis: true, text: CRISIS_REPLY });
      const text = await chat(originEchoPrompt(origin), { maxTokens: 300 });
      return Response.json({ text: cleanEcho(text, 200) });
    }

    if (body.kind === 'entry') {
      const entry = body.entry as Entry | undefined;
      if (!entry || typeof entry.note !== 'string' || !entry.note.trim()) throw new AIError('缺少记录', 400);
      if (hasCrisisSignal(entry.note)) return Response.json({ crisis: true, text: CRISIS_REPLY });
      const earlier = (Array.isArray(body.earlier) ? body.earlier : [])
        .slice(-6)
        .map((e: Entry) => ({ date: String(e?.date ?? ''), note: String(e?.note ?? '').slice(0, 200) }));
      const text = await chat(
        entryEchoPrompt({
          theme: String(body.theme ?? '').slice(0, 100),
          entry: { ...entry, note: entry.note.slice(0, 300) },
          earlier,
          struggle: typeof body.struggle === 'string' ? body.struggle.slice(0, 300) : undefined,
        }),
        { maxTokens: 150 },
      );
      return Response.json({ text: cleanEcho(text, 100) });
    }

    throw new AIError('不认识的请求', 400);
  } catch (e) {
    return errorResponse(e);
  }
}
