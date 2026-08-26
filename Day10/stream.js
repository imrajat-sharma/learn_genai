import { Mistral } from "@mistralai/mistralai";

import Config from "../config.js";

const mistral = new Mistral({ apiKey: Config.apiKey });

async function runAIChat() {
  try {
    const chatResponse = await mistral.chat.stream({
      model: Config.llm || "mistral-small-2603",
      messages: [{ role: "user", content: "Write 100 words easy on India?" }],
    });

    for await (const part of chatResponse) {
      let streamText = part.data.choices[0].delta?.content || "";
      if (streamText) {
        process.stdout.write(streamText);
      }
    }
    console.log("\n");
  } catch (error) {
    console.error("Error occurred:", error);
  }
}

runAIChat();
