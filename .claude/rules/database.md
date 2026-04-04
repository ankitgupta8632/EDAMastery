## Prisma / Turso / SQLite

### Client
- Always import from `@/lib/db` — never `new PrismaClient()` elsewhere
- Default user ID: `process.env.DEFAULT_USER_ID ?? "default-user"`
- `db.ts` auto-selects Turso (via `PrismaLibSql`) when env vars set, falls back to local SQLite

### Turso (Production)
- Adapter: `PrismaLibSql` from `@prisma/adapter-libsql` (lowercase 'q' — NOT `PrismaLibSQL`)
- Prisma Migrate does NOT work with Turso — use `prisma migrate diff` to generate SQL, then `turso db shell edamastery < file.sql`
- Schema changes: update schema.prisma → generate diff SQL → apply to Turso → `npx prisma generate`
- Seeding: `npx tsx prisma/seed.ts` (seed.ts has its own Turso-aware PrismaClient)
- CLI: `~/.turso/turso db shell edamastery` for direct SQL access

### Queries
- No raw SQL — use Prisma query builder exclusively
- Use `include` for eager loading relations (not separate queries)
- Use `select` to limit fields when you don't need the full model
- Transactions (`prisma.$transaction([...])`) for writes spanning multiple tables
- Upsert for idempotent creates (seed data, settings, streaks)

### SQLite/libSQL Limitations
- No `skipDuplicates` on `createMany` — use upsert loops
- JSON fields stored as `String` — `JSON.stringify()` on write, `JSON.parse()` on read
- No native enums — use string fields with TypeScript union types for validation
- DateTime stored as ISO string — use `new Date()` for comparisons

### Local DB
- Path: `prisma/prisma/dev.db` (resolved from `file:./prisma/dev.db` relative to prisma directory)
- gitignored — each environment seeds its own data
- Use `npx prisma studio` for visual DB browsing (local only)

### Schema Conventions
- `@id @default(cuid())` for auto-generated IDs
- `@unique` constraints for natural keys (e.g., `[moduleId, slug]`)
- `onDelete: Cascade` for parent-child relationships
- `@default(now())` for createdAt fields
- Optional fields (`?`) for nullable data — never use empty string as null substitute
