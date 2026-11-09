import type { ReactNode } from 'react';
import { ENERGY_COLORS } from '@/lib/ring';
import type { LayerKey, PersistenceKey, SelfTalkKey, StuckKey } from '@/lib/theory';
import { labelOf, SELF_TALK, STUCK } from '@/lib/theory';
import type { Energy, Level } from '@/lib/types';
import { STAGES } from '@/lib/types';

/**
 * 成长理论的插图。沿用年轮的线条语言：纸色底、细线、森林绿和沙色。
 * 插图会跟着用户的回答变化，让用户在图里也看见自己。
 */

const INK = '#1C1B17';
const MUTED = '#6B675C';
const LINE = '#D3CBBB';
const FOREST = '#1F6B4A';
const LEAF = '#4F9A62';
const OLIVE = '#A8B86A';
const AMBER = '#D9A35A';
const SAND = '#C8B48E';
const PALE = '#E8EFE2';
const PAPER = '#FBF9F4';
const BARK = '#8F7A57';

const serif = { fontFamily: 'var(--serif-cn)' };

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n) + '…' : s);

function Art({ label, caption, children, viewBox = '0 0 320 260' }: { label: string; caption?: ReactNode; children: ReactNode; viewBox?: string }) {
  return (
    <figure className="ill" aria-label={label}>
      <svg viewBox={viewBox} role="img" aria-hidden="true">
        {children}
      </svg>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

function Arrow({ id, color = FOREST }: { id: string; color?: string }) {
  return (
    <marker id={id} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill={color} />
    </marker>
  );
}

const delay = (s: number) => ({ animationDelay: `${s}s` });

/* ---------- 开场：一天一道，一周一圈 ---------- */

export function IntroArt() {
  const cx = 160;
  const cy = 125;
  const colors = [OLIVE, LEAF, AMBER, LEAF, FOREST, OLIVE, FOREST];
  const arcs = colors.map((c, i) => {
    const r = 26 + i * 13;
    const a0 = -80 + i * 31;
    const a1 = a0 + 250 - i * 12;
    const p = (a: number) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
    const [x0, y0] = p(a0);
    const [x1, y1] = p(a1);
    return { d: `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 1 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`, c, i };
  });
  return (
    <Art label="一圈圈长出来的年轮" caption="一天一道，一周一圈。90 天后，它会长成只属于你的图案。">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <circle key={i} cx={cx} cy={cy} r={26 + i * 13} fill="none" stroke={LINE} strokeWidth={0.6} strokeDasharray="1 3" />
      ))}
      {arcs.map((a) => (
        <path key={a.i} className="draw" pathLength={1} style={delay(0.15 * a.i)} d={a.d} fill="none" stroke={a.c} strokeWidth={4.5} strokeLinecap="round" />
      ))}
      <g className="fade" style={delay(1.2)}>
        <path d={`M${cx} ${cy + 8} C${cx} ${cy - 2} ${cx - 1} ${cy - 8} ${cx + 2} ${cy - 14}`} fill="none" stroke={FOREST} strokeWidth={2.2} strokeLinecap="round" />
        <path d={`M${cx + 2} ${cy - 10} C${cx + 10} ${cy - 18} ${cx + 16} ${cy - 12} ${cx + 15} ${cy - 8} C${cx + 9} ${cy - 6} ${cx + 5} ${cy - 7} ${cx + 2} ${cy - 10} Z`} fill={LEAF} />
        <path d={`M${cx} ${cy - 4} C${cx - 8} ${cy - 10} ${cx - 13} ${cy - 5} ${cx - 12} ${cy - 1} C${cx - 7} ${cy} ${cx - 3} ${cy - 1} ${cx} ${cy - 4} Z`} fill={OLIVE} />
      </g>
    </Art>
  );
}

/* ---------- 成长：能应对的世界变大 ---------- */

