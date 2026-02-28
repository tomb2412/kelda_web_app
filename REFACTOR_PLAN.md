# Kelder Web App — Performance Refactor Plan

**Branch**: `perf/refactor-polling-and-structure`
**Date**: 2026-02-28

---

## Executive Summary

The app has three critical problem areas:

1. **11 concurrent polling timers** fire simultaneously every 2 seconds, creating a constant stream of ~5 HTTP requests/sec even when data hasn't changed. This is the primary performance issue.
2. **Zero memoization** outside of `wind_rose.jsx` means every state update triggers a full re-render cascade.
3. **Dead code and structural mess** — 5 unused/broken components, a misspelled folder name, an empty `api/` directory, and hardcoded refresh rates scattered across components.

This plan addresses all three in sequenced phases that can be implemented and tested independently. All changes are **client-side only** — no modifications to `server.js` or the onboard port 8000 service are required.

---

## Phase 1 — Repo Cleanup (No-Risk, Do First)

Before touching any logic, clean up the repo so subsequent work is easier.

### 1.1 — Delete dead components

The following files are never rendered and serve no purpose. Two are broken (undefined variable references):

| File | Reason to delete |
|------|-----------------|
| `src/componants/board.jsx` | Never rendered. References undefined variable — broken. |
| `src/componants/input.jsx` | Never rendered. |
| `src/componants/timer.jsx` | Never rendered. |
| `src/componants/log.jsx` | Never rendered. References undefined `gpsData` — broken. |
| `src/componants/gauge.jsx` | Never rendered. Static 40% demo only. |

Also remove their dead imports from `App.jsx` (Input, Board, Guage, Log).

### 1.2 — Fix the folder name typo

Rename `src/componants/` → `src/components/`. Update all import paths.

### 1.3 — Remove or populate the empty `api/` directory

The top-level `api/` folder is empty. Either delete it or document its intended purpose.

### 1.4 — Strip all `console.log` statements from production code

19 console.log calls were found across the codebase. Remove them all. If debug output is needed in development, gate it behind `import.meta.env.DEV`.

```js
// Replace this pattern:
console.log("depth data:", data);

// With:
if (import.meta.env.DEV) console.log("depth data:", data);
```

### 1.5 — Centralise the polling interval

Currently, `API_REFRESH_RATE` is respected in `gps.jsx` but hardcoded to `2000` in every other component. Create a single constant:

```js
// src/config/constants.js
export const POLL_INTERVAL_MS = Number(import.meta.env.VITE_API_REFRESH_RATE ?? 2000);
export const SLOW_POLL_INTERVAL_MS = 10_000; // passage plan
```

---

## Phase 2 — Shared Polling Context (Highest Impact, No Backend Changes)

**This is the most impactful change.** The root problem is not that the app polls — it's that every component polls independently. `depth.jsx` alone runs 4 separate `setInterval` timers against 4 different endpoints. All 8 components combined run 11 concurrent timers.

The fix is to centralise all polling into a single React context. One interval fires, all endpoints are fetched in parallel with `Promise.allSettled`, and every component reads from shared state. The port 8000 service and `server.js` are untouched.

### 2.1 — Architecture

```
Before:
  GpsDisplay     → setInterval → GET /gps_card_data      (every 2s)
  WindRose       → setInterval → GET /compass_heading     (every 2s)
  DepthGuage     → setInterval → GET /get_next_tidal_event (every 2s)
  DepthGuage     → setInterval → GET /get_height_of_tide  (every 2s)
  DepthGuage     → setInterval → GET /bilge_depth         (every 2s)
  DepthGuage     → setInterval → GET /journeys/latest     (every 2s)
  Header         → setInterval → GET /vessel_state        (every 2s)
  PassagePlan    → setInterval → GET /passage_plan        (every 10s)
  Map            → setInterval → GET /gps_map_position    (every 2s)
  = 11 timers, ~5.5 req/s

After:
  SensorDataProvider → setInterval → GET all fast endpoints in parallel (every 2s)
                     → setInterval → GET /passage_plan                  (every 10s)
  All components read from context
  = 2 timers, ~0.5 req/s
```

