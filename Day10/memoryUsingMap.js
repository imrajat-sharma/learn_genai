import { Mistral } from "@mistralai/mistralai";
import Config from "../config.js";

if (!Config.apiKey) {
  throw new Error("Mistral API Key is not Found!");
}
const mistral = new Mistral({ apiKey: Config.apiKey });

const memories = new Map();

const systemMessage = {
  role: "system",
  content: "You are a helpful assistant, be polite and respectful.",
};

async function chat(conversationId, message) {
  if (!conversationId || typeof conversationId !== "string") {
    throw new Error("conversationId is required.");
  }

  if (!message || typeof message !== "string") {
    throw new Error("message must be a non-empty string.");
  }
  console.log("User: ", message);

  if (!memories.has(conversationId)) {
    memories.set(conversationId, []);
  }

  const history = memories.get(conversationId);

  history.push({
    role: "user",
    content: message,
  });

  const recentMessages = [systemMessage, ...history.slice(-10)];

  const chatResponse = await mistral.chat.complete({
    model: Config.llm,
    messages: recentMessages,
  });

  const assistantMessage = {
    role: "assistant",
    content: chatResponse.choices[0].message.content,
  };

  history.push(assistantMessage);
  console.log("AI: ", assistantMessage.content);
}

await chat("abc123", "Hey! my name is rajat");
await chat("abc123", "What up!");
await chat("abc123", "Do you know me?");
