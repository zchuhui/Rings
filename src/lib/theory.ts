import { daysBetween } from './dates';
import type { AdjustmentKind } from './engine';
import type { Energy, Entry, Origin } from './types';

/**
 * 个人成长的底层逻辑（.notes/个人成长理论.md）。
 * 起步介绍、理论页和系统调整里的“为什么”都用这一份。
 */

export type PrincipleId = 'growth' | 'loop' | 'zone' | 'system' | 'energy' | 'environment' | 'mind';

export interface Principle {
  id: PrincipleId;
  name: string;
  /** 一句话核心 */
  core: string;
  body: string;
  /** 这条原理在年轮里落成了什么 */
  inApp: string;
}

export const PRINCIPLES: Principle[] = [
  {
    id: 'growth',
    name: '成长是什么',
    core: '成长，是你能妥善应对的世界变大了。',
    body: '以前让你焦虑、搞不定、看不懂的事，现在你能处理、能理解、能平静面对。应对能力分三层：认知是你看世界的模型，能力是你能做成什么，心性是你在压力和失败里能不能稳住。很多人卡住，是因为只在其中一层用力。',
    inApp: '起步时你给三层各打了分，第 90 天会再打一次，看看哪一层长了。',
  },
  {
    id: 'loop',
    name: '反馈循环',
    core: '所有成长，都靠一个循环推动。',
    body: '行动 → 得到反馈 → 反思 → 调整 → 再行动。成长速度 ≈ 循环次数 × 每次循环的质量。只学不做，循环转不起来；只做不想，循环质量很低。',
    inApp: '每天一件小事是行动，晚上 30 秒回顾是反馈，每周复盘是反思，系统调整是调整。',
  },
  {
    id: 'zone',
    name: '学习区',
    core: '成长只发生在“够一够”的地方。',
    body: '舒适区里做得轻松，但学不到东西；恐慌区里只剩焦虑，也学不到东西。只有比现在的能力稍难一点的学习区，才会真正发生成长。好的节奏是持续加一点点难度。',
    inApp: '五级难度阶梯。连续觉得太轻松就升一级，连续太难就降一级。',
  },
  {
    id: 'system',
    name: '复利与系统',
    core: '连续性比强度更重要，系统比意志力可靠。',
    body: '成长是非线性的，前期看起来几乎没有回报，到了临界点才开始加速。目标只告诉你想去哪里，系统决定你每天实际做什么。意志力会耗尽，好的系统让正确的行为变成默认选项。',
    inApp: '最小行为 + 触发情境，把“想做”变成“到了那个时刻就做”。年轮只算累计，不算连续。',
  },
  {
    id: 'energy',
    name: '能量底座',
    core: '能量先于方法。',
    body: '睡眠不足、长期焦虑、注意力碎片化的时候，再好的方法也执行不了。很多人以为自己缺的是自律，实际上缺的是能量。',
    inApp: '每天的状态决定年轮的颜色。连续几天状态偏低，挑战会临时降到最小一步。',
  },
  {
    id: 'environment',
    name: '环境设计',
    core: '环境比意志更强大。',
    body: '与其每天对抗环境，不如设计环境：让好行为容易发生，让坏行为难以发生。环境里最重要的部分是人。',
    inApp: '起步时写下一条环境调整。“忘了”和“情境没出现”不调难度，只调环境和触发。',
  },
  {
    id: 'mind',
    name: '心性',
    core: '失败是数据，不是判决。',
    body: '失败只说明“这个方法在这个情境下不行”，不说明“你不行”。过度的自我否定会让人回避挑战和反馈。能对自己说“我现在还不够好，这没关系，我们来看看怎么改进”的人，反而进步最快。',
    inApp: '没做不清零。没做到时只问原因，答案只用来调整系统。',
  },
];

export const THEORY_SUMMARY =
  '在清楚的方向上，以充足的能量为底座，借助好的环境和系统，持续在学习区里跑反馈循环，用平和的心态对待每一次失败，让复利去做剩下的事。';

export function principle(id: PrincipleId): Principle {
  return PRINCIPLES.find((p) => p.id === id)!;
}

/* ---------- 起步时的问题与回应：每一个回答都马上被接住 ---------- */

export const LAYERS = [
  { key: 'cognition', name: '认知', hint: '看问题的方式：看得清自己卡在哪吗' },
  { key: 'ability', name: '能力', hint: '做事的本领：想做的事做得成吗' },
  { key: 'mind', name: '心性', hint: '面对压力和失败：稳得住吗' },
] as const;

