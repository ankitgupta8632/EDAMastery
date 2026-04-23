import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const USER_ID = process.env.DEFAULT_USER_ID ?? "default-user";

async function main(): Promise<void> {
  console.log("Seeding Lodestar…");

  await prisma.user.upsert({
    where: { id: USER_ID },
    create: { id: USER_ID, name: "You" },
    update: {},
  });

  await prisma.streak.upsert({
    where: { userId: USER_ID },
    create: { userId: USER_ID },
    update: {},
  });

  await prisma.profile.upsert({
    where: { userId: USER_ID },
    create: {
      userId: USER_ID,
      lifeContext: JSON.stringify({
        career: "Senior IC at a tech company. Time-starved, pattern-hungry.",
        health: "Prefer strength + mobility. 20-min windows.",
        family: "Young kids. Evenings are family time.",
        screenTimeMin: 60,
        tone: "warm",
        mixRatio: 70,
      }),
    },
    update: {},
  });

  const defaults = [
    { name: "AI distribution & product strategy", category: "career", priority: 5 },
    { name: "Distributed systems fluency", category: "craft", priority: 4 },
    { name: "Rebuild aerobic base", category: "health", priority: 4 },
    { name: "Better at reading kids bedtime stories", category: "family", priority: 3 },
    { name: "Read one great essay a day", category: "curiosity", priority: 2 },
  ];
  for (const g of defaults) {
    await prisma.goal.upsert({
      where: { id: `seed-${g.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` },
      create: {
        id: `seed-${g.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        userId: USER_ID,
        name: g.name,
        category: g.category,
        priority: g.priority,
      },
      update: { priority: g.priority },
    });
  }

  console.log("Seed complete.");
  console.log("  - 1 user, 1 profile, 1 streak row");
  console.log(`  - ${defaults.length} sample goals`);
  console.log("Next: paste a few links via /add to populate the feed.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
