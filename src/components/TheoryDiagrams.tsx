/** 理论介绍里的两张小图，沿用年轮的线条语言 */

const INK = '#1C1B17';
const FOREST = '#1F6B4A';

export function LoopDiagram() {
  const cx = 130;
  const cy = 100;
  const r = 66;
  const nodes = [
    { a: -90, label: '行动' },
    { a: 0, label: '反馈' },
    { a: 90, label: '反思' },
    { a: 180, label: '调整' },
  ];
  const P = (deg: number, rr = r) => [cx + rr * Math.cos((deg * Math.PI) / 180), cy + rr * Math.sin((deg * Math.PI) / 180)];
  const arcs = nodes.map((n) => {
    const [x0, y0] = P(n.a + 20);
    const [x1, y1] = P(n.a + 70);
    return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  });
  return (
    <figure className="diagram" aria-label="反馈循环：行动、反馈、反思、调整，再回到行动">
      <svg viewBox="0 0 260 200" role="img" aria-hidden="true">
        <defs>
          <marker id="loop-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill={FOREST} />
          </marker>
        </defs>
        {arcs.map((d, i) => (
          <path key={i} d={d} fill="none" stroke={FOREST} strokeWidth={2.4} strokeLinecap="round" markerEnd="url(#loop-arrow)" />
        ))}
        {nodes.map((n) => {
          const [x, y] = P(n.a);
          return (
            <text key={n.label} x={x} y={y + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill={INK} style={{ fontFamily: 'var(--serif-cn)' }}>
              {n.label}
            </text>
          );
        })}
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize={11} fill="#6B675C">
          再行动
        </text>
      </svg>
      <figcaption>成长速度 ≈ 循环次数 × 每次循环的质量</figcaption>
    </figure>
  );
}

export function ZoneDiagram() {
  const cx = 130;
  const cy = 100;
  return (
    <figure className="diagram" aria-label="三个区域：舒适区在内，学习区在中间，恐慌区在外">
      <svg viewBox="0 0 260 200" role="img" aria-hidden="true">
        <circle cx={cx} cy={cy} r={92} fill="none" stroke="#C8B48E" strokeWidth={1} strokeDasharray="2 4" />
        <circle cx={cx} cy={cy} r={64} fill="#E8EFE2" stroke={FOREST} strokeWidth={2.4} />
        <circle cx={cx} cy={cy} r={34} fill="#F3EFE6" stroke="#BFB6A3" strokeWidth={1} />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize={12} fill="#6B675C">舒适区</text>
        <text x={cx} y={cy - 44} textAnchor="middle" fontSize={14} fontWeight={700} fill={FOREST} style={{ fontFamily: 'var(--serif-cn)' }}>
          学习区
        </text>
        <text x={cx} y={cy + 84} textAnchor="middle" fontSize={12} fill="#9A8A66">恐慌区</text>
      </svg>
      <figcaption>年轮的五级阶梯，就是为了让你一直待在中间这一圈</figcaption>
    </figure>
  );
}