export type LayerKey = (typeof LAYERS)[number]['key'];

export const STUCK = [
  { key: 'action', label: '迟迟没有开始' },
  { key: 'feedback', label: '做了，但不知道做得怎么样' },
  { key: 'reflect', label: '很少回头想' },
  { key: 'restart', label: '一中断就没再回来' },
] as const;

export const PERSISTENCE = [
  { key: 'days', label: '几天' },
  { key: 'weeks', label: '一两周' },
  { key: 'month', label: '一个月左右' },
  { key: 'long', label: '能坚持很久' },
] as const;

export const SELF_TALK = [
  { key: 'again', label: '“我怎么又这样”' },
  { key: 'giveup', label: '“算了，反正坚持不了”' },
  { key: 'later', label: '“下次再说吧”' },
  { key: 'curious', label: '“没关系，看看哪里出了问题”' },
] as const;

export type StuckKey = (typeof STUCK)[number]['key'];
export type PersistenceKey = (typeof PERSISTENCE)[number]['key'];
export type SelfTalkKey = (typeof SELF_TALK)[number]['key'];

export const labelOf = <K extends string>(list: ReadonlyArray<{ key: K; label: string }>, k?: K) =>
  list.find((x) => x.key === k)?.label ?? '';

export function echoStruggle(text: string): string {
  const t = text.trim();
  if (!t) return '说不上来也没关系。看完这几页，也许会更清楚。';
  return `「${t}」，我记下了。它不是你的缺点，是你的世界下一步要变大的地方。接下来的 90 天，就从这里出发。`;
}

const LAYER_HINTS: Record<LayerKey, string> = {
  cognition: '这一层卡住时，常见的是看不清问题在哪，或者把“解释”当成了“事实”。复盘时，教练会多陪你拆这一层。',
  ability: '这说明你需要的可能不是再多知道一点，而是多练几次。每天那一件小事，就是练。',
  mind: '压力和失败会让人缩回来。所以在这里，没做到不清零，失败只当作数据。',
};

export function echoRatings(r: Partial<Record<LayerKey, number>>): string {
  const rated = LAYERS.filter((l) => r[l.key]);
  if (rated.length < 3) return '';
  const vals = rated.map((l) => r[l.key]!);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  if (min === max) {
    return `三层你都打了 ${min} 分，没有明显的短板。卡住你的，可能不是哪一层，而是循环还没转起来。`;
  }
  const low = rated.filter((l) => r[l.key] === min);
  const high = rated.filter((l) => r[l.key] === max);
  const lowNames = low.map((l) => l.name).join('和');
  const highNames = high.map((l) => l.name).join('和');
  const hint = low.length === 1 ? LAYER_HINTS[low[0].key] : '';
  return `${lowNames}是你给分最低的（${min} 分），${highNames}是你的底子（${max} 分）。${hint}`;
}

export function echoStuck(k?: StuckKey): string {
  switch (k) {
    case 'action':
      return '那就把第一步缩到 2 分钟以内，小到不需要下决心。循环先转起来，再谈快慢。';
    case 'feedback':
      return '这里每天晚上只用 30 秒，告诉我难度是太轻松、刚好还是太难。这就是你一直缺的那份反馈。';
    case 'reflect':
      return '每周会有一次 15 分钟的复盘。教练来提问，你只需要说实话，想的部分交给我们一起做。';
    case 'restart':
      return '这里没有连续打卡。离开多久，年轮都一道不少；回来那天，从最小的一步开始。';
    default:
      return '';
  }
}

export function echoPersistence(k?: PersistenceKey): string {
  switch (k) {
    case 'days':
    case 'weeks':
      return '很多人都是这样。这通常不是意志力的问题，是目标一开始就落在了恐慌区。这次从最小的一步开始，系统根据你的反馈一级一级往上加。';
    case 'month':
      return '能坚持一个月，说明你有持续的能力。这次让难度跟着你走，把一个月慢慢变成三个月。';
    case 'long':
      return '你已经有不错的坚持力。对你来说，关键是别停在舒适区。太轻松的时候，系统会替你加一点难度。';
    default:
      return '';
  }
}

