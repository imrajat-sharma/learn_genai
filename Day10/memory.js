import {Mistral} from "@mistralai/mistralai";
import Config from "../config.js";

if (!Config.apiKey) {
  throw new Error("MISTRAL_API_KEY is not set in the environment variables.");
}
const mistral = new Mistral({ apiKey: Config.apiKey });

const messages = [
  { role: 'system', content: 'You are a helpful assistant' },
];

async function chat(message) {
  try {
    console.log('User:', message);

    messages.push({
      role: 'user',
      content: message,
    });

    const recentMessages = messages.slice(-11);

    const chatResponse = await mistral.chat.complete({
      model: Config.llm,
      messages: recentMessages,
    });

    const assistantResponse = chatResponse.choices[0].message.content;

    messages.push({
      role: 'assistant',
      content: assistantResponse,
    });

    console.log('AI: ', assistantResponse);
  } catch (error) {
    console.error(error);
  }
}

await chat('Hi, My name is rajat')
await chat("What is the capital of Delhi also tell my name?")
