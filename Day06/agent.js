import { ChatMistralAI } from "@langchain/mistralai";
import { createAgent, tool } from "langchain";
import { z } from "zod";
import { askQuestion } from "../cli.js";
import Config from "../config.js";

if (!Config.apiKey) {
  throw new Error("MISTRAL_API_KEY is not set. Add it to your .env file.");
}

const getTimeTool = tool(
  async ({ timezone }) => {
    try {
      const time = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        dateStyle: "full",
        timeStyle: "long",
      }).format(new Date());

      return {
        timezone,
        time,
      };
    } catch {
      return {
        error: `Invalid timezone: ${timezone}`,
      };
    }
  },
  {
    name: "getTime",
    description:
      "Get the current date and time for an IANA timezone such as Asia/Kolkata or America/New_York.",
    schema: z.object({
      timezone: z.string().describe("An IANA timezone."),
    }),
  },
);

const calculatorTool = tool(
  async ({ expression }) => {
    try {
      // eslint-disable-next-line no-eval
      const result = eval(expression);
      return `The result of ${expression} is ${result}.`;
    } catch (error) {
      throw new Error(
        `Error occurred while evaluating expression: ${error.message}`,
      );
    }
  },
  {
    name: "calculatorTool",
    description: "A simple calculator tool.",
    schema: z.object({
      expression: z
        .string()
        .describe("The mathematical expression to evaluate."),
    }),
  },
);

const getWeatherTool = tool(
  async ({ city }) => {
    if (city.toLowerCase() === "delhi") {
      return "The current temperature in Delhi is 35°C.";
    }
    return `Weather data for ${city} is not available.`;
  },
  {
    name: "getWeatherTool",
    description: "Get the current temperature of a city.",
    schema: z.object({
      city: z
        .string()
        .describe("The name of the city to get the temperature for."),
    }),
  },
);

const llm = new ChatMistralAI({
  model: Config.llm,
  apiKey: Config.apiKey,
  temperature: Number.parseFloat(Config.temperature) || 0.7,
  maxOutputTokens: 512,
});

const agent = createAgent({
  model: llm,
  systemPrompt: `
  You provide weather information, can perform basic calculations, and can get the current date and time for different timezones.
  1. Call the appropriate tool based on the user's requestq.
  2. Use the tool result to fill the structured response.
  3. Never claim that data is unavailable if the tool returned a result.
  4. If the user asks for weather in a city not supported by the tool, respond with "Weather data for [city] is not available."
`,
  responseFormat: z.object({
    // city: z
    //   .string()
    //   .describe("The name of the city for which the weather is requested."),
    // temperature: z.string().describe("The current temperature of the city."),
    content: z.string().describe("The final answer to the user."),
  }),
  tools: [getWeatherTool, calculatorTool, getTimeTool],
});

async function runAgent() {
  while (true) {
    const question = await askQuestion(
      "Ask a question (or type 'exit' to quit): ",
    );

    if (question.trim().toLowerCase() === "exit") {
      console.log("Exiting.");
      break;
    }

    try {
      const result = await agent.invoke(
        {
          messages: [
            {
              role: "user",
              content: question,
            },
          ],
        },
        {
          recursionLimit: 25,
        },
      );

      if (!result.structuredResponse) {
        console.dir(result, { depth: 10 });
        continue;
      }

      console.log("\nAssistant:", result.structuredResponse.content);
    } catch (error) {
      console.error("Agent error:", error.message);
    }
  }
}

await runAgent();
