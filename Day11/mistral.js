import { Mistral } from "@mistralai/mistralai";
import Config from "../config.js";

const client = new Mistral({ apiKey: Config.apiKey });

export default async function chat({
  messages,
  model = "mistral-small-2603",
  temperature = 0.7,
  maxTokens = 500,
}) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("Messages must be a non-empty array");
  }

  const lastMessage = messages[messages.length - 1];

  if (!lastMessage.content || lastMessage.content.trim() === "") {
    throw new Error("Message content cannot be empty");
  }

  const startTime = Date.now();
  try {
    const response = await client.chat.complete({
      model,
      temperature,
      maxTokens,
      messages,
    });

    const duration = Date.now() - startTime;

    console.log(`Response time: ${duration} ms`);
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Mistral API error:", error.message);
    throw new Error("Unable to generate a response");
  }
}
