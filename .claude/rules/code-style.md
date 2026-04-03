## TypeScript
- Strict mode — no `any`, no `as any`, no `@ts-ignore`
- Explicit return types on all exported functions
- `interface` for object shapes, `type` for unions/intersections/aliases
- Prefer `const` over `let`. Never `var`.
- Destructure props/params when >2 fields

## Naming
- Components: PascalCase (`ModuleCard.tsx`)
- Utilities/hooks: camelCase (`useProgress.ts`, `gamification.ts`)
- Route directories: kebab-case (`/learn/[moduleId]/`)
- Constants: UPPER_SNAKE_CASE (`XP_TABLE`, `ACHIEVEMENTS`)
- API route handlers: lowercase (`GET`, `POST`, `PUT`)

## Imports
- Use `@/` path alias for all project imports (maps to `./src/`)
- Group: external deps → `@/lib` → `@/components` → `@/types` → relative
- No circular imports between lib modules

## Error Handling
- API routes: always return proper HTTP status codes with `{ error: string }` body
- Client fetches: handle loading + error states, show toast on failure
- Never swallow errors silently — at minimum `console.error`

## Token Efficiency
- Don't read files you've already read in this conversation unless they may have changed
- When editing, use Edit tool with minimal context (don't rewrite entire files)
- For searches, use Glob/Grep first before spawning agents
- Batch independent tool calls in parallel
