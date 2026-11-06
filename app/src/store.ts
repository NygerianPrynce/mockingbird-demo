import { useSyncExternalStore } from 'react'

type S = { jamesCalled: boolean; showCue: boolean; pendingDial: boolean; startedAt: number | null }
let state: S = { jamesCalled: false, showCue: false, pendingDial: false, startedAt: null }
const subs = new Set<() => void>()
export const setDemo = (p: Partial<S>) => { state = { ...state, ...p }; subs.forEach((f) => f()) }
export const getDemo = () => state
export const useDemo = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f) }, () => state)