export function GrowthArt({ struggle = '' }: { struggle?: string }) {
  const cx = 160;
  const cy = 122;
  const label = struggle.trim() ? `「${clip(struggle.trim(), 14)}」` : '让你搞不定的那件事';
  return (
    <Art label="成长是能应对的世界变大了" caption="今天在圈外的事，90 天后会落进圈里。">
      <circle cx={cx} cy={cy} r={104} fill="none" stroke={SAND} strokeWidth={1.2} strokeDasharray="3 5" />
      <circle className="grow-pulse" cx={cx} cy={cy} r={60} fill="none" stroke={LEAF} strokeWidth={1.2} />
      <circle cx={cx} cy={cy} r={60} fill={PALE} stroke={FOREST} strokeWidth={2} />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize={13} fontWeight={700} fill={FOREST} style={serif}>现在</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize={11} fill={MUTED}>你能妥善应对的</text>
      <text x={cx} y={cy - 88} textAnchor="middle" fontSize={11} fill={MUTED}>90 天后</text>
      <defs>
        <Arrow id="growth-arrow" color={LEAF} />
      </defs>
      {[-140, -40, 20, 200].map((a, i) => {
        const t = (a * Math.PI) / 180;
        return (
          <line
            key={a}
            className="draw"
            pathLength={1}
            style={delay(0.3 + i * 0.15)}
            x1={cx + 66 * Math.cos(t)}
            y1={cy + 66 * Math.sin(t)}
            x2={cx + 92 * Math.cos(t)}
            y2={cy + 92 * Math.sin(t)}
            stroke={LEAF}
            strokeWidth={1.6}
            markerEnd="url(#growth-arrow)"
          />
        );
      })}
      <g className="fade" style={delay(0.8)}>
        <circle cx={cx} cy={cy + 84} r={6} fill={AMBER} />
        <circle className="ping" cx={cx} cy={cy + 84} r={6} fill="none" stroke={AMBER} strokeWidth={1.5} />
        <text x={cx} y={cy + 122} textAnchor="middle" fontSize={12} fontWeight={700} fill={INK} style={serif}>{label}</text>
      </g>
    </Art>
  );
}

/* ---------- 三层：认知、能力、心性，一棵树 ---------- */

const LAYER_LABELS: Array<{ key: LayerKey; name: string; desc: string; y: number }> = [
  { key: 'cognition', name: '认知', desc: '看世界的模型', y: 58 },
  { key: 'ability', name: '能力', desc: '能做成什么', y: 138 },
  { key: 'mind', name: '心性', desc: '压力下稳不稳', y: 214 },
];

