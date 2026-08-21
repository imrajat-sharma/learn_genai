import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatMistralAI } from "@langchain/mistralai";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { z } from "zod";
import Config from "../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_TOPIC = "web development";
const DEFAULT_COUNT = 10;
const DEFAULT_DIFFICULTY = "medium";
const SUPPORTED_DIFFICULTIES = ["easy", "medium", "expert"];
const VALID_QUESTION_COUNTS = [10, 20, 50, 100];
const TIME_LIMITS = Object.freeze({ 10: 300, 20: 600, 50: 1200, 100: 2400 });
const CONTENT_TYPES = Object.freeze({
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
});

const quizSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).min(4).max(4),
  correctAnswer: z.string(),
  explanation: z.string(),
});

const quizListSchema = z.array(quizSchema);
const parser = StructuredOutputParser.fromZodSchema(quizListSchema);
const formatInstructions = parser.getFormatInstructions();

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "You are a helpful AI quiz generator. Create a diverse set of multiple-choice questions for a quiz.",
  ],
  [
    "human",
    `Generate {count} quiz questions about {topic} at {difficulty} difficulty. Return JSON only as an array of objects.
Each item must follow this structure:
{{question, options, correctAnswer, explanation}}

Important rules:
- Each question must be unique, clear, and different in wording from every other question.
- Each options array must contain exactly 4 distinct strings with no duplicates.
- correctAnswer must exactly match one of the options.
- explanation must be a short reason why the answer is correct.
- Make the questions varied, random, and suitable for {difficulty} difficulty.
- Avoid repetitive phrases, repeated correct-answer wording, and near-duplicate distractors.

{formatInstructions}`,
  ],
]);

const model = new ChatMistralAI({
  apiKey: Config.apiKey,
  model: "mistral-small-2603",
});

