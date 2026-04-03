import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const SKILL_PATH =
  process.env.NOTEBOOKLM_SKILL_PATH ||
  "/Users/ankitgupta/.claude/skills/notebooklm";

const QUERY_TIMEOUT = 180_000; // 3 minutes
const DAILY_LIMIT = 50;

// In-memory rate limit counter (resets on server restart)
let queriesUsedToday = 0;
let lastResetDate = new Date().toISOString().split("T")[0];

function checkAndResetRateLimit(): void {
  const today = new Date().toISOString().split("T")[0];
  if (today !== lastResetDate) {
    queriesUsedToday = 0;
    lastResetDate = today;
  }
}

export function getQueriesRemaining(): number {
  checkAndResetRateLimit();
  return DAILY_LIMIT - queriesUsedToday;
}

function parseResponse(stdout: string): string {
  // Extract content between === delimiters
  const lines = stdout.split("\n");
  let inAnswer = false;
  const answerLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("===")) {
      if (inAnswer) break;
      inAnswer = true;
      continue;
    }
    if (inAnswer) {
      answerLines.push(line);
    }
  }

  let answer = answerLines.join("\n").trim();

  // If no === delimiters found, use the full stdout
  if (!answer) {
    answer = stdout.trim();
  }

  // Strip FOLLOW_UP_REMINDER suffix
  const reminderIndex = answer.indexOf("EXTREMELY IMPORTANT:");
  if (reminderIndex !== -1) {
    answer = answer.substring(0, reminderIndex).trim();
  }

  return answer;
}

export async function queryNotebook(
  question: string,
  notebookId?: string,
  notebookUrl?: string
): Promise<string> {
  checkAndResetRateLimit();

  if (queriesUsedToday >= DAILY_LIMIT) {
    throw new Error(
      `Daily NotebookLM query limit reached (${DAILY_LIMIT}). Try again tomorrow.`
    );
  }

  const args = ["scripts/run.py", "ask_question.py", "--question", question];

  if (notebookUrl) {
    args.push("--notebook-url", notebookUrl);
  } else if (notebookId) {
    args.push("--notebook-id", notebookId);
  }

  try {
    queriesUsedToday++;
    const { stdout } = await execFileAsync("python", args, {
      cwd: SKILL_PATH,
      timeout: QUERY_TIMEOUT,
    });
    return parseResponse(stdout);
  } catch (error) {
    queriesUsedToday--; // Refund on failure
    throw error;
  }
}

export async function checkAuthStatus(): Promise<{
  authenticated: boolean;
  message: string;
}> {
  try {
    const { stdout } = await execFileAsync(
      "python",
      ["scripts/run.py", "auth_manager.py", "status"],
      { cwd: SKILL_PATH, timeout: 30_000 }
    );
    const isAuth = stdout.toLowerCase().includes("authenticated");
    return {
      authenticated: isAuth,
      message: stdout.trim(),
    };
  } catch {
    return { authenticated: false, message: "Failed to check auth status" };
  }
}

export async function listNotebooks(): Promise<string> {
  try {
    const { stdout } = await execFileAsync(
      "python",
      ["scripts/run.py", "notebook_manager.py", "list"],
      { cwd: SKILL_PATH, timeout: 30_000 }
    );
    return stdout.trim();
  } catch (error) {
    throw new Error(`Failed to list notebooks: ${error}`);
  }
}

export async function addNotebook(
  url: string,
  name: string,
  description: string,
  topics: string
): Promise<string> {
  try {
    const { stdout } = await execFileAsync(
      "python",
      [
        "scripts/run.py",
        "notebook_manager.py",
        "add",
        "--url",
        url,
        "--name",
        name,
        "--description",
        description,
        "--topics",
        topics,
      ],
      { cwd: SKILL_PATH, timeout: 30_000 }
    );
    return stdout.trim();
  } catch (error) {
    throw new Error(`Failed to add notebook: ${error}`);
  }
}
