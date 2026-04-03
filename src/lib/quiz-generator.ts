interface GeneratedQuestion {
  questionText: string;
  questionType: "multiple_choice" | "true_false";
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: string;
  order: number;
}

/**
 * Build a prompt for generating quiz questions via NotebookLM
 */
export function buildQuizPrompt(
  lessonTitle: string,
  lessonContent: string,
  numQuestions: number = 4
): string {
  // Truncate content to avoid overly long prompts
  const truncated = lessonContent.substring(0, 3000);

  return `Based on this lesson about "${lessonTitle}", create exactly ${numQuestions} quiz questions.

Lesson content:
${truncated}

For each question, use this exact format:
Q1: [question text]
TYPE: multiple_choice
A) [option]
B) [option]
C) [option]
D) [option]
CORRECT: [letter]
EXPLANATION: [why this answer is correct]

Or for true/false:
Q2: [statement]
TYPE: true_false
CORRECT: true/false
EXPLANATION: [why]

Create a mix: ${numQuestions - 1} multiple choice and 1 true/false.
Questions should test understanding, not just memorization.`;
}

/**
 * Parse quiz questions from a NotebookLM response
 */
export function parseQuizResponse(rawText: string): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const questionBlocks = rawText.split(/Q\d+:/);

  for (let i = 1; i < questionBlocks.length; i++) {
    const block = questionBlocks[i].trim();
    const lines = block.split("\n").map(l => l.trim()).filter(Boolean);

    if (lines.length < 3) continue;

    const questionText = lines[0];
    const typeLine = lines.find(l => l.startsWith("TYPE:"));
    const correctLine = lines.find(l => l.startsWith("CORRECT:"));
    const explanationLine = lines.find(l => l.startsWith("EXPLANATION:"));

    const questionType = typeLine?.includes("true_false") ? "true_false" : "multiple_choice";

    const options: string[] = [];
    if (questionType === "multiple_choice") {
      for (const line of lines) {
        const match = line.match(/^([A-D])\)\s*(.+)/);
        if (match) {
          options.push(match[2]);
        }
      }
    } else {
      options.push("True", "False");
    }

    let correctAnswer = correctLine?.replace("CORRECT:", "").trim() || "";
    if (questionType === "multiple_choice" && correctAnswer.length === 1) {
      const index = correctAnswer.charCodeAt(0) - "A".charCodeAt(0);
      if (index >= 0 && index < options.length) {
        correctAnswer = options[index];
      }
    }

    const explanation = explanationLine?.replace("EXPLANATION:", "").trim() || "";

    questions.push({
      questionText,
      questionType,
      options: options.length > 0 ? options : ["True", "False"],
      correctAnswer,
      explanation,
      difficulty: "medium",
      order: i,
    });
  }

  return questions;
}

/**
 * Generate fallback quiz questions when NotebookLM is unavailable
 * Creates basic comprehension questions from key terms
 */
export function generateFallbackQuestions(
  lessonTitle: string,
  keyTerms: string[]
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];

  if (keyTerms.length >= 1) {
    questions.push({
      questionText: `What is the primary topic covered in the "${lessonTitle}" lesson?`,
      questionType: "multiple_choice",
      options: [
        keyTerms[0],
        "Unrelated concept A",
        "Unrelated concept B",
        "None of the above",
      ],
      correctAnswer: keyTerms[0],
      explanation: `This lesson covers ${keyTerms[0]} as a key concept.`,
      difficulty: "easy",
      order: 1,
    });
  }

  questions.push({
    questionText: `Understanding ${lessonTitle} is important for FPGA-based prototyping work.`,
    questionType: "true_false",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "All topics in this curriculum connect to FPGA prototyping and Protium workflows.",
    difficulty: "easy",
    order: questions.length + 1,
  });

  return questions;
}
