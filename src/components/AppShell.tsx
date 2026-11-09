'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { shortLabel, todayStr } from '@/lib/dates';
import { LogoMark } from './Logo';

const TABS = [
  { href: '/', label: '今日' },
  { href: '/weekly', label: '复盘' },
  { href: '/rings', label: '年轮' },
  { href: '/plan', label: '我的' },
];

/** 起步设置和晚间回顾是专注流程，不显示导航 */
const FOCUS_ROUTES = ['/onboarding', '/checkin'];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const focus = FOCUS_ROUTES.some((r) => pathname.startsWith(r));

  return (
    <div className="shell">
      <header className="topbar">
        <Link href="/" className="brand" aria-label="年轮 首页">
          <LogoMark size={28} />
          <span className="brand-name">
            年轮 <span className="brand-en">Rings</span>
          </span>
        </Link>
        {!focus && (
          <nav className="nav" aria-label="主导航">
            {TABS.map((t) => (
              <Link key={t.href} href={t.href} aria-current={pathname === t.href ? 'page' : undefined}>
                {t.label}
              </Link>
            ))}
          </nav>
        )}
        <div className="topbar-right">
          <span suppressHydrationWarning>{shortLabel(todayStr())}</span>
        </div>
      </header>
      <main className={focus ? 'main bare' : 'main'}>{children}</main>
    </div>
  );
}
