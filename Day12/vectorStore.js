import { MistralAIEmbeddings } from "@langchain/mistralai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import Config from "../config.js";
import { chunks } from "./mistralembedding.js";


const apiKey = Config.apiKey;
if (!apiKey) {
  throw new Error("Mistral API key is not found!");
}
const vectorStore = await MemoryVectorStore.fromTexts(
  chunks,
  chunks.map((_, index) => ({ index })),
  new MistralAIEmbeddings({
    model: "mistral-embed",
    apiKey: apiKey,
  }),
);

const results = await vectorStore.similaritySearch(
  "How do I reset my password?",
  3,
);

console.log(results);
