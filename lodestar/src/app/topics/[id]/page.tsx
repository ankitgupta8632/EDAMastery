import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import { ClusterDeepDive } from "./deepdive-client";

export const dynamic = "force-dynamic";

export default async function ClusterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  const cluster = await prisma.cluster.findUnique({
    where: { id },
    include: {
      links: {
        include: { link: { include: { topics: { include: { topic: true } } } } },
        orderBy: { centrality: "desc" },
      },
      deepDive: true,
    },
  });
  if (!cluster) notFound();

  return (
    <main className="px-5 pt-5 safe-top">
      <Link href="/topics" className="mb-3 inline-flex items-center gap-1 text-xs text-white/55">
        <ArrowLeft className="h-3 w-3" /> Clusters
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight">{cluster.label}</h1>
      {cluster.summary && <p className="mt-2 text-base leading-relaxed text-white/70">{cluster.summary}</p>}

      <ClusterDeepDive
        clusterId={cluster.id}
        initialMarkdown={cluster.deepDive?.bodyMarkdown ?? null}
        generatedAt={cluster.deepDive?.generatedAt?.toISOString() ?? null}
      />

      <section className="mt-8">
        <div className="mb-2 text-xs uppercase tracking-[0.14em] text-white/45">
          Sources in this cluster ({cluster.links.length})
        </div>
        <ul className="space-y-2">
          {cluster.links.map((cl) => (
            <li key={cl.linkId}>
              <a
                href={cl.link.url}
                target="_blank"
                rel="noreferrer"
                className="card flex gap-3 p-3 transition-colors hover:bg-white/[0.03]"
              >
                <div
                  className="h-14 w-20 shrink-0 rounded-lg bg-white/[0.04] bg-cover bg-center"
                  style={{ backgroundImage: cl.link.thumbnail ? `url(${cl.link.thumbnail})` : undefined }}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{cl.link.title ?? cl.link.url}</div>
                  {cl.link.summary && (
                    <div className="mt-0.5 line-clamp-2 text-xs text-white/55">{cl.link.summary}</div>
                  )}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {cl.link.topics.slice(0, 3).map((lt) => (
                      <span
                        key={lt.topicId}
                        className="rounded-full bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/60"
                      >
                        {lt.topic.name}
                      </span>
                    ))}
                  </div>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
