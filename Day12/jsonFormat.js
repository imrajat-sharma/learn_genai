import { Mistral } from "@mistralai/mistralai";
import { z } from "zod";
import Config from "../config.js";

const TicketSchema = z.object({
  priority: z.enum(["low", "medium", "high"]),
  category: z.enum(["billing", "technical", "account", "other"]),
  summary: z.string().min(1),
});

const client = new Mistral({
  apiKey: Config.apiKey,
});

const response = await client.chat.complete({
  model: Config.llm,
  responseFormat: {
    type: "json_object",
  },
  messages: [
    {
      role: "system",
      content: `
Return only valid JSON.

The JSON must contain:
- priority: one of low, medium, high
- category: one of billing, technical, account, other
- summary: a short string
`,
    },
    {
      role: "user",
      content: "I was charged twice for the same subscription.",
    },
  ],
});

const result = JSON.parse(response.choices[0].message.content);
console.log(result);

//Zod Validation
const ticket = TicketSchema.parse(result);
console.log(ticket);
