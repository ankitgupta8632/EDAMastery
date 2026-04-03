import { LearnPageClient } from "./learn-client";

// Server component that fetches data
// For now, we delegate to a client component that fetches from API
// In production, this would use Prisma directly
export default function LearnPage() {
  return <LearnPageClient />;
}
