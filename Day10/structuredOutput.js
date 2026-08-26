import { Mistral } from "@mistralai/mistralai";
import { z } from "zod";
import Config from "../config.js";

if (!Config.apiKey) {
  throw new Error("MISTRAL_API_KEY is not set in the environment variables.");
}
const mistral = new Mistral({ apiKey: Config.apiKey });

const responseFormat = z.object({
  name: z.string().describe("The name of the person"),
  age: z.number().describe("The age of the person"),
});

async function run() {
  const chatResponse = await mistral.chat.parse({
    model: Config.llm || "mistral-small-2603",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant. your name is Nova and you are 25 years old.",
      },
      { role: "user", content: "Please provide your name and age." },
    ],
    responseFormat,
  });
  console.log(chatResponse.choices[0].message.parsed);
  //Output: { name: 'Nova', age: 25 } --Object
}

run();
