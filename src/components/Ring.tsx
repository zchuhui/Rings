import type { ReactNode } from 'react';
import { buildRing, ENERGY_COLORS, polar, type RingGeometry } from '@/lib/ring';
import type { Energy, Entry } from '@/lib/types';

const GEO: RingGeometry = { cx: 150, cy: 150, r0: 46, gap: 7.5 };

/**
 * 数据年轮：一圈一周，一段一天。
 * highlightDate：刚刚刻下的那一天，会加粗发光并带一条“今天这一道”的标注。
 */
export function Ring({
  entries,
  startDate,
  today,
  highlightDate,
  showOuter = false,
  children,
}: {
  entries: Entry[];
  startDate: string;
  today: string;
  highlightDate?: string;
  showOuter?: boolean;
  children?: ReactNode;
}) {
  const p = buildRing(entries, startDate, today, GEO, highlightDate);

  let callout: ReactNode = null;
  if (p.highlightPoint) {
    const inner = polar(GEO, Math.hypot(p.highlightPoint[0] - GEO.cx, p.highlightPoint[1] - GEO.cy) + 6, p.highlightAngle);
    const outer = polar(GEO, 124, p.highlightAngle);
    const left = outer[0] < GEO.cx;
    const ex = outer[0] + (left ? -28 : 28);
    callout = (
      <g>
        <path d={`M${inner[0]} ${inner[1]} L${outer[0]} ${outer[1]} L${ex} ${outer[1]}`} fill="none" stroke="#1C1B17" strokeWidth={0.8} />
        <circle cx={inner[0]} cy={inner[1]} r={2} fill="#1C1B17" />
        <text
          x={ex + (left ? -4 : 4)}
          y={outer[1] + 4}
          textAnchor={left ? 'end' : 'start'}
          style={{ fontFamily: 'var(--serif-cn)' }}
          fontSize={12}
          fontWeight={700}
          fill="#1C1B17"
        >
          今天这一道
        </text>
      </g>
    );
  }

  return (
    <div className="ring">
      <svg viewBox="0 0 300 300" aria-hidden="true">
        <path d={p.guides} fill="none" stroke="#D3CBBB" strokeWidth={0.6} strokeDasharray="1 3" />
        <path
          d={p.outer}
          fill="none"
          stroke={showOuter ? '#BFB6A3' : '#D3CBBB'}
          strokeWidth={showOuter ? 1.1 : 0.6}
          strokeDasharray={showOuter ? undefined : '1 3'}
        />
        {([1, 2, 3, 4, 5] as Energy[]).map((k) => (
          <path key={k} d={p.energy[k]} fill="none" stroke={ENERGY_COLORS[k]} strokeWidth={5} strokeLinecap="round" />
        ))}
        <path d={p.partial} fill="none" stroke="#8F8A7C" strokeWidth={2} strokeLinecap="round" />
        <path d={p.rest} fill="#B5AD9C" />
        {p.today && (
          <path className="ring-today" d={p.today} fill="none" stroke="#1C1B17" strokeWidth={2.2} strokeLinecap="round" strokeDasharray="2 4" />
        )}
        {p.highlight && (
          <>
            <path d={p.highlight} fill="none" stroke={p.highlightColor} strokeWidth={12} strokeLinecap="round" opacity={0.22} />
            <path d={p.highlight} fill="none" stroke={p.highlightColor} strokeWidth={6} strokeLinecap="round" />
          </>
        )}
        {callout}
      </svg>
      {children && <div className="ring-center">{children}</div>}
    </div>
  );
}

export function RingLegend({ withToday = false }: { withToday?: boolean }) {
  return (
    <div className="legend">
      <span>
        {([1, 2, 3, 4, 5] as Energy[]).map((k) => (
          <i key={k} style={{ width: 14, height: 6, borderRadius: 3, background: ENERGY_COLORS[k], display: 'inline-block' }} />
        ))}
        状态 低→高
      </span>
      <span><i style={{ width: 10, height: 2, background: '#8F8A7C', display: 'inline-block' }} />一部分</span>
      <span><i style={{ width: 5, height: 5, borderRadius: 3, background: '#B5AD9C', display: 'inline-block' }} />休息</span>
      {withToday && <span><i style={{ width: 14, borderTop: '2px dashed #1C1B17', display: 'inline-block' }} />今天</span>}
    </div>
  );
}
