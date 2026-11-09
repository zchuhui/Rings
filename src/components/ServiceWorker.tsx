'use client';

import { useEffect } from 'react';

/** 生产环境注册离线缓存；开发时不注册，避免旧缓存干扰热更新 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // 非安全上下文（例如局域网 http）无法注册，不影响使用
    });
  }, []);
  return null;
}