### 2.2 — Implementation: `SensorDataContext`

```jsx
// src/context/SensorDataContext.jsx
import { createContext, useContext, useEffect, useReducer } from 'react';
import axios from 'axios';
import { buildApiPath } from '../config/api';
import { POLL_INTERVAL_MS, SLOW_POLL_INTERVAL_MS } from '../config/constants';

const SensorDataContext = createContext(null);

const initialState = {
  gps: null,
  compass: null,
  vessel: null,
  tidal: null,
  tide: null,
  bilge: null,
  journey: null,
  gpsPosition: null,
  passagePlan: null,
};

function reducer(state, { type, payload }) {
  if (type === 'UPDATE') return { ...state, ...payload };
  return state;
}

// Endpoints polled every POLL_INTERVAL_MS
const FAST_ENDPOINTS = [
  ['gps',         '/gps_card_data'],
  ['compass',     '/compass_heading'],
  ['vessel',      '/vessel_state'],
  ['tidal',       '/get_next_tidal_event'],
  ['tide',        '/get_height_of_tide'],
  ['bilge',       '/bilge_depth'],
  ['journey',     '/journeys/latest'],
  ['gpsPosition', '/gps_map_position'],
];

export function SensorDataProvider({ children }) {
  const [data, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    async function fetchFast() {
      const results = await Promise.allSettled(
        FAST_ENDPOINTS.map(([, path]) => axios.get(buildApiPath(path)))
      );
      const payload = {};
      results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          payload[FAST_ENDPOINTS[i][0]] = result.value.data;
        }
      });
      dispatch({ type: 'UPDATE', payload });
    }

    async function fetchSlow() {
      try {
        const res = await axios.get(buildApiPath('/passage_plan'));
        dispatch({ type: 'UPDATE', payload: { passagePlan: res.data } });
      } catch {
        // swallow — stale data stays in state
      }
    }

    fetchFast();
    fetchSlow();

    const fastTimer = setInterval(fetchFast, POLL_INTERVAL_MS);
    const slowTimer = setInterval(fetchSlow, SLOW_POLL_INTERVAL_MS);

    return () => {
      clearInterval(fastTimer);
      clearInterval(slowTimer);
    };
  }, []);

  return (
    <SensorDataContext.Provider value={data}>
      {children}
    </SensorDataContext.Provider>
  );
}

export function useSensorData(key) {
  const ctx = useContext(SensorDataContext);
  if (!ctx) throw new Error('useSensorData must be used within SensorDataProvider');
  return ctx[key];
}
```

### 2.3 — Wire the provider into the app

```jsx
// main.jsx
<StrictMode>
  <ThemeProvider>
    <ClerkProvider publishableKey={...}>
      <SensorDataProvider>   {/* ← add this */}
        <Header />
        <App />
      </SensorDataProvider>
    </ClerkProvider>
  </ThemeProvider>
</StrictMode>
```

### 2.4 — Migrate each component

Each component replaces its `useEffect`/`setInterval`/`axios` block with a single `useSensorData` call. The component becomes purely presentational.

| Component | Remove | Replace with |
|-----------|--------|--------------|
| `header.jsx` | `setInterval` → GET `/vessel_state` | `useSensorData('vessel')` |
| `gps.jsx` | `setInterval` → GET `/gps_card_data` | `useSensorData('gps')` |
| `wind_rose.jsx` | `setInterval` → GET `/compass_heading` | `useSensorData('compass')` |
| `depth.jsx` | 4× `setInterval` → 4 endpoints | `useSensorData('tidal')`, `useSensorData('tide')`, `useSensorData('bilge')`, `useSensorData('journey')` |
| `passagePlan.jsx` | `setInterval` → GET `/passage_plan` | `useSensorData('passagePlan')` |
| `map.jsx` | `setInterval` → GET `/gps_map_position` | `useSensorData('gpsPosition')` |

