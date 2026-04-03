## Components
- **Server Components by default** — use for data fetching, static content, layouts
- **`"use client"`** only when component needs: useState, useEffect, event handlers, browser APIs, Framer Motion, or context
- Split large pages: server component fetches data, passes to client component for interactivity
- Use `Suspense` boundaries with skeleton loaders for async data

## Styling
- Tailwind CSS only — no inline styles, no CSS modules, no styled-components
- Use `cn()` from `@/lib/utils` for conditional class merging
- Follow shadcn/ui patterns: compose from primitives (Card, Button, Badge, etc.)
- Mobile-first responsive: base styles for mobile, `sm:` / `md:` / `lg:` for larger
- Color palette: indigo (primary), violet/pink/amber (phase colors), slate (neutral)

## State Management
- Global state via `AppContext` (`src/contexts/app-context.tsx`): streak, settings, recommendation
- Page-level state via `useState` — don't lift to context unless shared across pages
- API data: fetch in component with `useEffect` + loading/error states
- No external state libraries (no Redux, Zustand, etc.)

## Patterns
- Forms: controlled inputs, save via API on submit (not on change)
- Navigation: Next.js `<Link>` for internal, `<a target="_blank">` for external
- Toasts: Sonner `toast.success()` / `toast.error()` for user feedback
- Animations: Framer Motion `motion.div` with `initial/animate` for page transitions
- Loading: `animate-pulse` skeleton cards matching final layout shape
