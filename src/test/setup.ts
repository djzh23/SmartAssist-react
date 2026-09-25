import '@testing-library/jest-dom/vitest'
import { JSDOM } from 'jsdom'

// Node 22+ defines its own global localStorage/sessionStorage (broken without
// --localstorage-file). vitest's jsdom environment only installs its own Storage implementation
// for globals that do not already exist, so on affected Node versions the broken native one wins
// the slot before vitest ever gets a chance to replace it - and in this environment
// `window === globalThis`, so `window.localStorage` is the very same broken property, not a
// hidden working one underneath (confirmed: the property already has a getter/setter pair,
// `configurable: true`, so a plain reassignment just calls the broken setter with the broken
// value and changes nothing).
//
// Fix: build a throwaway, fully separate JSDOM window purely to source a genuinely working
// Storage implementation, then replace the property descriptor outright (not just assign through
// the existing getter/setter) so the broken one is fully discarded. This does not depend on any
// Node version, OS, or NODE_OPTIONS allowlist - it only depends on jsdom itself, which this
// project already needs for its own environment.
const storageSource = new JSDOM('', { url: 'http://localhost' }).window
for (const key of ['localStorage', 'sessionStorage'] as const) {
  Object.defineProperty(globalThis, key, {
    value: storageSource[key],
    configurable: true,
    writable: true,
  })
}
