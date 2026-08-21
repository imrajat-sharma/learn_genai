import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import { ChatMistralAI } from "@langchain/mistralai";
import Config from "../config.js";

const model = new ChatMistralAI({
  model: "mistral-small-2603",
  apiKey: Config.apiKey,
  temperature: 0.9,
  maxOutputTokens: 512,
});

const prompt = PromptTemplate.fromTemplate(
  "Write a short poem about a {subject} in {word_count} words.",
);

const chatPrompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a poet."],
  ["human", "Write a short poem about a {subject} in {word_count} words."],
]);

const pipe = chatPrompt.pipe(model);

const res = await pipe.invoke({
  subject: "doraemon",
  word_count: 10,
});

console.log(res.content);
