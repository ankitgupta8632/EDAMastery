import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

function createPrisma(): PrismaClient {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (url && authToken) {
    const adapter = new PrismaLibSql({ url, authToken });
    return new PrismaClient({ adapter });
  }
  return new PrismaClient();
}

const prisma = createPrisma();

async function main() {
  console.log("Seeding EDA Mastery database...");

  // ─── Default User ──────────────────────────────────────────────────────────
  console.log("Creating default user...");
  const user = await prisma.user.upsert({
    where: { id: "default-user" },
    update: {},
    create: { id: "default-user", name: "Learner" },
  });

  // ─── Phases ────────────────────────────────────────────────────────────────
  console.log("Creating phases...");
  const phases = [
    {
      id: "phase-1",
      name: "Foundations",
      description:
        "Core digital design concepts, HDL basics, and synthesis fundamentals",
      order: 1,
      colorHex: "#6366f1",
    },
    {
      id: "phase-2",
      name: "RTL & Verification",
      description:
        "Design methodology, verification environments, and coverage-driven testing",
      order: 2,
      colorHex: "#8b5cf6",
    },
    {
      id: "phase-3",
      name: "Physical Design",
      description:
        "From gates to silicon: timing, placement, routing, and power",
      order: 3,
      colorHex: "#ec4899",
    },
    {
      id: "phase-4",
      name: "Protium Mastery",
      description:
        "FPGA prototyping, Protium compilation, runtime, and debug",
      order: 4,
      colorHex: "#f59e0b",
    },
  ];

  for (const phase of phases) {
    await prisma.phase.upsert({
      where: { id: phase.id },
      update: phase,
      create: phase,
    });
  }

  // ─── Modules ───────────────────────────────────────────────────────────────
  console.log("Creating modules...");

  interface LessonDef {
    slug: string;
    title: string;
    difficulty: string;
    estimatedMinutes: number;
    contentType: string;
    description?: string;
    protiumNote?: string;
    labUrl?: string;
  }

  interface ModuleDef {
    id: string;
    name: string;
    description: string;
    order: number;
    estimatedHours: number;
    phaseId: string;
    lessons: LessonDef[];
  }

  const modules: ModuleDef[] = [
    // ── Phase 1: Foundations ──────────────────────────────────────────────────
    {
      id: "digital-design",
      name: "Digital Design",
      description:
        "Fundamentals of digital circuits, logic gates, sequential logic, and synchronous design principles.",
      order: 1,
      estimatedHours: 2.0,
      phaseId: "phase-1",
      lessons: [
        {
          slug: "what-is-digital-design",
          title: "What is Digital Design?",
          difficulty: "beginner",
          estimatedMinutes: 10,
          contentType: "visual",
          description:
            "Introduction to digital circuits, binary systems, and how hardware thinks differently from software.",
        },
        {
          slug: "combinational-logic-gates",
          title: "Combinational Logic Gates",
          difficulty: "beginner",
          estimatedMinutes: 12,
          contentType: "visual",
          description:
            "AND, OR, NOT, XOR, multiplexers, decoders — the atoms of digital design.",
        },
        {
          slug: "sequential-logic-flip-flops",
          title: "Sequential Logic & Flip-Flops",
          difficulty: "beginner",
          estimatedMinutes: 15,
          contentType: "mixed",
          description:
            "D flip-flops, registers, setup/hold time, and why clocks matter.",
        },
        {
          slug: "finite-state-machines",
          title: "Finite State Machines",
          difficulty: "intermediate",
          estimatedMinutes: 15,
          contentType: "mixed",
          description:
            "Moore and Mealy machines, state encoding, and designing controllers.",
        },
        {
          slug: "clock-domains-metastability",
          title: "Clock Domains & Metastability",
          difficulty: "intermediate",
          estimatedMinutes: 18,
          contentType: "mixed",
          description:
            "What happens when signals cross clock domains and how to handle it safely.",
        },
        {
          slug: "synchronous-design-principles",
          title: "Synchronous Design Principles",
          difficulty: "intermediate",
          estimatedMinutes: 15,
          contentType: "visual",
          description:
            "Rules for robust digital design: single clock edge, registered outputs, avoiding latches.",
        },
      ],
    },
    {
      id: "verilog",
      name: "Verilog",
      description:
        "Hardware description language fundamentals: modules, data types, combinational and sequential modeling.",
      order: 2,
      estimatedHours: 2.5,
      phaseId: "phase-1",
      lessons: [
        {
          slug: "verilog-basics-modules-ports",
          title: "Verilog Basics: Modules & Ports",
          difficulty: "beginner",
          estimatedMinutes: 12,
          contentType: "mixed",
        },
        {
          slug: "data-types-operators",
          title: "Data Types & Operators",
          difficulty: "beginner",
          estimatedMinutes: 12,
          contentType: "visual",
        },
        {
          slug: "combinational-modeling-assign",
          title: "Combinational Modeling with assign",
          difficulty: "beginner",
          estimatedMinutes: 15,
          contentType: "mixed",
          protiumNote:
            "Understanding continuous assignment is crucial for reading Protium-compiled netlists.",
        },
        {
          slug: "sequential-modeling-always",
          title: "Sequential Modeling with always",
          difficulty: "intermediate",
          estimatedMinutes: 15,
          contentType: "mixed",
          protiumNote:
            "Sequential blocks map to FPGA registers in Protium hardware.",
        },
        {
          slug: "behavioral-vs-structural-modeling",
          title: "Behavioral vs Structural Modeling",
          difficulty: "intermediate",
          estimatedMinutes: 15,
          contentType: "visual",
        },
        {
          slug: "writing-testbenches",
          title: "Writing Testbenches",
          difficulty: "intermediate",
          estimatedMinutes: 18,
          contentType: "mixed",
          labUrl: "https://www.edaplayground.com/",
        },
        {
          slug: "common-verilog-pitfalls",
          title: "Common Verilog Pitfalls",
          difficulty: "intermediate",
          estimatedMinutes: 12,
          contentType: "visual",
        },
      ],
    },
    {
      id: "synthesis",
      name: "Synthesis",
      description:
        "Logic synthesis: transforming RTL into gate-level netlists, optimization, and timing constraints.",
      order: 3,
      estimatedHours: 2.0,
      phaseId: "phase-1",
      lessons: [
        {
          slug: "what-is-logic-synthesis",
          title: "What is Logic Synthesis?",
          difficulty: "beginner",
          estimatedMinutes: 12,
          contentType: "visual",
          description:
            "Transforming RTL code into a netlist of logic gates.",
        },
        {
          slug: "technology-libraries-cell-selection",
          title: "Technology Libraries & Cell Selection",
          difficulty: "intermediate",
          estimatedMinutes: 15,
          contentType: "visual",
        },
        {
          slug: "optimization-goals-area-speed-power",
          title: "Optimization Goals: Area, Speed, Power",
          difficulty: "intermediate",
          estimatedMinutes: 15,
          contentType: "mixed",
        },
        {
          slug: "timing-constraints-for-synthesis",
          title: "Timing Constraints for Synthesis",
          difficulty: "intermediate",
          estimatedMinutes: 18,
          contentType: "mixed",
          protiumNote:
            "Protium compilation uses similar constraints to target FPGA fabric.",
        },
        {
          slug: "coding-for-synthesis",
          title: "Coding for Synthesis",
          difficulty: "intermediate",
          estimatedMinutes: 15,
          contentType: "mixed",
        },
        {
          slug: "reading-synthesis-reports",
          title: "Reading Synthesis Reports",
          difficulty: "intermediate",
          estimatedMinutes: 12,
          contentType: "visual",
        },
      ],
    },

    // ── Phase 2: RTL & Verification ──────────────────────────────────────────
    {
      id: "systemverilog",
      name: "SystemVerilog",
      description:
        "SystemVerilog enhancements: new data types, interfaces, assertions, and design patterns.",
      order: 4,
      estimatedHours: 2.5,
      phaseId: "phase-2",
      lessons: [
        {
          slug: "systemverilog-vs-verilog",
          title: "SystemVerilog vs Verilog: What's New",
          difficulty: "beginner",
          estimatedMinutes: 10,
          contentType: "visual",
        },
        {
          slug: "enhanced-data-types",
          title: "Enhanced Data Types",
          difficulty: "beginner",
          estimatedMinutes: 12,
          contentType: "visual",
        },
        {
          slug: "interfaces-modports",
          title: "Interfaces & Modports",
          difficulty: "intermediate",
          estimatedMinutes: 15,
          contentType: "mixed",
        },
        {
          slug: "always-comb-always-ff",
          title: "Always Blocks: always_comb & always_ff",
          difficulty: "intermediate",
          estimatedMinutes: 12,
          contentType: "mixed",
        },
        {
          slug: "assertions-immediate-concurrent",
          title: "Assertions: Immediate & Concurrent",
          difficulty: "intermediate",
          estimatedMinutes: 18,
          contentType: "mixed",
          protiumNote:
            "Assertions embedded in RTL catch bugs during Protium emulation runs.",
        },
        {
          slug: "ready-valid-handshake",
          title: "Design Patterns: Ready/Valid Handshake",
          difficulty: "intermediate",
          estimatedMinutes: 15,
          contentType: "mixed",
        },
        {
          slug: "packages-parameterized-design",
          title: "Packages & Parameterized Design",
          difficulty: "intermediate",
          estimatedMinutes: 15,
          contentType: "visual",
        },
      ],
    },
    {
      id: "uvm",
      name: "UVM",
      description:
        "Universal Verification Methodology: testbench architecture, components, sequences, and TLM.",
      order: 5,
      estimatedHours: 3.0,
      phaseId: "phase-2",
      lessons: [
        {
          slug: "why-uvm",
          title: "Why UVM? Verification Methodology Overview",
          difficulty: "beginner",
          estimatedMinutes: 12,
          contentType: "visual",
        },
        {
          slug: "uvm-testbench-architecture",
          title: "UVM Testbench Architecture",
          difficulty: "beginner",
          estimatedMinutes: 15,
          contentType: "visual",
        },
        {
          slug: "uvm-components",
          title: "UVM Components: Driver, Monitor, Scoreboard",
          difficulty: "intermediate",
          estimatedMinutes: 18,
          contentType: "mixed",
        },
        {
          slug: "uvm-sequences-sequencers",
          title: "UVM Sequences & Sequencers",
          difficulty: "intermediate",
          estimatedMinutes: 18,
          contentType: "mixed",
        },
        {
          slug: "transaction-level-modeling",
          title: "Transaction-Level Modeling (TLM)",
          difficulty: "intermediate",
          estimatedMinutes: 15,
          contentType: "mixed",
          protiumNote:
            "TLM ports enable UVM testbenches to communicate with Protium-accelerated DUTs.",
        },
        {
          slug: "constrained-random-verification",
          title: "Constrained Random Verification",
          difficulty: "intermediate",
          estimatedMinutes: 18,
          contentType: "mixed",
        },
        {
          slug: "uvm-configuration-factory",
          title: "UVM Configuration & Factory",
          difficulty: "advanced",
          estimatedMinutes: 15,
          contentType: "mixed",
        },
        {
          slug: "building-complete-uvm-testbench",
          title: "Building a Complete UVM Testbench",
          difficulty: "advanced",
          estimatedMinutes: 20,
          contentType: "mixed",
          labUrl: "https://www.edaplayground.com/",
        },
      ],
    },
    {
      id: "coverage",
      name: "Coverage",
      description:
        "Functional and code coverage: bins, cross coverage, and coverage-driven verification flow.",
      order: 6,
      estimatedHours: 2.0,
      phaseId: "phase-2",
      lessons: [
        {
          slug: "why-coverage-matters",
          title: "Why Coverage Matters",
          difficulty: "beginner",
          estimatedMinutes: 10,
          contentType: "visual",
        },
        {
          slug: "functional-coverage-basics",
          title: "Functional Coverage Basics",
          difficulty: "intermediate",
          estimatedMinutes: 15,
          contentType: "mixed",
        },
        {
          slug: "code-coverage-statement-branch-toggle",
          title: "Code Coverage: Statement, Branch, Toggle",
          difficulty: "intermediate",
          estimatedMinutes: 15,
          contentType: "mixed",
        },
        {
          slug: "cross-coverage-bins",
          title: "Cross Coverage & Bins",
          difficulty: "intermediate",
          estimatedMinutes: 18,
          contentType: "mixed",
        },
        {
          slug: "coverage-driven-verification-flow",
          title: "Coverage-Driven Verification Flow",
          difficulty: "intermediate",
          estimatedMinutes: 15,
          contentType: "visual",
          protiumNote:
            "Protium's fast execution helps reach coverage targets that simulation alone can't achieve in reasonable time.",
        },
        {
          slug: "verification-sign-off-criteria",
          title: "Verification Sign-Off Criteria",
          difficulty: "intermediate",
          estimatedMinutes: 12,
          contentType: "visual",
        },
      ],
    },

    // ── Phase 3: Physical Design ─────────────────────────────────────────────
    {
      id: "sta",
      name: "Static Timing Analysis",
      description:
        "Timing analysis fundamentals: paths, setup/hold, slack, and timing exceptions.",
      order: 7,
      estimatedHours: 2.5,
      phaseId: "phase-3",
      lessons: [
        {
          slug: "what-is-sta",
          title: "What is Static Timing Analysis?",
          difficulty: "beginner",
          estimatedMinutes: 12,
          contentType: "visual",
        },
        {
          slug: "timing-paths-explained",
          title: "Timing Paths Explained",
          difficulty: "beginner",
          estimatedMinutes: 15,
          contentType: "visual",
        },
        {
          slug: "setup-hold-violations",
          title: "Setup & Hold Violations",
          difficulty: "intermediate",
          estimatedMinutes: 15,
          contentType: "mixed",
        },
        {
          slug: "clock-skew-uncertainty",
          title: "Clock Skew & Uncertainty",
          difficulty: "intermediate",
          estimatedMinutes: 15,
          contentType: "mixed",
        },
        {
          slug: "slack-key-metric",
          title: "Slack: The Key Metric",
          difficulty: "intermediate",
          estimatedMinutes: 12,
          contentType: "visual",
        },
        {
          slug: "timing-exceptions-false-paths-multicycle",
          title: "Timing Exceptions: False Paths & Multicycle",
          difficulty: "intermediate",
          estimatedMinutes: 18,
          contentType: "mixed",
          protiumNote:
            "Understanding timing exceptions helps debug Protium compilation timing failures.",
        },
        {
          slug: "reading-timing-reports",
          title: "Reading Timing Reports",
          difficulty: "intermediate",
          estimatedMinutes: 15,
          contentType: "visual",
        },
      ],
    },
    {
      id: "place-route",
      name: "Place & Route",
      description:
        "Physical design flow: floorplanning, placement, clock tree synthesis, routing, and sign-off.",
      order: 8,
      estimatedHours: 2.5,
      phaseId: "phase-3",
      lessons: [
        {
          slug: "physical-design-flow-overview",
          title: "Physical Design Flow Overview",
          difficulty: "beginner",
          estimatedMinutes: 12,
          contentType: "visual",
        },
        {
          slug: "floorplanning-basics",
          title: "Floorplanning Basics",
          difficulty: "intermediate",
          estimatedMinutes: 15,
          contentType: "visual",
        },
        {
          slug: "placement-algorithms-strategies",
          title: "Placement Algorithms & Strategies",
          difficulty: "intermediate",
          estimatedMinutes: 15,
          contentType: "mixed",
        },
        {
          slug: "clock-tree-synthesis",
          title: "Clock Tree Synthesis",
          difficulty: "intermediate",
          estimatedMinutes: 18,
          contentType: "mixed",
        },
        {
          slug: "routing-global-detailed",
          title: "Routing: Global & Detailed",
          difficulty: "intermediate",
          estimatedMinutes: 15,
          contentType: "mixed",
        },
        {
          slug: "parasitic-extraction-back-annotation",
          title: "Parasitic Extraction & Back-Annotation",
          difficulty: "advanced",
          estimatedMinutes: 15,
          contentType: "mixed",
        },
        {
          slug: "drc-lvs",
          title: "Design Rule Checking (DRC) & LVS",
          difficulty: "intermediate",
          estimatedMinutes: 12,
          contentType: "visual",
        },
      ],
    },
    {
      id: "power-si",
      name: "Power & Signal Integrity",
      description:
        "Power dissipation, delivery networks, low-power techniques, signal integrity, and reliability.",
      order: 9,
      estimatedHours: 2.0,
      phaseId: "phase-3",
      lessons: [
        {
          slug: "power-dissipation-dynamic-static",
          title: "Power Dissipation: Dynamic & Static",
          difficulty: "beginner",
          estimatedMinutes: 12,
          contentType: "visual",
        },
        {
          slug: "power-delivery-networks",
          title: "Power Delivery Networks",
          difficulty: "intermediate",
          estimatedMinutes: 15,
          contentType: "mixed",
        },
        {
          slug: "low-power-design-techniques",
          title: "Low-Power Design Techniques",
          difficulty: "intermediate",
          estimatedMinutes: 18,
          contentType: "mixed",
        },
        {
          slug: "signal-integrity-crosstalk-noise",
          title: "Signal Integrity: Crosstalk & Noise",
          difficulty: "intermediate",
          estimatedMinutes: 15,
          contentType: "mixed",
        },
        {
          slug: "electromigration-reliability",
          title: "Electromigration & Reliability",
          difficulty: "intermediate",
          estimatedMinutes: 12,
          contentType: "visual",
        },
        {
          slug: "power-aware-verification",
          title: "Power-Aware Verification",
          difficulty: "intermediate",
          estimatedMinutes: 15,
          contentType: "mixed",
          protiumNote:
            "FPGA-based Protium runs consume significant power. Understanding power helps predict thermal issues.",
        },
      ],
    },

    // ── Phase 4: Protium Mastery ─────────────────────────────────────────────
    {
      id: "fpga-arch",
      name: "FPGA Architecture",
      description:
        "FPGA fundamentals: LUTs, CLBs, block RAM, design flow, and multi-FPGA partitioning.",
      order: 10,
      estimatedHours: 2.0,
      phaseId: "phase-4",
      lessons: [
        {
          slug: "fpga-vs-asic",
          title: "FPGA vs ASIC: When & Why",
          difficulty: "beginner",
          estimatedMinutes: 12,
          contentType: "visual",
          protiumNote:
            "Protium IS an FPGA-based platform. This module explains the hardware you're targeting.",
        },
        {
          slug: "fpga-building-blocks",
          title: "FPGA Building Blocks: LUTs, CLBs, DSPs",
          difficulty: "beginner",
          estimatedMinutes: 15,
          contentType: "visual",
        },
        {
          slug: "fpga-memory-block-ram-distributed",
          title: "FPGA Memory: Block RAM & Distributed",
          difficulty: "intermediate",
          estimatedMinutes: 15,
          contentType: "mixed",
        },
        {
          slug: "fpga-design-flow",
          title: "FPGA Design Flow",
          difficulty: "intermediate",
          estimatedMinutes: 12,
          contentType: "visual",
        },
        {
          slug: "fpga-vs-asic-prototyping-trade-offs",
          title: "FPGA vs ASIC Prototyping Trade-offs",
          difficulty: "intermediate",
          estimatedMinutes: 15,
          contentType: "mixed",
        },
        {
          slug: "multi-fpga-partitioning-concepts",
          title: "Multi-FPGA Partitioning Concepts",
          difficulty: "intermediate",
          estimatedMinutes: 18,
          contentType: "mixed",
          protiumNote:
            "Protium uses multiple FPGAs. Understanding partitioning is core to your work.",
        },
      ],
    },
    {
      id: "protium-compile",
      name: "Protium Compilation",
      description:
        "Protium compilation pipeline: elaboration, partitioning, FPGA mapping, place & route, and timing closure.",
      order: 11,
      estimatedHours: 2.5,
      phaseId: "phase-4",
      lessons: [
        {
          slug: "protium-architecture-overview",
          title: "Protium Architecture Overview",
          difficulty: "beginner",
          estimatedMinutes: 15,
          contentType: "visual",
          protiumNote:
            "This IS your platform. Understanding it architecturally will change how you approach every feature.",
        },
        {
          slug: "protium-compilation-elaboration",
          title: "Protium Compilation: Elaboration",
          difficulty: "intermediate",
          estimatedMinutes: 15,
          contentType: "mixed",
        },
        {
          slug: "design-partitioning-for-protium",
          title: "Design Partitioning for Protium",
          difficulty: "intermediate",
          estimatedMinutes: 18,
          contentType: "mixed",
        },
        {
          slug: "protium-synthesis-fpga-mapping",
          title: "Protium Synthesis & FPGA Mapping",
          difficulty: "intermediate",
          estimatedMinutes: 18,
          contentType: "mixed",
        },
        {
          slug: "protium-place-route",
          title: "Protium Place & Route",
          difficulty: "intermediate",
          estimatedMinutes: 15,
          contentType: "mixed",
        },
        {
          slug: "timing-closure-on-protium",
          title: "Timing Closure on Protium",
          difficulty: "advanced",
          estimatedMinutes: 18,
          contentType: "mixed",
        },
        {
          slug: "incremental-compilation-iteration",
          title: "Incremental Compilation & Iteration",
          difficulty: "intermediate",
          estimatedMinutes: 12,
          contentType: "visual",
        },
      ],
    },
    {
      id: "protium-runtime",
      name: "Protium Runtime",
      description:
        "Protium runtime: execution model, software bring-up, debug, profiling, and co-simulation.",
      order: 12,
      estimatedHours: 2.0,
      phaseId: "phase-4",
      lessons: [
        {
          slug: "protium-runtime-execution-model",
          title: "Protium Runtime Execution Model",
          difficulty: "intermediate",
          estimatedMinutes: 15,
          contentType: "mixed",
        },
        {
          slug: "software-bring-up-on-protium",
          title: "Software Bring-Up on Protium",
          difficulty: "intermediate",
          estimatedMinutes: 18,
          contentType: "mixed",
        },
        {
          slug: "debug-probes-waveform-capture",
          title: "Debug Probes & Waveform Capture",
          difficulty: "intermediate",
          estimatedMinutes: 15,
          contentType: "mixed",
        },
        {
          slug: "performance-profiling",
          title: "Performance Profiling",
          difficulty: "intermediate",
          estimatedMinutes: 15,
          contentType: "mixed",
        },
        {
          slug: "co-simulation-rtl-sim-vs-protium",
          title: "Co-Simulation: RTL Sim vs Protium",
          difficulty: "advanced",
          estimatedMinutes: 18,
          contentType: "mixed",
        },
        {
          slug: "real-world-protium-workflows",
          title: "Real-World Protium Workflows",
          difficulty: "intermediate",
          estimatedMinutes: 12,
          contentType: "visual",
          protiumNote:
            "This lesson ties everything together — how customers actually use what you build.",
        },
      ],
    },
  ];

  for (const mod of modules) {
    const { lessons, ...moduleData } = mod;

    await prisma.module.upsert({
      where: { id: moduleData.id },
      update: moduleData,
      create: moduleData,
    });

    console.log(`  Module: ${moduleData.name} (${lessons.length} lessons)`);

    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      await prisma.lesson.upsert({
        where: {
          moduleId_slug: {
            moduleId: moduleData.id,
            slug: lesson.slug,
          },
        },
        update: {
          title: lesson.title,
          description: lesson.description ?? "",
          order: i + 1,
          estimatedMinutes: lesson.estimatedMinutes,
          contentType: lesson.contentType,
          difficulty: lesson.difficulty,
          protiumNote: lesson.protiumNote ?? null,
          labUrl: lesson.labUrl ?? null,
        },
        create: {
          slug: lesson.slug,
          title: lesson.title,
          description: lesson.description ?? "",
          order: i + 1,
          estimatedMinutes: lesson.estimatedMinutes,
          contentType: lesson.contentType,
          difficulty: lesson.difficulty,
          moduleId: moduleData.id,
          protiumNote: lesson.protiumNote ?? null,
          labUrl: lesson.labUrl ?? null,
        },
      });
    }
  }

  // ─── Module Prerequisites ──────────────────────────────────────────────────
  console.log("Creating module prerequisites...");

  const prerequisites: [string, string][] = [
    ["verilog", "digital-design"],
    ["synthesis", "verilog"],
    ["systemverilog", "verilog"],
    ["uvm", "systemverilog"],
    ["coverage", "uvm"],
    ["sta", "synthesis"],
    ["place-route", "synthesis"],
    ["place-route", "sta"],
    ["power-si", "place-route"],
    ["fpga-arch", "digital-design"],
    ["protium-compile", "fpga-arch"],
    ["protium-compile", "synthesis"],
    ["protium-runtime", "protium-compile"],
  ];

  for (const [moduleId, prerequisiteId] of prerequisites) {
    await prisma.modulePrerequisite.upsert({
      where: {
        moduleId_prerequisiteId: { moduleId, prerequisiteId },
      },
      update: {},
      create: { moduleId, prerequisiteId },
    });
  }

  // ─── Default UserSettings ──────────────────────────────────────────────────
  console.log("Creating default user settings...");
  await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  // ─── Default Streak ────────────────────────────────────────────────────────
  console.log("Creating default streak...");
  await prisma.streak.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  // ─── Summary ───────────────────────────────────────────────────────────────
  const phaseCount = await prisma.phase.count();
  const moduleCount = await prisma.module.count();
  const lessonCount = await prisma.lesson.count();
  const prereqCount = await prisma.modulePrerequisite.count();

  console.log("\nSeed complete!");
  console.log(`  ${phaseCount} phases`);
  console.log(`  ${moduleCount} modules`);
  console.log(`  ${lessonCount} lessons`);
  console.log(`  ${prereqCount} prerequisites`);
  console.log(`  1 default user with settings and streak`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
