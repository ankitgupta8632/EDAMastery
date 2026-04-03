## Prisma / SQLite

### Client
- Always import from `@/lib/db` — never `new PrismaClient()` elsewhere
- Default user ID: `process.env.DEFAULT_USER_ID ?? "default-user"`

### Queries
- No raw SQL — use Prisma query builder exclusively
- Use `include` for eager loading relations (not separate queries)
- Use `select` to limit fields when you don't need the full model
- Transactions (`prisma.$transaction([...])`) for writes spanning multiple tables
- Upsert for idempotent creates (seed data, settings, streaks)

### SQLite Limitations
- No `skipDuplicates` on `createMany` — use upsert loops
- JSON fields stored as `String` — `JSON.stringify()` on write, `JSON.parse()` on read
- No native enums — use string fields with TypeScript union types for validation
- DateTime stored as ISO string — use `new Date()` for comparisons

### Migrations
- Always use `npx prisma migrate dev --name descriptive-name` for schema changes
- After migration, verify with `npx prisma studio`
- Seed is idempotent — safe to re-run anytime: `npx prisma db seed`

### Schema Conventions
- `@id @default(cuid())` for auto-generated IDs
- `@unique` constraints for natural keys (e.g., `[moduleId, slug]`)
- `onDelete: Cascade` for parent-child relationships
- `@default(now())` for createdAt fields
- Optional fields (`?`) for nullable data — never use empty string as null substitute
