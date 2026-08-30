import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatMistralAI, MistralAIEmbeddings } from "@langchain/mistralai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import Config from "../config.js";

//API key check
const apiKey = Config.apiKey;
if (!apiKey) {
  throw new Error("Mistral API key is not found!");
}

const documents = [
  new Document({
    pageContent: `
      Employees receive 20 days of paid leave each year.
      Leave requests should be submitted at least five working days early.
    `,
    metadata: {
      source: "leave-policy.txt",
    },
  }),
  new Document({
    pageContent: `
      Employees must use multi-factor authentication for company systems.
      Security incidents must be reported to the security team immediately.
    `,
    metadata: {
      source: "security-policy.txt",
    },
  }),
];

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 300,
  chunkOverlap: 50,
});

const chunks = await splitter.splitDocuments(documents);

const embeddings = new MistralAIEmbeddings({
  apiKey: apiKey,
  model: "mistral-embed",
});

const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);

const retriever = vectorStore.asRetriever({
  k: 3,
});

const model = new ChatMistralAI({
  apiKey: apiKey,
  model: Config.llm,
  temperature: 0,
});

const prompt = ChatPromptTemplate.fromTemplate(`
You answer questions using only the context below.

Rules:
- If the answer is not in the context, say that you do not know.
- Do not invent company policy.
- Include the source names when possible.

Context:
{context}

Question:
{question}
`);

const question = "How early should I submit a leave request?";
const retrievedDocuments = await retriever.invoke(question);

const context = retrievedDocuments
  .map((doc) => `[${doc.metadata.source}]\n${doc.pageContent}`)
  .join("\n\n");

const chain = prompt.pipe(model);

const answer = await chain.invoke({
  context,
  question,
});

console.log(answer.content);