function shuffleArray(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function normalizeDifficulty(difficulty) {
  const value = String(difficulty ?? DEFAULT_DIFFICULTY).toLowerCase();
  return SUPPORTED_DIFFICULTIES.includes(value) ? value : DEFAULT_DIFFICULTY;
}

function normalizeTopic(topic) {
  return String(topic ?? DEFAULT_TOPIC).trim() || DEFAULT_TOPIC;
}

function normalizeCount(count) {
  const parsed = Number(count);
  return VALID_QUESTION_COUNTS.includes(parsed) ? parsed : DEFAULT_COUNT;
}

function getTimeLimit(count) {
  return TIME_LIMITS[count] ?? TIME_LIMITS[DEFAULT_COUNT];
}

function getMatchingOption(options, target) {
  const normalizedTarget = String(target ?? "")
    .trim()
    .toLowerCase();
  return (
    options.find(
      (option) => String(option).trim().toLowerCase() === normalizedTarget,
    ) || options[0]
  );
}

function dedupeOptions(options, fallbackTopic, fallbackIndex) {
  const unique = [];
  const seen = new Set();

  for (const option of options ?? []) {
    const value = String(option).trim();
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;
    unique.push(value);
    seen.add(key);
  }

  while (unique.length < 4) {
    const fallbackOption = `${fallbackTopic} option ${unique.length + fallbackIndex + 1}`;
    const key = fallbackOption.toLowerCase();
    if (!seen.has(key)) {
      unique.push(fallbackOption);
      seen.add(key);
    }
  }

  return shuffleArray(unique);
}

function buildUniqueQuestionText(
  topic,
  difficulty,
  index,
  usedQuestions = new Set(),
) {
  const topicLabel = normalizeTopic(topic);
  const templates = {
    easy: [
      (value) => `What is a basic idea behind ${value}?`,
      (value) => `Which activity helps most when learning ${value}?`,
      (value) => `What is the main purpose of ${value}?`,
      (value) => `Which statement best describes ${value}?`,
      (value) => `Why does ${value} matter in practice?`,
      (value) => `What should someone understand first about ${value}?`,
    ],
    medium: [
      (value) => `How does ${value} usually work in practice?`,
      (value) => `Which statement best explains ${value}?`,
      (value) => `What is an important step when working with ${value}?`,
      (value) => `Which approach is most useful for ${value}?`,
      (value) => `What makes ${value} easier to master?`,
      (value) => `Which habit improves results with ${value}?`,
    ],
    expert: [
      (value) => `Which advanced principle is most relevant to ${value}?`,
      (value) => `How would an expert approach a problem in ${value}?`,
      (value) => `Which scenario best demonstrates mastery of ${value}?`,
      (value) => `What is the strongest strategy for ${value}?`,
      (value) => `How would a specialist evaluate ${value}?`,
      (value) => `Which trade-off matters most in ${value}?`,
    ],
  };

  const pool = templates[normalizeDifficulty(difficulty)] || templates.medium;
  const candidates = pool.map((builder) => builder(topicLabel));
  const available = candidates.filter(
    (question) => !usedQuestions.has(question),
  );

  if (available.length > 0) {
    return available[index % available.length];
  }

  return `${topicLabel} concept ${index + 1}`;
}

function buildUniqueOptionSet(correctAnswer, topic, difficulty, index) {
  const topicLabel = normalizeTopic(topic);
  const difficultyLabel = normalizeDifficulty(difficulty);
  const correctAnswerPool = {
    easy: [
      `${topicLabel} is best learned through guided practice`,
      `${topicLabel} becomes clearer with examples`,
      `${topicLabel} improves with deliberate repetition`,
      `${topicLabel} is easier when broken into steps`,
    ],
    medium: [
      `${topicLabel} improves through structured experiments`,
      `${topicLabel} requires careful debugging`,
      `${topicLabel} becomes easier with consistent review`,
      `${topicLabel} benefits from deliberate comparison`,
    ],
    expert: [
      `${topicLabel} benefits from trade-off analysis`,
      `${topicLabel} often depends on edge-case evaluation`,
      `${topicLabel} is strongest when patterns are compared carefully`,
      `${topicLabel} improves through rigorous validation`,
    ],
  };

  const distractorPool = {
    easy: [
      `${topicLabel} can be understood by reading once`,
      `${topicLabel} is mostly about memorizing terms`,
      `${topicLabel} does not require review`,
      `${topicLabel} is easiest when ignored`,
    ],
    medium: [
      `${topicLabel} can be learned without planning`,
      `${topicLabel} improves by avoiding feedback`,
      `${topicLabel} becomes simpler when skipped`,
      `${topicLabel} does not require experimentation`,
    ],
    expert: [
      `${topicLabel} can be solved without trade-offs`,
      `${topicLabel} improves with vague assumptions`,
      `${topicLabel} becomes easier without constraints`,
      `${topicLabel} requires no validation`,
    ],
  };

  const safeCorrectAnswer = String(
    correctAnswer ||
      correctAnswerPool[difficultyLabel]?.[
        index % correctAnswerPool[difficultyLabel].length
      ] ||
      `${topicLabel} benefits from practice and clear examples`,
  ).trim();

  const options = [safeCorrectAnswer];
  const seen = new Set([safeCorrectAnswer.toLowerCase()]);
  const pool = distractorPool[difficultyLabel] || distractorPool.medium;

  for (let offset = 0; offset < pool.length; offset += 1) {
    const distractor = String(pool[(index + offset) % pool.length]).trim();
    const key = distractor.toLowerCase();
    if (!distractor || seen.has(key)) continue;
    options.push(distractor);
    seen.add(key);
    if (options.length === 4) break;
  }

  while (options.length < 4) {
    const fallbackOption = `${topicLabel} option ${options.length + index + 1}`;
    const key = fallbackOption.toLowerCase();
    if (!seen.has(key)) {
      options.push(fallbackOption);
      seen.add(key);
    }
  }

  return {
    options: shuffleArray(options),
    correctAnswer: safeCorrectAnswer,
  };
}

function buildFallbackQuestion(topic, index, difficulty) {
  const topicLabel = normalizeTopic(topic);
  const difficultyLabel = normalizeDifficulty(difficulty);
  const question = buildUniqueQuestionText(topicLabel, difficultyLabel, index);
  const { options, correctAnswer } = buildUniqueOptionSet(
    `${topicLabel} benefits from practice and clear examples`,
    topicLabel,
    difficultyLabel,
    index,
  );

  return {
    question,
    options,
    correctAnswer,
    explanation: `This option best fits ${difficultyLabel} understanding of ${topicLabel}.`,
  };
}

function normalizeQuiz(data, topic, difficulty, index = 0) {
  const questionText = String(
    data?.question || `What is important in ${topic}?`,
  ).trim();
  const providedOptions = Array.isArray(data?.options)
    ? data.options.map((option) => String(option ?? "").trim()).filter(Boolean)
    : [];

  if (providedOptions.length >= 4) {
    const options = dedupeOptions(
      providedOptions,
      normalizeTopic(topic),
      index,
    );
    const safeCorrectAnswer = String(data?.correctAnswer || options[0]).trim();
    return {
      question: questionText,
      options,
      correctAnswer: getMatchingOption(options, safeCorrectAnswer),
      explanation: String(
        data?.explanation || `The correct answer is ${safeCorrectAnswer}.`,
      ).trim(),
      difficulty: normalizeDifficulty(difficulty),
    };
  }

  const { options, correctAnswer } = buildUniqueOptionSet(
    data?.correctAnswer || `A practical answer for ${questionText}`,
    topic,
    difficulty,
    index,
  );

  return {
    question: questionText,
    options,
    correctAnswer,
    explanation: String(
      data?.explanation || `The correct answer is ${correctAnswer}.`,
    ).trim(),
    difficulty: normalizeDifficulty(difficulty),
  };
}

function normalizeQuizList(data, topic, count, difficulty) {
  const safeCount = normalizeCount(count);
  const rawQuestions = Array.isArray(data) ? data : [];
  const normalized = [];
  const usedQuestions = new Set();
  const safeTopic = normalizeTopic(topic);
  const safeDifficulty = normalizeDifficulty(difficulty);

  for (let index = 0; index < safeCount; index += 1) {
    const sourceQuestion = rawQuestions[index];
    const candidate = normalizeQuiz(
      sourceQuestion || buildFallbackQuestion(safeTopic, index, safeDifficulty),
      safeTopic,
      safeDifficulty,
      index,
    );

    let questionText = candidate.question || `Question ${index + 1}`;
    if (usedQuestions.has(questionText)) {
      questionText = buildUniqueQuestionText(
        safeTopic,
        safeDifficulty,
        index,
        usedQuestions,
      );
      candidate.question = questionText;
      const fallback = buildUniqueOptionSet(
        undefined,
        safeTopic,
        safeDifficulty,
        index,
      );
      candidate.options = fallback.options;
      candidate.correctAnswer = fallback.correctAnswer;
    }

    usedQuestions.add(questionText);
    normalized.push(candidate);
  }

  return shuffleArray(normalized).map((question) => ({
    ...question,
    options: dedupeOptions(question.options, normalizeTopic(topic), 0),
    correctAnswer:
      getMatchingOption(question.options, question.correctAnswer) ||
      question.options[0],
  }));
}

async function generateQuizFromModel(topic, count, difficulty) {
  const safeTopic = normalizeTopic(topic);
  const safeCount = normalizeCount(count);
  const safeDifficulty = normalizeDifficulty(difficulty);

  const formattedMessages = await prompt.formatMessages({
    topic: safeTopic,
    count: safeCount,
    difficulty: safeDifficulty,
    formatInstructions,
  });

  const response = await model.invoke(formattedMessages);
  const parsed = await parser.parse(response.content);

  return {
    topic: safeTopic,
    count: safeCount,
    difficulty: safeDifficulty,
    timeLimitSeconds: getTimeLimit(safeCount),
    questions: normalizeQuizList(parsed, safeTopic, safeCount, safeDifficulty),
  };
}

function buildFallbackQuiz(topic, count, difficulty) {
  const safeTopic = normalizeTopic(topic);
  const safeCount = normalizeCount(count);
  const safeDifficulty = normalizeDifficulty(difficulty);

  return {
    topic: safeTopic,
    count: safeCount,
    difficulty: safeDifficulty,
    timeLimitSeconds: getTimeLimit(safeCount),
    questions: normalizeQuizList(
      Array.from({ length: safeCount }, (_, index) =>
        buildFallbackQuestion(safeTopic, index, safeDifficulty),
      ),
      safeTopic,
      safeCount,
      safeDifficulty,
    ),
  };
}

export async function generateQuizData(
  topic = DEFAULT_TOPIC,
  count = DEFAULT_COUNT,
  difficulty = DEFAULT_DIFFICULTY,
) {
  const safeTopic = normalizeTopic(topic);
  const safeCount = normalizeCount(count);
  const safeDifficulty = normalizeDifficulty(difficulty);

  if (!Config.apiKey) {
    return buildFallbackQuiz(safeTopic, safeCount, safeDifficulty);
  }

  try {
    return await generateQuizFromModel(safeTopic, safeCount, safeDifficulty);
  } catch (error) {
    console.error("Quiz generation failed:", error);
    return buildFallbackQuiz(safeTopic, safeCount, safeDifficulty);
  }
}

function serveStaticFile(req, res) {
  const requestUrl = new URL(req.url, "http://localhost");
  const requestPath =
    requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const normalizedPath =
    requestPath === "/test" || requestPath === "/test/"
      ? "/test.html"
      : requestPath;
  const safePath = path.normalize(normalizedPath).replace(/^[/\\]+/, "");
  const resolvedRoot = path.resolve(__dirname);
  const filePath = path.resolve(resolvedRoot, safePath);
  const relativePath = path.relative(resolvedRoot, filePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = CONTENT_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  });
}

function startServer(port = Number(process.env.PORT || 3000), maxPort = 3010) {
  const server = http.createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (req.url?.startsWith("/api/quiz")) {
      const url = new URL(req.url, "http://localhost");
      const topic = url.searchParams.get("topic") || DEFAULT_TOPIC;
      const count = url.searchParams.get("count") || DEFAULT_COUNT;
      const difficulty =
        url.searchParams.get("difficulty") || DEFAULT_DIFFICULTY;
      const quiz = await generateQuizData(topic, count, difficulty);
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(quiz));
      return;
    }

    serveStaticFile(req, res);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      const nextPort = port + 1;
      if (nextPort <= maxPort) {
        console.log(`Port ${port} is busy, trying ${nextPort}...`);
        startServer(nextPort, maxPort);
        return;
      }
    }

    console.error(error);
    process.exit(1);
  });

  server.listen(port, () => {
    const address = server.address();
    const actualPort =
      typeof address === "object" && address ? address.port : port;
    console.log(`Quiz server running at http://localhost:${actualPort}`);
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  startServer();
}