export function LayersArt({ ratings = {} }: { ratings?: Partial<Record<LayerKey, number>> }) {
  const op = (k: LayerKey) => (ratings[k] ? 0.18 + 0.164 * ratings[k]! : 0.55);
  const cx = 118;
  return (
    <Art label="成长的三层：树冠是认知，树干是能力，树根是心性" caption="树冠是认知，树干是能力，树根是心性。颜色越深，是你给的分越高。">
      {/* 树根：心性 */}
      <g style={{ opacity: op('mind'), transition: 'opacity .4s' }}>
        {[
          `M${cx} 178 C${cx - 6} 196 ${cx - 30} 204 ${cx - 52} 226`,
          `M${cx} 178 C${cx + 4} 200 ${cx + 2} 216 ${cx - 6} 240`,
          `M${cx} 178 C${cx + 12} 194 ${cx + 34} 202 ${cx + 54} 222`,
          `M${cx - 18} 198 C${cx - 26} 210 ${cx - 22} 222 ${cx - 30} 234`,
          `M${cx + 22} 198 C${cx + 26} 212 ${cx + 22} 224 ${cx + 30} 236`,
        ].map((d, i) => (
          <path key={i} className="draw" pathLength={1} style={delay(0.1 * i)} d={d} fill="none" stroke={BARK} strokeWidth={i < 3 ? 4 : 2.4} strokeLinecap="round" />
        ))}
      </g>
      <line x1={36} y1={178} x2={206} y2={178} stroke={LINE} strokeWidth={1.2} />
      {/* 树干：能力 */}
      <path
        d={`M${cx - 11} 180 C${cx - 8} 150 ${cx - 13} 118 ${cx - 7} 92 L${cx + 7} 92 C${cx + 13} 118 ${cx + 8} 150 ${cx + 11} 180 Z`}
        fill={BARK}
        style={{ opacity: op('ability'), transition: 'opacity .4s' }}
      />
      {/* 树冠：认知 */}
      <g style={{ opacity: op('cognition'), transition: 'opacity .4s' }}>
        <circle cx={cx} cy={62} r={40} fill={LEAF} />
        <circle cx={cx - 34} cy={80} r={28} fill={LEAF} />
        <circle cx={cx + 34} cy={80} r={28} fill={LEAF} />
        <circle cx={cx - 10} cy={50} r={20} fill={FOREST} opacity={0.35} />
      </g>
      {LAYER_LABELS.map((l) => (
        <g key={l.key}>
          <line x1={l.key === 'cognition' ? cx + 60 : l.key === 'ability' ? cx + 16 : cx + 52} y1={l.y} x2={212} y2={l.y} stroke={MUTED} strokeWidth={0.7} strokeDasharray="2 2" />
          <circle cx={212} cy={l.y} r={2} fill={MUTED} />
          <text x={220} y={l.y - 2} fontSize={14} fontWeight={700} fill={INK} style={serif}>
            {l.name}
            {ratings[l.key] ? <tspan fill={FOREST} fontSize={13}>{`  ${ratings[l.key]}/5`}</tspan> : null}
          </text>
          <text x={220} y={l.y + 15} fontSize={11} fill={MUTED}>{l.desc}</text>
        </g>
      ))}
    </Art>
  );
}

/* ---------- 反馈循环 ---------- */

const LOOP_NODES: Array<{ key: StuckKey; label: string; a: number; app: string[] }> = [
  { key: 'action', label: '行动', a: -90, app: ['每天一件小事'] },
  { key: 'feedback', label: '反馈', a: 0, app: ['晚上', '30 秒回顾'] },
  { key: 'reflect', label: '反思', a: 90, app: ['每周复盘'] },
];