Before (in `gps.jsx`):
```js
const [data, setData] = useState(null);
useEffect(() => {
  const id = setInterval(() =>
    axios.get(buildApiPath('/gps_card_data')).then(r => setData(r.data)),
    API_REFRESH_RATE
  );
  return () => clearInterval(id);
}, []);
```

After:
```js
const data = useSensorData('gps');
```

`windGraphBarb.jsx` fetches from the **external Open-Meteo API** on a 1-hour interval. This is appropriate and stays unchanged.

### 2.5 — Handle null state (before first fetch)

Components currently assume data is available immediately. Add a null guard at the top of each component's render:

```jsx
const data = useSensorData('gps');
if (!data) return <div className="animate-pulse ...">Loading</div>;
```

---

## Phase 3 — Upgrade to React 19

React 19.2.4 is the latest stable release. The main benefit for this codebase is access to the **React Compiler**, which automatically inserts memoization, eliminating the need to manually audit every component for `useMemo`/`useCallback`/`React.memo`.

### 3.1 — Compatibility check

| Dependency | React 19 support | Notes |
|------------|-----------------|-------|
| `@clerk/clerk-react` | ✅ Explicit | Supports `~19.2.3` in peer deps |
| `highcharts-react-official` | ✅ Works | Peer dep is `>=16.8.0` |
| `@ai-sdk/react` | ✅ Works | Designed for React 18/19 |
| `react-simple-maps` | ⚠️ Implicit | Peer dep stops at `18.x` but no breaking API — test carefully after upgrade |
| `react-toggle` | ⚠️ Unmaintained | Last release 2021. Replace with a Tailwind component (see Phase 5) |
| `react-markdown` | ✅ Works | No React version restrictions |

### 3.2 — Upgrade steps

```bash
cd kelder-web-app

# Core upgrade
npm install react@^19.2.4 react-dom@^19.2.4

# Update types to match
npm install -D @types/react@^19 @types/react-dom@^19

# Install React Compiler
npm install -D babel-plugin-react-compiler
```

### 3.3 — React Compiler setup

Add to `vite.config.js`:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
    tailwindcss(),
  ],
});
```

The React Compiler statically analyses component code and automatically inserts memoization where needed. This **replaces** the need to manually add `useMemo`, `useCallback`, and `React.memo` throughout the codebase.

### 3.4 — React 19 API cleanup

Remove `prop-types` — it was deprecated in React 19 for function components and is unnecessary with TypeScript or the Compiler. The package is ~25KB and pure overhead.

```bash
npm uninstall prop-types
```

Remove all `PropTypes` imports and `.propTypes` declarations from components.

---

## Phase 4 — Memoisation and Re-render Fixes

Even with the React Compiler, some structural patterns cause unnecessary re-renders and should be addressed explicitly.

### 4.1 — Memoize ThemeContext value

```jsx
// ThemeContext.jsx — current (re-renders all consumers on every render)
return <ThemeContext.Provider value={{ theme, toggleTheme }}>

// Fixed — stable reference
const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
return <ThemeContext.Provider value={value}>
```

### 4.2 — Memoize Highcharts options objects

In `wind_rose.jsx` and `windGraphBarb.jsx`, the `options` object is recreated on every render, which forces Highcharts to re-evaluate the entire chart. Wrap in `useMemo` (the Compiler will also handle this, but explicit `useMemo` here is clearer):

```js
// wind_rose.jsx
const chartOptions = useMemo(() => ({
  chart: { ... },
  series: [{ data: [heading] }],
  // ...
}), [heading, cog]);
```

### 4.3 — Stable formatter functions

All the `formatDdMmSs`, `formatSpeeds`, `formatDistance`, `formatHeight` etc. are defined inline inside components. Move them to a shared `src/utils/formatters.js` module. Being at module scope means they're created once, not on every render, and can be shared across components (both `gps.jsx` and `passagePlan.jsx` currently define `formatDdMmSs` separately).

```js
// src/utils/formatters.js
export function formatDdMmSs(decimal) { /* ... */ }
export function formatDistance(nm) { /* ... */ }
export function formatHeight(m) { /* ... */ }
// etc.
```

### 4.4 — Cache GeoJSON processing in map.jsx

`map.jsx` processes the entire GeoJSON file on every render with multiple `.filter().map()` chains and a geometry winding-fix pass. This should run once at module load, not per render:

```js
// map.jsx — at module scope, outside the component
import rawGeoJson from '../assets/marks,water,land.geojson';

