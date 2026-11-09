/**
 * 「回环新芽」logo：一根线从中心绕出一圈半，再顺势向上长成嫩芽。
 */

const f = (n: number) => n.toFixed(2);

function buildSpiral() {
  const cx = 50;
  const cy = 74;
  const r1 = 32;
  const turns = 1.75;
  const th0 = turns * 2 * Math.PI;
  let d = '';
  for (let i = 0; i <= 240; i++) {
    const t = i / 240;
    const th = th0 - t * turns * 2 * Math.PI;
    const r = 3 + (r1 - 3) * Math.pow(t, 0.9);
    d += `${i ? ' L' : 'M'}${f(cx + r * Math.cos(th))} ${f(cy + r * Math.sin(th))}`;
  }
  const ex = cx + r1;
  const ey = cy;
  return {
    spiral: d,
    stem: `M${f(ex)} ${f(ey)} C ${f(ex)} ${f(ey - 16)}, ${f(ex - 1)} ${f(ey - 30)}, ${f(ex - 5)} ${f(ey - 44)}`,
    leafA: `translate(${f(ex - 5)} ${f(ey - 44)}) rotate(-140)`,
    leafB: `translate(${f(ex - 1.5)} ${f(ey - 29)}) rotate(-28)`,
  };
}

const MARK = buildSpiral();

export function LogoMark({
  size = 28,
  line = '#1C1B17',
  leafA = '#4F9A62',
  leafB = '#1F6B4A',
  title,
}: {
  size?: number;
  line?: string;
  leafA?: string;
  leafB?: string;
  title?: string;
}) {
  const sw = size < 40 ? 9 : 6.5;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <path d={MARK.spiral} fill="none" stroke={line} strokeWidth={sw} strokeLinecap="round" />
      <path d={MARK.stem} fill="none" stroke={line} strokeWidth={sw} strokeLinecap="round" />
      <path d="M0 0 C 6 -9, 19 -10, 26 0 C 19 10, 6 9, 0 0 Z" fill={leafA} transform={MARK.leafA} />
      <path d="M0 0 C 5 -8, 16 -8, 22 0 C 16 8, 5 8, 0 0 Z" fill={leafB} transform={MARK.leafB} />
    </svg>
  );
}
