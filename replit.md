# Rescue Management System (RMS)

## Overview

This is a **Rescue Management System** — a Final Year Project that provides emergency response coordination between citizens, responders, and administrators. The project has two main parts:

1. **Mobile App** (React Native / Expo) — Used by **Citizens** to report emergencies and track requests, and by **Responders** to receive and manage emergency assignments.
2. **Admin Dashboard** (React Web App) — A separate browser-based dashboard for system administrators to monitor requests, manage responders/users, view feedback, logs, and configure settings.

Both apps currently use **placeholder/dummy data** with async mock API functions. Backend integration is not yet fully wired up, though an Express server and Drizzle ORM schema exist as scaffolding.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Mobile App (React Native / Expo)

- **Framework**: Expo SDK 54 with React Native 0.81, using the new architecture (`newArchEnabled: true`).
- **Routing**: `expo-router` with file-based routing. The `app/` directory defines all screens using route groups:
  - `(citizen-auth)/` — Citizen login and registration screens
  - `(responder-auth)/` — Responder login screen
  - `(citizen-tabs)/` — Tab-based citizen dashboard (Home, Track Requests, Profile)
  - `(responder-tabs)/` — Tab-based responder dashboard (Dashboard, History, Profile)
  - `citizen/` — Detail screens for citizens (submit emergency, request details, feedback)
  - `responder/` — Detail screens for responders (request details with status updates)
  - `index.tsx` — Role selection landing screen
- **State Management**: React Context (`AuthProvider` in `lib/auth-context.tsx`) for authentication state. `@tanstack/react-query` is set up but currently used minimally since data comes from mock functions.
- **Styling**: React Native `StyleSheet` with a centralized color palette in `constants/colors.ts`. Uses Inter font family via `@expo-google-fonts/inter`.
- **UI Libraries**: `expo-linear-gradient`, `expo-blur`, `expo-glass-effect`, `expo-haptics`, `expo-image-picker`, `react-native-gesture-handler`, `react-native-reanimated`, `react-native-safe-area-context`, `react-native-screens`.
- **API Layer**: `lib/api.ts` contains all data interfaces and placeholder async functions that return dummy data after a simulated delay. This is the integration point for connecting to a real backend.
- **Platform Support**: iOS, Android, and Web. Platform-specific adjustments are made throughout (e.g., safe area insets, keyboard handling, tab bar styling).

### Admin Dashboard (React Web App)

- **Location**: `/admin-dashboard/` directory — completely separate from the mobile app.
- **Framework**: React 18 with `react-scripts` (Create React App).
- **Routing**: `react-router-dom` v6 with protected routes.
- **Authentication**: Simple localStorage-based auth flag (`rms_admin_auth`). No real auth backend yet.
- **Pages**: Dashboard, Emergency Requests, Responders, Users, Feedback, Logs & Reports, Settings.
- **API Layer**: `admin-dashboard/src/api.js` contains dummy data arrays and mock async functions mirroring the mobile app pattern.
- **Styling**: Plain CSS with CSS custom properties (variables) matching the mobile app's color scheme. No CSS framework.
- **Running**: `cd admin-dashboard && npm install && npm start` (runs on port 3001).

### Backend Server

- **Framework**: Express 5 (TypeScript) in `server/` directory.
- **Entry Point**: `server/index.ts` — sets up CORS, JSON parsing, and serves static files in production.
- **Routes**: `server/routes.ts` — currently a skeleton with no application routes defined. All routes should be prefixed with `/api`.
- **Storage**: `server/storage.ts` — defines an `IStorage` interface and `MemStorage` in-memory implementation. Currently only has basic user CRUD. A PostgreSQL-backed implementation can be added.
- **Database Schema**: `shared/schema.ts` using Drizzle ORM with PostgreSQL dialect. Currently defines a single `users` table with `id`, `username`, and `password`. Uses `drizzle-zod` for validation schemas.
- **Database Config**: `drizzle.config.ts` expects a `DATABASE_URL` environment variable pointing to PostgreSQL.
- **Build**: Server can be built with esbuild (`npm run server:build`) and run in production (`npm run server:prod`).

### Shared Code

- `shared/schema.ts` — Drizzle ORM schema definitions shared between server and potentially the mobile app. This is where database models should be defined.
- Path aliases: `@/*` maps to root, `@shared/*` maps to `./shared/*`.

### Key Design Decisions

1. **Separate admin dashboard**: The admin dashboard is a completely independent React web app to avoid any risk of breaking the mobile app. It has its own `package.json`, dependencies, and build process.

2. **Mock API pattern**: Both mobile and admin apps use async placeholder functions that return dummy data. This allows full UI development without a backend, and provides clear integration points when the backend is ready.

3. **File-based routing with route groups**: Expo Router's route groups organize screens by role (citizen vs responder) and flow (auth vs main tabs vs detail screens).

4. **In-memory storage as default**: The server uses `MemStorage` by default, making it easy to run without a database. The `IStorage` interface allows swapping in a PostgreSQL implementation.

5. **Monorepo structure**: Everything lives in one repository — mobile app at root, admin dashboard in `/admin-dashboard/`, server in `/server/`, shared code in `/shared/`.

## External Dependencies

### Database
- **PostgreSQL** (via Drizzle ORM) — configured but requires `DATABASE_URL` environment variable. Schema migrations go in `/migrations/`.
- **Drizzle Kit** — for schema push/migration (`npm run db:push`).

### Key NPM Packages
- **Mobile**: `expo`, `expo-router`, `react-native`, `@tanstack/react-query`, `expo-image-picker`, `expo-location`, `expo-haptics`, `react-native-reanimated`
- **Server**: `express`, `pg` (PostgreSQL client), `drizzle-orm`, `drizzle-zod`, `zod`
- **Admin**: `react`, `react-dom`, `react-router-dom`, `react-scripts`

### External Services
- **Google Fonts** — Inter font family (loaded via `@expo-google-fonts/inter` in mobile, via Google Fonts CDN in admin dashboard)
- **Replit Environment** — The app is configured for Replit deployment with environment variables like `REPLIT_DEV_DOMAIN`, `REPLIT_DOMAINS`, `EXPO_PUBLIC_DOMAIN`

### Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (required for database operations)
- `REPLIT_DEV_DOMAIN` — Used for CORS and Expo development server configuration
- `EXPO_PUBLIC_DOMAIN` — Public domain for API calls from the mobile app
- `REPLIT_DOMAINS` — Comma-separated list of allowed domains for CORS