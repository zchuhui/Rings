import type { Card, ChatMessage, Entry, Level, Plan } from './types';

/**
 * AI 教练的提示词和结果校验（PRD F1、F2、F6、F9.2）。
 * 这里只放纯函数，服务端路由和页面都会用到，方便单测。
 */

/* ---------- 安全边界（PRD 9.2） ---------- */

const CRISIS_WORDS = ['自杀', '不想活', '活不下去', '想死', '轻生', '结束生命', '自残', '割腕', '跳楼', '没有活下去'];

export function hasCrisisSignal(text: string): boolean {
  return CRISIS_WORDS.some((w) => text.includes(w));
}

export const CRISIS_REPLY =
  '谢谢你愿意说出来，这些感受很重要。成长训练可以先放一放，现在更要紧的是你自己。\n\n' +
  '如果你正处在危险中，请马上拨打 110 或 120。也可以打全国统一心理援助热线 12356，' +
  '或者联系一个你信任的人，告诉对方你现在的状态。你不需要一个人扛着。';

/* ---------- 起步：把一段描述收敛成执行系统（F1、F2） ---------- */

export type PlanDraft = Pick<Plan, 'theme' | 'identity' | 'trigger' | 'environment' | 'ladder'>;

const DRAFT_RULES = `规则：
- theme 必须是看得见的行为，不能是抽象形容词。“提升沟通能力”太大，“在会议上说出自己的观点”刚好。只选一件事。
- identity 是一句以“我是一个”开头的身份宣言，以句号结尾。
- trigger 绑定一个已有的日常情境，例如“会议开始后的前 10 分钟内”“晚饭后回到房间时”。
- environment 是一条让行为更容易发生的环境调整，可以为空字符串。
- ladder 是 5 级难度阶梯，L1 是 2 分钟内能做完的最小行为，L5 是这个主题“毕业”时的状态，每级只比上一级难一点。每级不超过 20 个字。
- 不接受有害主题（极端节食、过度训练、伤害自己或他人），遇到时把它改写成健康、温和的版本。
- 用简体中文，语气平实，不用感叹号。`;

export function draftPrompt(description: string): ChatMessage[] {
  return [
    {
      role: 'user',
      content: `用户想用 90 天只练一件事。下面是用户对“最近最想突破或最困扰的事”的描述：

"""${description}"""

请把它收敛成一个执行系统，只输出 JSON：
{"theme": string, "identity": string, "trigger": string, "environment": string, "ladder": [string, string, string, string, string]}

${DRAFT_RULES}`,
    },
  ];
}

export function ladderPrompt(p: Pick<Plan, 'theme' | 'trigger'> & { first: string }): ChatMessage[] {
  return [
    {
      role: 'user',
      content: `为这个 90 天成长主题设计 5 级难度阶梯。
主题：${p.theme}
触发情境：${p.trigger || '（未填写）'}
${p.first ? `L1（用户已定，保持原意）：${p.first}` : ''}

只输出 JSON：{"ladder": [string, string, string, string, string]}

${DRAFT_RULES}`,
    },
  ];
}

const str = (x: unknown, max = 60): string => (typeof x === 'string' ? x.trim().slice(0, max) : '');

function parseLadder(x: unknown): Plan['ladder'] | null {
  if (!Array.isArray(x) || x.length !== 5) return null;
  const l = x.map((v) => str(v));
  return l.every(Boolean) ? (l as Plan['ladder']) : null;
}

export function parseDraft(x: unknown): PlanDraft | null {
  if (!x || typeof x !== 'object') return null;
  const o = x as Record<string, unknown>;
  const ladder = parseLadder(o.ladder);
  const d = { theme: str(o.theme), identity: str(o.identity), trigger: str(o.trigger), environment: str(o.environment) };
  if (!ladder || !d.theme || !d.identity || !d.trigger) return null;
  return { ...d, ladder };
}

export function parseLadderOnly(x: unknown): Plan['ladder'] | null {
  if (!x || typeof x !== 'object') return null;
  return parseLadder((x as Record<string, unknown>).ladder);
}

/* ---------- 每周复盘（F6） ---------- */

const OUTCOME = { done: '做了', partial: '做了一部分', skipped: '没做' } as const;
const FEEL = { easy: '太轻松', right: '刚好', hard: '太难' } as const;
const REASON = { hard: '太难', forgot: '忘了', tired: '没精力', noscene: '情境没出现', other: '其他' } as const;

export function describeEntry(e: Entry): string {
  const parts = [e.date, `L${e.level}`, OUTCOME[e.outcome]];
  if (e.feel) parts.push(`难度${FEEL[e.feel]}`);
  if (e.reason) parts.push(`原因：${REASON[e.reason]}`);
  if (e.energy) parts.push(`状态 ${e.energy}/5`);
  return `- ${parts.join('，')}。记录：${e.note ? `“${e.note}”` : '（没写）'}`;
}

export interface CoachContext {
  plan: Plan;
  /** 本周的记录 */
  week: Entry[];
  /** 历史认知卡片，用来发现跨周的规律 */
  cards: Card[];
}

