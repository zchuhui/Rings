'use client';

import { useSyncExternalStore } from 'react';
import { getState, subscribe } from './store';
import type { AppState } from './types';

/** 服务端渲染时没有 localStorage，先返回 null，挂载后再读 */
export function useAppState(): AppState | null {
  return useSyncExternalStore(subscribe, getState, () => null);
}
