import { prisma } from "@/lib/db";
import { DEFAULT_USER_ID } from "@/lib/constants";
import { formatDuration, hostnameFromUrl } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LibraryPage(): Promise<React.ReactElement> {
  const links = await prisma.link.findMany({
    where: { userId: DEFAULT_USER_ID },
    include: { topics: { include: { topic: true } } },
    orderBy: { addedAt: "desc" },
    take: 200,
  });

  return (
    <main className="px-5 pt-6 safe-top">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.14em] text-white/45">Library</div>
          <h1 className="text-2xl font-semibold tracking-tight">{links.length} saved</h1>
        </div>
        <Link href="/add" className="btn btn-ghost h-10 px-3 text-sm">
          Add more
        </Link>
      </div>

      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.id}>
            <a
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="card flex gap-3 p-3 transition-colors hover:bg-white/[0.03]"
            >
              <div
                className="h-16 w-24 shrink-0 rounded-lg bg-white/[0.04] bg-cover bg-center"
                style={{ backgroundImage: l.thumbnail ? `url(${l.thumbnail})` : undefined }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[11px] text-white/45">
                  <span className="capitalize">{l.source}</span>
                  <span>· {hostnameFromUrl(l.url)}</span>
                  {l.durationSec ? <span>· {formatDuration(l.durationSec)}</span> : null}
                  {l.status !== "ready" && (
                    <span className="ml-auto rounded-full bg-white/[0.06] px-1.5 py-0.5">{l.status}</span>
                  )}
                </div>
                <div className="mt-0.5 truncate text-sm font-semibold">{l.title ?? l.url}</div>
                {l.summary && (
                  <div className="mt-0.5 line-clamp-2 text-xs text-white/55">{l.summary}</div>
                )}
                {l.topics.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {l.topics.slice(0, 3).map((lt) => (
                      <span
                        key={lt.topicId}
                        className="rounded-full bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/55"
                      >
                        {lt.topic.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </a>
          </li>
        ))}
      </ul>
      {links.length === 0 && (
        <p className="pt-12 text-center text-sm text-white/45">Nothing saved yet.</p>
      )}
    </main>
  );
}
