# CLAUDE.md — Kelda Web App

This file provides guidance for AI assistants working on this codebase.

---

## Project Overview

**Kelda Web App** is a real-time marine dashboard for monitoring vessel sensor data. It displays GPS position, heading, tidal information, bilge depth, wind conditions, and journey history on an interactive map of the Solent. Authenticated users can access an AI-powered chat assistant.

---

## Repository Structure

```
kelda_web_app/
├── kelder-web-app/          # Main application (frontend + API server)
│   ├── src/
│   │   ├── components/      # React UI components
│   │   ├── config/          # API URL builder and constants
│   │   ├── context/         # React contexts (theme, sensor data)
│   │   ├── utils/           # Shared utility functions
│   │   └── assets/          # SVGs, images, GeoJSON
│   ├── server.js            # Express API server (production + passage plan API)
│   ├── vite.config.js       # Vite build config with code splitting
│   ├── eslint.config.js     # ESLint v9 flat config
│   └── package.json         # Scripts and dependencies
├── tailwind.config.js       # Tailwind dark-mode config (root level)
├── REFACTOR_PLAN.md         # Performance refactor documentation
└── CLAUDE.md                # This file
```

---

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| UI Framework | React | 19.x (with React Compiler) |
| Build Tool | Vite | 6.x |
| Styling | Tailwind CSS | 4.x (via @tailwindcss/vite) |
| Charts | Highcharts | 12.x |
| Maps | react-simple-maps | 3.x |
| Auth | Clerk (@clerk/clerk-react) | 5.x |
| AI/Chat | Vercel AI SDK (@ai-sdk/openai, ai) | 5.x |
| HTTP | Axios | 1.x |
| Backend | Express | 5.x |
| Validation | Zod | 4.x |
| Linting | ESLint | 9.x (flat config) |

---

## Development Commands

All commands run from `kelder-web-app/`:

```bash
# Install dependencies
npm install

# Start frontend dev server (port 5173, HMR enabled)
npm run dev

# Start Express API server (port 5174)
node server.js

# Lint the codebase
npm run lint

# Production build (outputs to dist/)
npm run build

# Preview production build locally
npm run preview

# Run production server (serves frontend + API)
NODE_ENV=production node server.js
```

> **For local development**, run both `npm run dev` and `node server.js` concurrently in separate terminals.

---

## Environment Variables

Create a `.env` file in `kelder-web-app/` (never commit it):

```bash
# Required: Clerk authentication publishable key
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Required: Base URL of the backend API server
VITE_KELDER_API_URL=http://localhost:5174

# Optional: Polling interval in ms (default: 2000)
VITE_API_REFRESH_RATE=2000

# Express server port (default: 5174)
PORT=5174
```

> The app **throws at startup** if `VITE_CLERK_PUBLISHABLE_KEY` is missing. All `VITE_` prefixed vars are inlined by Vite at build time.

---

## Architecture

### Data Flow

```
Upstream Sensor Service (port 8000)
        │
        ▼
SensorDataContext (polling every 2s / 10s)
        │  Promise.allSettled — 8 fast endpoints + 1 slow
        ▼
React Components (via useSensorData hook)
        │
        ▼
Express server.js (port 5174)
  ├── GET/POST /passage_plan  (in-memory storage)
  └── POST /restart
```

### Provider Hierarchy (main.jsx)

```
ThemeProvider
  └── ClerkProvider
        └── SensorDataProvider
              └── App
```

### Sensor Polling (`src/context/SensorDataContext.jsx`)

The central polling mechanism uses two `setInterval` timers:

- **Fast poll** (2000ms default): `gps`, `compass`, `vessel_state`, `tidal`, `tide`, `bilge`, `journey`, `position`
- **Slow poll** (10000ms default): `passage_plan`

All polls use `Promise.allSettled` so one failure does not block others. Error state is tracked separately and exposed via `useSensorErrors()`.

**Consumer hooks:**
```js
const data = useSensorData('gps');        // returns data object or null
const errors = useSensorErrors();         // returns errors object
```

### Component Map

| File | Responsibility |
|---|---|
| `App.jsx` | Dashboard grid layout, ErrorBoundary wrappers |
| `components/header.jsx` | Nav bar: connectivity status, theme toggle, sign-in, restart |
| `components/gps.jsx` | Lat/lon, speed, log, drift |
| `components/depth.jsx` | Tidal event, water height, bilge depth, journey history |
| `components/wind_rose.jsx` | Highcharts compass rose, heading/COG |
| `components/windGraphBarb.jsx` | Wind barb from Open-Meteo external API |
| `components/map.jsx` | Interactive Solent map, GeoJSON, vessel marker |
| `components/passagePlan.jsx` | Waypoint course-to-steer list |
| `components/chatBot.tsx` | AI chat (TypeScript, lazy-loaded, sign-in gated) |
| `components/ErrorBoundary.jsx` | Isolates render failures per panel |
| `components/ThemeContext.jsx` | Light/dark theme via localStorage |