export function coachSystem({ plan, week, cards }: CoachContext): string {
  const records = week.length ? [...week].sort((a, b) => a.date.localeCompare(b.date)).map(describeEntry).join('\n') : '（本周没有记录）';
  const history = cards.length ? cards.slice(0, 10).map((c) => `- ${c.date}：${c.text}`).join('\n') : '（还没有）';
  return `你是「年轮」的成长教练，正在带用户做每周复盘，大约 15 分钟。你的角色是提问者，不是说教者：帮用户看清自己的记录，而不是替用户下结论。

用户的 90 天主题：${plan.theme}
身份宣言：${plan.identity}
当前难度：L${plan.level}「${plan.ladder[plan.level - 1]}」
触发情境：${plan.trigger}
环境调整：${plan.environment || '（无）'}
难度阶梯：${plan.ladder.map((t, i) => `L${i + 1} ${t}`).join('；')}

本周记录：
${records}

以前的认知卡片：
${history}

复盘围绕四个问题，一次只问一个，按顺序推进，但要跟着用户的回答走：
1. 这周哪里走出了舒适区？
2. 得到了什么反馈？
3. 修正了什么认知或做法？
4. 下周把什么放进系统？

对话原则：
- 每轮回复不超过 120 字，以一个提问结尾。建议最多一条。
- 引用用户的原始记录，用引号标出原话，不说空泛的鸡汤。
- 区分事实和解释。用户说“同事觉得我的意见很蠢”时，追问“他实际说了什么”。
- 发现和以前卡片相似的规律时，可以点出来。
- 语气温和而直接，不羞辱，不制造内疚，也不空洞夸奖。没做的天数是数据，不是失败。
- 不做心理诊断，不给医疗、法律或投资建议。
- 如果用户流露出自伤、轻生或严重抑郁的信号，停止复盘，温和回应，建议拨打全国心理援助热线 12356，紧急情况拨打 110 或 120。
- 用简体中文，不用 Markdown 标题和列表。`;
}

/** 用户还没说话时，让教练先开口 */
export const COACH_OPENER = '（用户打开了本周复盘。请先用一两句话点出本周记录里一个具体的细节，然后问第一个问题。）';

export type ChangeField = 'trigger' | 'environment' | 'ladder';

/** 对下周执行系统的一条具体调整，需用户确认后生效 */
export interface PlanChange {
  field: ChangeField;
  /** field 为 ladder 时，改的是哪一级 */
  level?: Level;
  value: string;
  reason: string;
  /** 引用的用户原始记录（PRD F6 验收标准） */
  quote: string;
}

export interface ReviewSummary {
  cards: Array<Pick<Card, 'text' | 'source'>>;
  changes: PlanChange[];
}

export function summaryPrompt(): ChatMessage {
  return {
    role: 'user',
    content: `（复盘到这里结束。请根据上面的对话和本周记录，整理产出，只输出 JSON：
{"cards": [{"text": string, "source": string}], "changes": [{"field": "trigger" | "environment" | "ladder", "level": 1-5（仅 field 为 ladder 时）, "value": string, "reason": string, "quote": string}]}

要求：
- cards 1 到 2 张。text 是一句用户自己的认知，用第一人称，不超过 30 字，例如“我怕的不是说错，是怕冷场。”。source 是它来自的用户原话。
- changes 0 到 2 条，一次只改一点。value 是改写后的完整新内容（触发情境、环境调整，或某一级挑战），不超过 30 字。reason 用一句话说明为什么改。quote 必须原样引用一条用户本周写过的记录或对话里的原话。
- 如果对话太短、看不出该改什么，changes 给空数组。）`,
  };
}

export function parseSummary(x: unknown): ReviewSummary | null {
  if (!x || typeof x !== 'object') return null;
  const o = x as Record<string, unknown>;
  const rawCards = Array.isArray(o.cards) ? o.cards : [];
  const rawChanges = Array.isArray(o.changes) ? o.changes : [];
  const cards = rawCards
    .map((c) => ({ text: str((c as Record<string, unknown>)?.text, 80), source: str((c as Record<string, unknown>)?.source, 200) }))
    .filter((c) => c.text)
    .slice(0, 2);
  const changes: PlanChange[] = [];
  for (const raw of rawChanges) {
    const c = (raw ?? {}) as Record<string, unknown>;
    const field = c.field;
    if (field !== 'trigger' && field !== 'environment' && field !== 'ladder') continue;
    const value = str(c.value, 80);
    const quote = str(c.quote, 200);
    if (!value || !quote) continue;
    const change: PlanChange = { field, value, reason: str(c.reason, 120), quote };
    if (field === 'ladder') {
      const lv = Number(c.level);
      if (!(lv >= 1 && lv <= 5 && Number.isInteger(lv))) continue;
      change.level = lv as Level;
    }
    changes.push(change);
    if (changes.length === 2) break;
  }
  if (!cards.length && !changes.length) return null;
  return { cards, changes };
}

export function applyPlanChange(plan: Plan, c: PlanChange): Plan {
  if (c.field === 'trigger') return { ...plan, trigger: c.value };
  if (c.field === 'environment') return { ...plan, environment: c.value };
  if (!c.level) return plan;
  const ladder = [...plan.ladder] as Plan['ladder'];
  ladder[c.level - 1] = c.value;
  return { ...plan, ladder };
}

export function describeChange(c: PlanChange, plan: Plan): { label: string; before: string } {
  if (c.field === 'trigger') return { label: '触发情境', before: plan.trigger };
  if (c.field === 'environment') return { label: '环境调整', before: plan.environment || '（无）' };
  const lv = c.level ?? 1;
  return { label: `L${lv} 挑战`, before: plan.ladder[lv - 1] };
}

/** 从模型输出里取出 JSON，容忍外面包了 ```json 代码块 */
export function extractJSON(text: string): unknown {
  const t = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '');
  try {
    return JSON.parse(t);
  } catch {
    const m = t.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch {
      return null;
    }
  }
}