export function LoopArt({ stuck }: { stuck?: StuckKey }) {
  const cx = 160;
  const cy = 128;
  const r = 80;
  const P = (deg: number, rr = r) => [cx + rr * Math.cos((deg * Math.PI) / 180), cy + rr * Math.sin((deg * Math.PI) / 180)];
  const arc = (a: number) => {
    const [x0, y0] = P(a + 24);
    const [x1, y1] = P(a + 66);
    return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  };
  const nodes = [...LOOP_NODES, { key: 'adjust' as const, label: '调整', a: 180, app: ['系统自动', '调难度'] }];
  const broken = stuck === 'restart';
  return (
    <Art
      viewBox="-24 0 368 260"
      label="反馈循环：行动、反馈、反思、调整"
      caption={stuck ? <>你常卡在：<b>{labelOf(STUCK, stuck)}</b>。年轮在这一环替你接上。</> : '每一环，年轮里都有一个对应的设计。'}
    >
      <defs>
        <Arrow id="loop-a" />
        <Arrow id="loop-b" color={AMBER} />
      </defs>
      {nodes.map((n, i) => {
        const isBreak = broken && n.key === 'adjust';
        return (
          <path
            key={n.key}
            className={isBreak ? 'fade' : 'draw'}
            pathLength={1}
            style={delay(0.2 * i)}
            d={arc(n.a)}
            fill="none"
            stroke={isBreak ? AMBER : FOREST}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeDasharray={isBreak ? '0.06 0.05' : undefined}
            markerEnd={`url(#${isBreak ? 'loop-b' : 'loop-a'})`}
          />
        );
      })}
      {broken && (
        <text x={P(225, r + 26)[0]} y={P(225, r + 26)[1]} textAnchor="end" fontSize={11} fill={AMBER} fontWeight={700}>
          常在这里断开
        </text>
      )}
      {nodes.map((n) => {
        const [x, y] = P(n.a);
        const hot = stuck === n.key;
        // 应用里的对应设计：上下节点写在上下，左右节点写在外侧
        const side = n.a === 0 ? 'start' : n.a === 180 ? 'end' : 'middle';
        const ax = n.a === 0 ? x + 32 : n.a === 180 ? x - 32 : x;
        const ay = n.a === -90 ? y - 34 : n.a === 90 ? y + 42 : y - 2;
        return (
          <g key={n.label}>
            {hot && <circle className="ping" cx={x} cy={y} r={25} fill="none" stroke={AMBER} strokeWidth={1.5} />}
            <circle cx={x} cy={y} r={25} fill={hot ? '#F6E6CC' : PAPER} stroke={hot ? AMBER : FOREST} strokeWidth={hot ? 2.2 : 1.6} />
            <text x={x} y={y + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill={INK} style={serif}>{n.label}</text>
            <text x={ax} y={ay} textAnchor={side} fontSize={10.5} fill={hot ? AMBER : MUTED} fontWeight={hot ? 700 : 400}>
              {n.app.map((t, i) => (
                <tspan key={t} x={ax} dy={i ? 14 : 0}>{t}</tspan>
              ))}
            </text>
          </g>
        );
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize={11} fill={MUTED}>成长速度 ≈</text>
      <text x={cx} y={cy + 13} textAnchor="middle" fontSize={12} fontWeight={700} fill={FOREST} style={serif}>次数 × 质量</text>
    </Art>
  );
}

/* ---------- 学习区 ---------- */

export function ZoneArt({ persistence }: { persistence?: PersistenceKey }) {
  const cx = 160;
  const cy = 122;
  const P = (deg: number, rr: number) => [cx + rr * Math.cos((deg * Math.PI) / 180), cy + rr * Math.sin((deg * Math.PI) / 180)];
  const past = persistence === 'days' || persistence === 'weeks' ? P(-35, 94) : persistence === 'long' ? P(-35, 22) : null;
  const [sx, sy] = P(150, 58);
  return (
    <Art label="舒适区、学习区、恐慌区" caption="舒适区学不到，恐慌区只剩焦虑。成长只发生在中间那一圈。">
      <circle cx={cx} cy={cy} r={110} fill="#F6EEE0" stroke={SAND} strokeWidth={1} strokeDasharray="3 4" />
      <circle cx={cx} cy={cy} r={76} fill={PALE} stroke={FOREST} strokeWidth={2.4} />
      <circle cx={cx} cy={cy} r={38} fill={PAPER} stroke={LINE} strokeWidth={1} />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={12} fill={MUTED}>舒适区</text>
      <text x={cx} y={cy - 52} textAnchor="middle" fontSize={15} fontWeight={700} fill={FOREST} style={serif}>学习区</text>
      <text x={cx} y={cy - 88} textAnchor="middle" fontSize={12} fill="#9A8A66">恐慌区</text>
      {past && (
        <g className="fade">
          <path d={`M${past[0] - 6} ${past[1] - 6} L${past[0] + 6} ${past[1] + 6} M${past[0] + 6} ${past[1] - 6} L${past[0] - 6} ${past[1] + 6}`} stroke={AMBER} strokeWidth={2.4} strokeLinecap="round" />
          <text x={past[0] + 10} y={past[1] - 10} fontSize={11} fontWeight={700} fill={AMBER}>
            {persistence === 'long' ? '容易停在这里' : '以前的目标'}
          </text>
        </g>
      )}
      <g className="fade" style={delay(0.4)}>
        <circle cx={sx} cy={sy} r={6} fill={FOREST} />
        <circle className="ping" cx={sx} cy={sy} r={6} fill="none" stroke={FOREST} strokeWidth={1.5} />
        <text x={cx} y={252} textAnchor="middle" fontSize={11.5} fill={INK}>
          <tspan fill={FOREST}>●</tspan> 这一次：从最小一步开始，系统让你一直待在这一圈
        </text>
      </g>
    </Art>
  );
}

/* ---------- 复利 ---------- */

export function CompoundArt() {
  const x0 = 40;
  const y0 = 210;
  const w = 250;
  const steady = Array.from({ length: 41 }, (_, i) => {
    const t = i / 40;
    return `${(x0 + t * w).toFixed(1)},${(y0 - 150 * Math.pow(t, 2.6)).toFixed(1)}`;
  }).join(' ');
  const burst = `${x0},${y0} ${x0 + 18},${y0 - 46} ${x0 + 30},${y0 - 52} ${x0 + 42},${y0 - 20} ${x0 + 70},${y0 - 8} ${x0 + w},${y0 - 8}`;
  return (
    <Art label="复利：每天一点，前期看不到，之后加速" caption="连续性比强度更重要。年轮只算累计，不算连续。">
      <line x1={x0} y1={y0} x2={x0 + w + 10} y2={y0} stroke={LINE} strokeWidth={1.2} />
      <line x1={x0} y1={y0} x2={x0} y2={40} stroke={LINE} strokeWidth={1.2} />
      <text x={x0 + w + 10} y={y0 + 18} textAnchor="end" fontSize={11} fill={MUTED}>时间</text>
      <line x1={x0 + w * 0.62} y1={y0} x2={x0 + w * 0.62} y2={60} stroke={LINE} strokeDasharray="2 3" />
      <text x={x0 + w * 0.62} y={y0 + 18} textAnchor="middle" fontSize={11} fill={MUTED}>临界点</text>
      <polyline className="fade" points={burst} fill="none" stroke={AMBER} strokeWidth={2} strokeDasharray="4 3" />
      <polyline className="draw" pathLength={1} style={delay(0.3)} points={steady} fill="none" stroke={FOREST} strokeWidth={3} strokeLinecap="round" />
      <text x={x0 + 58} y={y0 - 58} fontSize={11} fill={AMBER}>热血一周，停三个月</text>
      <text x={x0 + w - 4} y={56} textAnchor="end" fontSize={12} fontWeight={700} fill={FOREST} style={serif}>每天一点</text>
    </Art>
  );
}

/* ---------- 能量底座 ---------- */

export function EnergyArt({ energy }: { energy?: Energy }) {
  const cx = 160;
  const color = energy ? ENERGY_COLORS[energy] : LINE;
  const h = 34 + (energy ?? 3) * 16;
  const top = 160 - h;
  const blocks = ['专注', '情绪', '睡眠'];
  return (
    <Art label="能量是底座：睡眠、情绪、专注" caption={energy ? `你说最近一周的状态是 ${energy} / 5。底座稳，才长得高。` : '底座稳，才长得高。再好的方法，也需要能量来执行。'}>
      {blocks.map((b, i) => {
        const y = 164 + i * 28;
        const w = 140 + i * 30;
        return (
          <g key={b}>
            <rect x={cx - w / 2} y={y} width={w} height={24} rx={8} fill={color} opacity={0.35 + i * 0.2} style={{ transition: 'fill .4s' }} />
            <text x={cx} y={y + 16} textAnchor="middle" fontSize={12} fontWeight={700} fill={INK} style={serif}>{b}</text>
          </g>
        );
      })}
      <g style={{ transition: 'transform .5s' }}>
        <path d={`M${cx} 164 C${cx - 2} ${164 - h / 2} ${cx + 3} ${top + 20} ${cx} ${top}`} fill="none" stroke={FOREST} strokeWidth={3} strokeLinecap="round" />
        <path d={`M${cx} ${top + 14} C${cx + 18} ${top - 4} ${cx + 32} ${top + 6} ${cx + 30} ${top + 14} C${cx + 18} ${top + 20} ${cx + 8} ${top + 18} ${cx} ${top + 14} Z`} fill={LEAF} />
        <path d={`M${cx} ${top + 34} C${cx - 18} ${top + 18} ${cx - 32} ${top + 26} ${cx - 30} ${top + 34} C${cx - 18} ${top + 40} ${cx - 8} ${top + 38} ${cx} ${top + 34} Z`} fill={OLIVE} />
        {(energy ?? 3) >= 4 && <circle cx={cx} cy={top - 6} r={6} fill={AMBER} />}
      </g>
    </Art>
  );
}

/* ---------- 环境设计 ---------- */

export function EnvironmentArt() {
  return (
    <Art label="环境设计：让好行为更容易发生" caption="与其每天对抗环境，不如设计环境。">
      <defs>
        <Arrow id="env-a" />
        <Arrow id="env-b" color={AMBER} />
      </defs>
      <circle cx={40} cy={130} r={8} fill={INK} />
      <text x={40} y={156} textAnchor="middle" fontSize={12} fontWeight={700} fill={INK} style={serif}>想做</text>
      <circle cx={280} cy={130} r={8} fill={FOREST} />
      <text x={280} y={156} textAnchor="middle" fontSize={12} fontWeight={700} fill={FOREST} style={serif}>做到</text>
      <path
        className="fade"
        d="M48 124 L80 60 L104 110 L132 44 L160 104 L188 40 L214 98 L242 56 L272 122"
        fill="none"
        stroke={AMBER}
        strokeWidth={2}
        strokeDasharray="4 3"
        markerEnd="url(#env-b)"
      />
      <text x={160} y={24} textAnchor="middle" fontSize={11.5} fill={AMBER}>靠意志力：每一次都要跟自己较劲</text>
      <path className="draw" pathLength={1} style={delay(0.4)} d="M48 136 C110 190 210 190 272 136" fill="none" stroke={FOREST} strokeWidth={3} markerEnd="url(#env-a)" />
      <g className="fade" style={delay(0.8)}>
        <rect x={86} y={166} width={58} height={22} rx={11} fill={PALE} stroke={FOREST} />
        <text x={115} y={181} textAnchor="middle" fontSize={11} fill={FOREST}>触发情境</text>
        <rect x={178} y={166} width={58} height={22} rx={11} fill={PALE} stroke={FOREST} />
        <text x={207} y={181} textAnchor="middle" fontSize={11} fill={FOREST}>环境提示</text>
        <text x={160} y={226} textAnchor="middle" fontSize={11.5} fill={FOREST}>设计过的环境：到了那个时刻，顺手就做了</text>
      </g>
    </Art>
  );
}

/* ---------- 心性：失败是数据 ---------- */

export function MindArt({ selfTalk }: { selfTalk?: SelfTalkKey }) {
  const xs = [36, 72, 108, 144, 180, 216, 252, 288];
  const ys = [190, 180, 176, 206, 170, 160, 148, 136];
  const missIdx = 3;
  const phrase = selfTalk ? labelOf(SELF_TALK, selfTalk).replace(/[“”]/g, '') : '我又失败了';
  const kind = selfTalk === 'curious' ? 'good' : 'judge';
  return (
    <Art label="失败是数据，不是判决" caption="没做到的那一天，不是一个污点，是一个让系统变准的数据点。">
      <line x1={24} y1={226} x2={300} y2={226} stroke={LINE} strokeWidth={1.2} />
      <polyline className="draw" pathLength={1} points={xs.map((x, i) => `${x},${ys[i]}`).join(' ')} fill="none" stroke={LEAF} strokeWidth={2} />
      {xs.map((x, i) =>
        i === missIdx ? (
          <circle key={i} cx={x} cy={ys[i]} r={7} fill={PAPER} stroke={AMBER} strokeWidth={2.2} />
        ) : (
          <circle key={i} cx={x} cy={ys[i]} r={5} fill={i > missIdx ? FOREST : LEAF} />
        ),
      )}
      {/* 对自己说的话 */}
      <g className="fade" style={delay(0.5)}>
        <rect x={60} y={44} width={168} height={34} rx={17} fill={kind === 'good' ? PALE : '#F6E6CC'} stroke={kind === 'good' ? FOREST : AMBER} />
        <path d={`M${xs[missIdx] - 6} 78 L${xs[missIdx]} 92 L${xs[missIdx] + 6} 78`} fill={kind === 'good' ? PALE : '#F6E6CC'} stroke={kind === 'good' ? FOREST : AMBER} />
        <text x={144} y={66} textAnchor="middle" fontSize={12} fontWeight={700} fill={INK} style={serif}>{`“${clip(phrase, 12)}”`}</text>
        {kind === 'judge' && <line x1={72} y1={61} x2={216} y2={61} stroke={AMBER} strokeWidth={1.6} />}
      </g>
      <g className="fade" style={delay(1)}>
        <text x={xs[missIdx] + 12} y={ys[missIdx] + 22} fontSize={11.5} fontWeight={700} fill={FOREST}>换成：是什么原因？</text>
        <text x={xs[6]} y={ys[6] - 16} textAnchor="middle" fontSize={11} fill={FOREST}>调整之后</text>
      </g>
    </Art>
  );
}

/* ---------- 起步设置：执行系统和难度阶梯 ---------- */

export function SystemArt({ trigger, first, environment }: { trigger: string; first: string; environment: string }) {
  const rows = [
    { k: '在这个时刻', v: trigger || '触发情境', y: 34 },
    { k: '我就做', v: first || '最小行为，2 分钟内', y: 112 },
    { k: '环境帮我一把', v: environment || '一条环境调整（可选）', y: 190 },
  ];
  return (
    <Art label="执行系统：触发情境、最小行为、环境调整" caption="不靠意志力，靠一个到点就会发生的小系统。">
      <defs>
        <Arrow id="sys-a" />
      </defs>
      {rows.map((r, i) => (
        <g key={r.k}>
          <rect x={30} y={r.y} width={260} height={52} rx={16} fill={i === 1 ? PALE : PAPER} stroke={i === 1 ? FOREST : LINE} strokeWidth={i === 1 ? 2 : 1} strokeDasharray={i === 2 ? '4 3' : undefined} />
          <text x={48} y={r.y + 20} fontSize={11} fill={MUTED}>{r.k}</text>
          <text x={48} y={r.y + 40} fontSize={14} fontWeight={700} fill={INK} style={serif}>{clip(r.v, 16)}</text>
          {i < 2 && <line x1={160} y1={r.y + 54} x2={160} y2={r.y + 74} stroke={FOREST} strokeWidth={1.6} markerEnd="url(#sys-a)" />}
        </g>
      ))}
    </Art>
  );
}

export function LadderArt({ ladder, level = 1 }: { ladder: string[]; level?: Level }) {
  return (
    <Art label="五级难度阶梯" caption="你从 L1 开始。系统根据每天的反馈，一级一级往上加。">
      {ladder.map((text, i) => {
        const lv = (i + 1) as Level;
        const x = 20 + i * 24;
        const y = 214 - i * 42;
        const on = lv === level;
        return (
          <g key={i}>
            <rect x={x} y={y} width={56} height={26} rx={6} fill={on ? FOREST : lv < level ? LEAF : PALE} opacity={lv < level ? 0.7 : 1} />
            <text x={x + 28} y={y + 17} textAnchor="middle" fontSize={12} fontWeight={700} fill={on || lv < level ? PAPER : FOREST}>
              L{lv}
            </text>
            <text x={x + 66} y={y + 11} fontSize={10.5} fill={MUTED}>{STAGES[lv]}</text>
            <text x={x + 66} y={y + 27} fontSize={13} fontWeight={on ? 700 : 500} fill={text ? INK : LINE} style={serif}>
              {clip(text || '还没写', 9)}
            </text>
          </g>
        );
      })}
    </Art>
  );
}
