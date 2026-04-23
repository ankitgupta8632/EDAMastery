import Link from "next/link";
import { prisma } from "@/lib/db";
import { DEFAULT_USER_ID } from "@/lib/constants";
import { Layers3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TopicsPage(): Promise<React.ReactElement> {
  const clusters = await prisma.cluster.findMany({
    where: { userId: DEFAULT_USER_ID },
    include: {
      links: {
        take: 4,
        include: { link: { select: { id: true, title: true, thumbnail: true, source: true, url: true } } },
      },
      _count: { select: { links: true } },
      deepDive: { select: { generatedAt: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const loose = await prisma.link.findMany({
    where: { userId: DEFAULT_USER_ID, status: "ready", clusterLinks: { none: {} } },
    select: { id: true, title: true, thumbnail: true, url: true },
    take: 12,
    orderBy: { addedAt: "desc" },
  });

  return (
    <main className="px-5 pt-6 safe-top">
      <div className="mb-5">
        <div className="text-xs uppercase tracking-[0.14em] text-white/45">Clusters</div>
        <h1 className="text-2xl font-semibold tracking-tight">Broader topics, from your own links</h1>
        <p className="mt-2 text-sm text-white/55">
          Each cluster is a thread across multiple things you saved. Open one to generate a synthesised deep-dive.
        </p>
      </div>

      {clusters.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/[0.08] p-8 text-center text-sm text-white/55">
          No clusters yet. Save 2+ related links and Lodestar will thread them automatically.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {clusters.map((c) => (
            <Link
              key={c.id}
              href={`/topics/${c.id}`}
              className="card overflow-hidden p-4 transition-colors hover:bg-white/[0.03]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-base font-semibold leading-tight">{c.label}</div>
                  {c.summary && (
                    <div className="mt-1 line-clamp-2 text-sm text-white/60">{c.summary}</div>
                  )}
                </div>
                <div className="shrink-0 rounded-full bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/65">
                  {c._count.links} links
                </div>
              </div>
              <div className="mt-3 flex gap-1.5">
                {c.links.slice(0, 4).map((cl) => (
                  <div
                    key={cl.link.id}
                    className="h-12 flex-1 rounded-md bg-white/[0.04] bg-cover bg-center"
                    style={{ backgroundImage: cl.link.thumbnail ? `url(${cl.link.thumbnail})` : undefined }}
                  />
                ))}
              </div>
              {c.deepDive && (
                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#F5B754]/12 px-2 py-0.5 text-[11px] text-[#FCD34D]">
                  <Layers3 className="h-3 w-3" /> Deep-dive ready
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {loose.length > 0 && (
        <section className="mt-8">
          <div className="mb-2 text-xs uppercase tracking-[0.14em] text-white/45">Unclustered</div>
          <div className="grid grid-cols-2 gap-2">
            {loose.map((l) => (
              <a
                key={l.id}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="card flex items-center gap-2 p-2"
              >
                <div
                  className="h-10 w-14 shrink-0 rounded-md bg-white/[0.04] bg-cover bg-center"
                  style={{ backgroundImage: l.thumbnail ? `url(${l.thumbnail})` : undefined }}
                />
                <div className="line-clamp-2 text-xs text-white/75">{l.title ?? l.url}</div>
              </a>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
