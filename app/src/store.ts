import { useSyncExternalStore } from 'react'

type S = { jamesCalled: boolean; showCue: boolean }
let state: S = { jamesCalled: false, showCue: false }
const subs = new Set<() => void>()
export const setDemo = (p: Partial<S>) => { state = { ...state, ...p }; subs.forEach((f) => f()) }
export const getDemo = () => state
export const useDemo = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f) }, () => state)
