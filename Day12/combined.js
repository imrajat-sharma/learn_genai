import { MistralAIEmbeddings } from "@langchain/mistralai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import Config from "../config.js";

const longText = `India has a rich and ancient history that spans thousands of years, beginning with the Indus Valley Civilization around 2500 BCE, famous for its advanced city planning and drainage systems.Following this, the Vedic period saw the composition of sacred texts and the rise of foundational spiritual traditions. The subsequent Maurya Empire, led by Emperor Ashoka in the 3rd century BCE, unified much of the subcontinent and helped spread Buddhism across Asia. This was followed by the Gupta Empire, widely regarded as India's golden age for major advances in art, science, and mathematics (including the concept of zero).During the medieval period, Islamic rule took root with the Delhi Sultanate and later the Mughal Empire. The Mughals brought a unique blend of Persian and Indian cultures and built iconic landmarks like the Taj Mahal.By the 17th century, European traders arrived, leading eventually to nearly 200 years of British colonial rule. India fought back through a powerful freedom movement led by figures like Mahatma Gandhi and Jawaharlal Nehru. On August 15, 1947, India finally won its freedom and was partitioned into two nations. Today, the Republic of India stands as the world's largest democracy, driven by a vibrant mix of modern technology and ancient heritage.`;

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 50,
});

const chunks = await splitter.splitText(longText);

const apiKey = Config.apiKey;
if (!apiKey) {
  throw new Error("Mistral API key is not found!");
}

const embeddings = new MistralAIEmbeddings({
  model: "mistral-embed",
  apiKey: apiKey,
});

const vectors = await embeddings.embedDocuments(chunks);

console.log({
  chunks: chunks.length,
  vectors: vectors.length,
});