---

## Upstream API Endpoints

These are served by a **separate sensor service** (not in this repo, typically port 8000):

| Endpoint | Data |
|---|---|
| `GET /gps_card_data` | GPS position, speed, log |
| `GET /compass_heading` | Heading, COG |
| `GET /vessel_state` | underway / stationary / unavailable |
| `GET /get_next_tidal_event` | Tidal event predictions |
| `GET /get_height_of_tide` | Current water height |
| `GET /bilge_depth` | Bilge sensor reading |
| `GET /journeys/latest?limit=10` | Journey history |
| `GET /gps_map_position` | Map marker position |

These are configured via `VITE_KELDER_API_URL` in `src/config/api.js`.

---

## Coding Conventions

### Naming

| Type | Convention | Example |
|---|---|---|
| Components | PascalCase | `WindRose`, `DepthGuage` |
| Functions / hooks | camelCase | `useSensorData`, `formatDdMmSs` |
| Constants | UPPER_SNAKE_CASE | `POLL_INTERVAL_MS`, `MAP_COLORS` |
| CSS classes | Tailwind utility classes | `flex gap-4 text-sm` |
| SVG/image assets | kebab-case | `light_mode.svg`, `arrow_left.svg` |

### File Conventions

- Components use `.jsx` (one exception: `chatBot.tsx` uses TypeScript)
- Default exports for all components (no named component exports)
- React hooks for all state and effects — no class components
- `import.meta.env.DEV` guards around `console.log` statements

### Error Handling

- Each dashboard panel is wrapped in `<ErrorBoundary>` in `App.jsx`
- `SensorDataContext` silently swallows fetch errors and preserves last-known-good data
- Error state exposed via `useSensorErrors()` for connectivity indicators in header

### Styling

- Tailwind CSS utility classes throughout — no custom CSS files
- Dark mode via `class` strategy: toggling `dark` class on `document.documentElement`
- Responsive breakpoints: `sm:`, `md:`, `lg:` for adaptive layouts
- Color palette defined in `tailwind.config.js` at the root

### Performance

- **React Compiler** is enabled via `babel-plugin-react-compiler` — the compiler handles memoization automatically; avoid manual `useMemo`/`useCallback` unless profiling proves it necessary
- `chatBot.tsx` is lazy-loaded with `React.lazy()` + `Suspense`
- Vite splits vendor code into 5 chunks: `vendor-react`, `vendor-highcharts`, `vendor-maps`, `vendor-ai`, `vendor-clerk`
- Sensor polling is centralized (2 timers, not one per component)

---

## Key Files to Understand First

1. **`src/context/SensorDataContext.jsx`** — how all sensor data is fetched and distributed
2. **`src/App.jsx`** — dashboard layout and ErrorBoundary structure
3. **`src/config/api.js`** — URL construction for all API calls
4. **`src/config/constants.js`** — polling intervals
5. **`server.js`** — the Express backend (passage plan storage, restart endpoint)

---

## No Tests

There are currently **no automated tests** in this project. No test runner (Vitest, Jest, etc.) is configured. When adding tests, Vitest is the recommended choice (already in the Vite ecosystem).

---

## No CI/CD

There is no Dockerfile, GitHub Actions, or other CI/CD pipeline. Deployment is manual via `NODE_ENV=production node server.js` after `npm run build`.

---

## External Dependencies Not in This Repo

- **Upstream sensor service** (port 8000) — provides all vessel sensor data
- **Clerk** — authentication (requires API keys)
- **OpenAI** — powers the AI chatbot (requires API keys configured server-side)
- **Open-Meteo** — free weather API used by `windGraphBarb.jsx` (no key required)

---

## Common Pitfalls

- **Missing `.env`**: App crashes immediately if `VITE_CLERK_PUBLISHABLE_KEY` is not set
- **react-simple-maps peer deps**: React 19 compatibility is handled via `npm overrides` in `package.json` — do not remove them
- **In-memory passage plan**: Data in `server.js` is lost on server restart (no database)
- **`tailwind.config.js` is at the root**, not inside `kelder-web-app/` — Tailwind's Vite plugin picks it up automatically
- **Asset imports use `?url` suffix** for GeoJSON and images (Vite convention): `import geojson from './assets/marks.geojson?url'`