const processedFeatures = rawGeoJson.features.map(fixWindingOrder);
const buoys    = processedFeatures.filter(f => f.properties.type === 'buoy');
const lights   = processedFeatures.filter(f => f.properties.type === 'light');
// etc.
```

Only the vessel position marker (which changes with GPS data) stays inside the component.

---

## Phase 5 — Build Optimisation

### 5.1 — Lazy-load heavy components

`chatBot.tsx` (~263 lines) imports `react-markdown`, `rehype-highlight`, and the AI SDK. It's only visible to signed-in users. Lazy-load it so it doesn't block initial render:

```jsx
// App.jsx
import { lazy, Suspense } from 'react';
const FloatingChat = lazy(() => import('./components/chatBot'));

// In JSX:
<SignedIn>
  <Suspense fallback={null}>
    <FloatingChat />
  </Suspense>
</SignedIn>
```

### 5.2 — Configure Vite code splitting

```js
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':      ['react', 'react-dom'],
          'vendor-highcharts': ['highcharts', 'highcharts-react-official'],
          'vendor-maps':       ['react-simple-maps'],
          'vendor-ai':         ['ai', '@ai-sdk/react', '@ai-sdk/openai'],
        },
      },
    },
  },
});
```

This splits the bundle so each vendor chunk is cached independently. When you deploy an app update, only the app chunk invalidates — the Highcharts chunk (~400KB) stays cached in the browser.

### 5.3 — Explicit Highcharts module imports

Audit which Highcharts modules are actually used. Only import what's needed rather than the entire library:

```js
import Highcharts from 'highcharts/highcharts';
import HighchartsMore from 'highcharts/highcharts-more'; // only if needed
import SolidGauge from 'highcharts/modules/solid-gauge'; // only if needed
```

### 5.4 — Replace `react-toggle` with a Tailwind component

`react-toggle` is unmaintained (last published 2021, no React 19 testing). The current usage is a simple on/off toggle. Replace with a small inline component:

```jsx
// src/components/Toggle.jsx
export function Toggle({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
        ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      <span className="sr-only">{label}</span>
    </button>
  );
}
```

This removes a dependency entirely.

---

## Phase 6 — Error Boundaries and Resilience

### 6.1 — Add an ErrorBoundary component

Currently, a runtime error in any component (e.g. unexpected API shape causing a crash in a formatter) takes down the entire app. Wrap each dashboard panel independently:

```jsx
// src/components/ErrorBoundary.jsx
import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-4 text-red-400 text-sm border border-red-800 rounded">
          Panel unavailable
        </div>
      );
    }
    return this.props.children;
  }
}
```

```jsx
// App.jsx
<ErrorBoundary><GpsDisplay /></ErrorBoundary>
<ErrorBoundary><WindRose /></ErrorBoundary>
// ...
```

### 6.2 — Surface fetch errors from the context

The `SensorDataContext` currently swallows errors silently (stale data stays in state). Add an `errors` field to the context state so components can optionally show a stale-data warning:

```js
// In reducer, add an errors key alongside data keys
// dispatch({ type: 'UPDATE', payload: { ..., errors: { gps: true } } })
```

The header already has a "vessel unavailable" state — it can use this to show a connection warning.

---

## Recommended Implementation Order

| # | Step | Risk | Impact | Backend change? |
|---|------|------|--------|-----------------|
| 1 | Delete dead components, remove imports | None | Medium | No |
| 2 | Rename `componants/` → `components/`, update imports | None | Low | No |
| 3 | Strip console.logs, gate behind `DEV` | None | Low | No |
| 4 | Add `src/config/constants.js` | None | Low | No |
| 5 | Create `SensorDataContext`, wire into `main.jsx` | Low | **Very High** | No |
| 6 | Migrate components to `useSensorData` (one at a time, test each) | Low | **Very High** | No |
| 7 | React 19 upgrade + React Compiler | Low | High | No |
| 8 | Move formatters to `src/utils/formatters.js` | None | Medium | No |
| 9 | Cache GeoJSON processing at module scope in `map.jsx` | None | Medium | No |
| 10 | Vite code splitting config | None | High | No |
| 11 | Lazy-load ChatBot | None | Medium | No |
| 12 | Replace react-toggle with Tailwind component | Low | Low | No |
| 13 | Memoize ThemeContext value | None | Low | No |
| 14 | Add ErrorBoundary around each panel | None | Resilience | No |

Steps 1–4 are pure cleanup with zero risk and should be done first. Steps 5–6 (the context migration) are the highest-value change and can be done one component at a time, verifying each works before moving to the next.

---

## Target State

| Metric | Before | After |
|--------|--------|-------|
| Concurrent polling timers | 11 | 2 (fast + slow) |
| HTTP requests/sec | ~5.5 req/s | ~0.5 req/s |
| Backend changes required | — | None |
| Manual `useMemo` calls needed | Many | Near zero (React Compiler) |
| Dead components | 5 | 0 |
| Bundle chunks | 1 monolith | 5 independently cached chunks |
| React version | 18.3.1 | 19.2.4 |
| Folder name typo | `componants/` | `components/` |
| Console.log calls | 19 | 0 |
| Error resilience | Full crash | Per-panel isolation |
| Duplicate formatter definitions | Yes | No (shared `formatters.js`) |
| GeoJSON processed | Every render | Once at module load |

---

## Files to Create

| New file | Purpose |
|----------|---------|
| `src/context/SensorDataContext.jsx` | Single shared polling context |
| `src/utils/formatters.js` | Shared formatting functions extracted from components |
| `src/components/ErrorBoundary.jsx` | Per-panel error isolation |
| `src/components/Toggle.jsx` | Replaces react-toggle dependency |
| `src/config/constants.js` | `POLL_INTERVAL_MS`, `SLOW_POLL_INTERVAL_MS` |

## Files to Delete

| File | Reason |
|------|--------|
| `src/componants/board.jsx` | Dead, broken |
| `src/componants/input.jsx` | Dead |
| `src/componants/timer.jsx` | Dead |
| `src/componants/log.jsx` | Dead, broken |
| `src/componants/gauge.jsx` | Dead |

## Files to Modify

| File | Changes |
|------|---------|
| `vite.config.js` | Add React Compiler plugin, code splitting |
| `main.jsx` | Wrap app in `SensorDataProvider` |
| `src/App.jsx` | Remove dead imports, add ErrorBoundary, lazy-load ChatBot |
| `src/components/header.jsx` | Replace polling with `useSensorData('vessel')` |
| `src/components/gps.jsx` | Replace polling with `useSensorData('gps')`, use shared formatters |
| `src/components/wind_rose.jsx` | Replace polling with `useSensorData('compass')`, memoize chart options |
| `src/components/depth.jsx` | Replace 4 polling hooks with 4× `useSensorData`, use shared formatters |
| `src/components/passagePlan.jsx` | Replace polling with `useSensorData('passagePlan')` |
| `src/components/map.jsx` | Replace polling with `useSensorData('gpsPosition')`, cache GeoJSON |
| `src/components/ThemeContext.jsx` | Memoize context value |
| `src/components/windGraphBarb.jsx` | Keep 1-hour fetch unchanged, remove console.logs, memoize options |
| `package.json` | Upgrade React to 19.2.4, remove prop-types, add babel-plugin-react-compiler |
| `server.js` | No changes required |