export function echoEnergy(e?: Energy): string {
  if (!e) return '';
  if (e <= 2) return '状态偏低的时候，不适合加码。先把底座修好，挑战会自动降到最小一步，这不算退步。';
  if (e === 3) return '状态平稳。每天晚上顺手记一下，过几周你会看见状态和行动之间的关系。';
  return '状态不错，是开始的好时候。之后每天的状态，会变成年轮上那一道的颜色。';
}

export function echoSelfTalk(k?: SelfTalkKey): string {
  switch (k) {
    case 'again':
    case 'giveup':
      return `${labelOf(SELF_TALK, k)}，这句话很多人都对自己说过。在这里，没做到时只问一个问题：是什么原因？答案只用来调整系统，不用来评判你。`;
    case 'later':
      return '“下次”很容易变成“再也没有”。在这里，下次就是明天，而且明天会根据今天调整。';
    case 'curious':
      return '这正是能走远的心态。我们把它变成习惯：每一次没做到，都换来一次调整。';
    default:
      return '';
  }
}

/** “我听到的你”：把起步时的回答一条条还给用户 */
export function originLines(o: Origin): Array<{ q: string; a: string }> {
  const lines: Array<{ q: string; a: string }> = [];
  if (o.struggle) lines.push({ q: '最近让你搞不定的事', a: `「${o.struggle}」` });
  if (o.ratings) {
    const r = o.ratings;
    lines.push({ q: '三层自评', a: LAYERS.map((l) => `${l.name} ${r[l.key] ?? '-'}`).join(' · ') });
  }
  if (o.stuck) lines.push({ q: '以前常卡在', a: labelOf(STUCK, o.stuck) });
  if (o.persistence) lines.push({ q: '目标通常坚持', a: labelOf(PERSISTENCE, o.persistence) });
  if (o.energy) lines.push({ q: '最近一周的状态', a: `${o.energy} / 5` });
  if (o.selfTalk) lines.push({ q: '没做到时对自己说', a: labelOf(SELF_TALK, o.selfTalk) });
  return lines;
}

/** 起步回答的纯文本描述，给 AI 用 */
export function describeOrigin(o: Origin): string {
  return originLines(o)
    .map((l) => `${l.q}：${l.a}`)
    .join('\n');
}

/** 系统调整背后是哪条原理，结果页上用来解释“为什么” */
export function principleFor(kind: AdjustmentKind, skipped: boolean): PrincipleId {
  if (kind === 'recharge') return 'energy';
  if (kind === 'trigger' || kind === 'reminder') return 'environment';
  if (skipped) return 'mind';
  return 'zone';
}

/** 起步回答对应到每条原理，理论页上放在原理旁边 */
export function originFor(id: PrincipleId, o: Origin): string[] {
  switch (id) {
    case 'growth':
      return [
        o.struggle ? `你说最近搞不定的是「${o.struggle}」` : '',
        o.ratings ? `你给自己的三层打分：${LAYERS.map((l) => `${l.name} ${o.ratings?.[l.key] ?? '-'}`).join('，')}` : '',
      ].filter(Boolean);
    case 'loop':
      return o.stuck ? [`你说以前常卡在：${labelOf(STUCK, o.stuck)}`] : [];
    case 'zone':
    case 'system':
      return o.persistence ? [`你说过去的目标通常坚持：${labelOf(PERSISTENCE, o.persistence)}`] : [];
    case 'energy':
      return o.energy ? [`起步那周，你的状态是 ${o.energy} / 5`] : [];
    case 'mind':
      return o.selfTalk ? [`你说没做到时会对自己说：${labelOf(SELF_TALK, o.selfTalk)}`] : [];
    default:
      return [];
  }
}

export interface Recall {
  label: string;
  text: string;
}

/**
 * 首页的“回声”：把你以前说过的话还给你。
 * 第一周放起点那句困扰；之后每天从一周以前的记录和起点里轮流挑一句。
 */
export function pickRecall(origin: Origin | null, entries: Entry[], startDate: string, today: string): Recall | null {
  const day = daysBetween(startDate, today) + 1;
  const first: Recall | null = origin?.struggle ? { label: '第 1 天，你说最困扰的是', text: origin.struggle } : null;
  if (day <= 7) return first;
  const old = entries
    .filter((e) => e.note && daysBetween(e.date, today) >= 7)
    .map((e) => ({ label: `${daysBetween(e.date, today)} 天前，你写下`, text: e.note }));
  const pool = first ? [first, ...old] : old;
  if (!pool.length) return null;
  return pool[day % pool.length];
}
