import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const text = `
LangChain helps developers build applications powered by language models.
Text splitters divide large documents into smaller chunks.
`;

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 50,
});

const chunks = await splitter.splitText(text);

console.log(chunks);
