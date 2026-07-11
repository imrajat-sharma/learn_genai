import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatMistralAI } from "@langchain/mistralai";
import Config from "../config.js";
import { productSchema } from "./productSchema.js";

const model = new ChatMistralAI({
  apiKey: Config.apiKey,
  model: "mistral-small-2603",
});

const input = {
  productName: "Wireless Keyboard",
  category: "Electronics",
  audience: "Students",
};

const parser = StructuredOutputParser.fromZodSchema(productSchema);
const formatInstructions = parser.getFormatInstructions();

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an expert ecommerce copywriter.
Generate a product listing.`,
  ],
  [
    "human",
    `Product: {product}
     Category: {category}
     Audience: {audience}

    {formatInstructions}`,
  ],
]);

export async function askAgent() {
  if (!Config.apiKey) {
    throw new Error(
      "MISTRAL_API_KEY or MISTRALAI_API_KEY not set in environment",
    );
  }

  const formattedMessages = await prompt.formatMessages({
    product: input.productName,
    category: input.category,
    audience: input.audience,
    formatInstructions,
  });

  // const response = await model.invoke(formattedMessages);
  // const result = await parser.parse(response.content);
  // console.log(result);

  const chain = prompt.pipe(model).pipe(parser);
  const result = await chain.invoke({
    product: input.productName,
    category: input.category,
    audience: input.audience,
    formatInstructions,
  });
  console.log(result);
}

await askAgent();
