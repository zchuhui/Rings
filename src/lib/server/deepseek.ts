import 'server-only';
import { extractJSON } from '../coach';
import type { ChatMessage } from '../types';

/**
 * DeepSeek 对话接口（OpenAI 兼容）。密钥只在服务端读取，不会发到浏览器。
 * 环境变量：DEEPSEEK_API_KEY（必填）、DEEPSEEK_MODEL（默认 deepseek-chat）、DEEPSEEK_BASE_URL。
 */

export class AIError extends Error {
  constructor(
    message: string,
    public status = 502,
  ) {
    super(message);
  }
}

interface Options {
  system?: string;
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export async function chat(messages: ChatMessage[], opts: Options = {}): Promise<string> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new AIError('AI 还没有配置：在 .env 里设置 DEEPSEEK_API_KEY', 503);
  const base = process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com';
  const model = process.env.DEEPSEEK_MODEL ?? 'deepseek-chat';

  const body = {
    model,
    messages: [...(opts.system ? [{ role: 'system', content: opts.system }] : []), ...messages],
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 800,
    ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
  };

  let res: Response;
  try {
    res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    throw new AIError('连不上 AI 服务，稍后再试');
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('[deepseek]', res.status, detail.slice(0, 300));
    if (res.status === 401) throw new AIError('AI 密钥无效，检查 .env 里的 DEEPSEEK_API_KEY', 503);
    if (res.status === 402) throw new AIError('AI 账户余额不足', 503);
    if (res.status === 429) throw new AIError('AI 请求太频繁，稍等一下再试', 429);
    throw new AIError('AI 服务出错了，稍后再试');
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new AIError('AI 没有返回内容，再试一次');
  return content;
}

/** 让模型输出 JSON 并用 parse 校验，不合格时重试一次 */
export async function chatJSON<T>(
  messages: ChatMessage[],
  parse: (x: unknown) => T | null,
  opts: Omit<Options, 'json'> = {},
): Promise<T> {
  for (let i = 0; i < 2; i++) {
    const text = await chat(messages, { ...opts, json: true });
    const out = parse(extractJSON(text));
    if (out) return out;
    console.error('[deepseek] 无法解析的 JSON', text.slice(0, 300));
  }
  throw new AIError('AI 的回答格式不对，再试一次');
}

export function errorResponse(e: unknown): Response {
  const err = e instanceof AIError ? e : new AIError('出错了，稍后再试', 500);
  if (!(e instanceof AIError)) console.error(e);
  return Response.json({ error: err.message }, { status: err.status });
}
