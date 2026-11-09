import { daysBetween } from './dates';
import type { Energy, Entry } from './types';
import { THEME_DAYS } from './types';

/**
 * 年轮几何：一圈是一周，一段是一天，从中心往外长。
 * 颜色由当天状态决定；完成是粗纹，做了一部分是细纹，休息日是一个小点。
 */

export const ENERGY_COLORS: Record<Energy, string> = {
  1: '#C8B48E',
  2: '#D9A35A',
  3: '#A8B86A',
  4: '#4F9A62',
  5: '#1F6B4A',
};

export interface RingGeometry {
  cx: number;
  cy: number;
  r0: number;
  gap: number;
}

export interface RingPaths {
  /** 按状态分组的完成纹 */
  energy: Record<Energy, string>;
  partial: string;
  rest: string;
  /** 未来各周的淡虚线 */
  guides: string;
  /** 第 90 天的外圈 */
  outer: string;
  /** 今天还没回顾时的闪烁虚线 */
  today: string;
  /** 需要高亮的那一天（刚刚刻下的那一道） */
  highlight: string;
  highlightColor: string;
  /** 高亮那一段的中点，用来画标注 */
  highlightPoint: [number, number] | null;
  highlightAngle: number;
}

const WEEKS = Math.ceil(THEME_DAYS / 7); // 13
const SEG = 360 / 7;
const GAP_DEG = 7;

const f = (n: number) => n.toFixed(2);

/** 稳定的伪随机，让每个人的年轮有一点手作的起伏，但每次渲染都一样 */
function jitter(i: number): number {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x) - 0.5;
}

export function buildRing(
  entries: Entry[],
  startDate: string,
  today: string,
  geo: RingGeometry,
  highlightDate?: string,
): RingPaths {
  const { cx, cy, r0, gap } = geo;
  const P = (r: number, a: number): [number, number] => {
    const t = (a * Math.PI) / 180;
    return [cx + r * Math.cos(t), cy + r * Math.sin(t)];
  };
  const arc = (r: number, a0: number, a1: number) => {
    const p0 = P(r, a0);
    const p1 = P(r, a1);
    return `M${f(p0[0])} ${f(p0[1])} A${f(r)} ${f(r)} 0 0 1 ${f(p1[0])} ${f(p1[1])} `;
  };
  const circle = (r: number) => arc(r, -90, 90) + arc(r, 90, 270);
  const dot = (x: number, y: number, q: number) =>
    `M${f(x - q)} ${f(y)} a${q} ${q} 0 1 0 ${2 * q} 0 a${q} ${q} 0 1 0 ${-2 * q} 0 `;

  const out: RingPaths = {
    energy: { 1: '', 2: '', 3: '', 4: '', 5: '' },
    partial: '',
    rest: '',
    guides: '',
    outer: circle(r0 + (WEEKS - 1) * gap),
    today: '',
    highlight: '',
    highlightColor: ENERGY_COLORS[3],
    highlightPoint: null,
    highlightAngle: 0,
  };
  for (let w = 0; w < WEEKS - 1; w++) out.guides += circle(r0 + w * gap);

  const slot = (idx: number) => {
    const w = Math.floor(idx / 7);
    const d = idx % 7;
    const r = r0 + w * gap + jitter(idx) * 1.4;
    const a0 = -90 + d * SEG + GAP_DEG / 2;
    const a1 = a0 + SEG - GAP_DEG;
    return { r, a0, a1, am: (a0 + a1) / 2 };
  };

  const seen = new Set<string>();
  for (const e of entries) {
    const idx = daysBetween(startDate, e.date);
    if (idx < 0 || idx >= THEME_DAYS) continue;
    seen.add(e.date);
    const { r, a0, a1, am } = slot(idx);
    const energy = e.energy ?? 3;
    if (e.date === highlightDate && e.outcome !== 'skipped') {
      out.highlight = arc(r, a0, a1);
      out.highlightColor = ENERGY_COLORS[energy];
      out.highlightPoint = P(r, am);
      out.highlightAngle = am;
      continue;
    }
    if (e.outcome === 'done') out.energy[energy] += arc(r, a0, a1);
    else if (e.outcome === 'partial') out.partial += arc(r, a0, a0 + (SEG - GAP_DEG) * 0.6);
    else {
      const p = P(r, am);
      out.rest += dot(p[0], p[1], 1.8);
    }
  }

  const todayIdx = daysBetween(startDate, today);
  if (!seen.has(today) && todayIdx >= 0 && todayIdx < THEME_DAYS) {
    const { r, a0, a1 } = slot(todayIdx);
    out.today = arc(r, a0, a1);
  }
  return out;
}

/** 由一个点沿着它所在角度往外拉出的标注线终点 */
export function polar(geo: RingGeometry, r: number, angleDeg: number): [number, number] {
  const t = (angleDeg * Math.PI) / 180;
  return [geo.cx + r * Math.cos(t), geo.cy + r * Math.sin(t)];
}
