import Config from "../config.js";
import { ChatMistralAI } from "@langchain/mistralai";
import {ChatPromptTemplate} from "@langchain/core/prompts"

async function main() {
  if (!Config.apiKey) {
    console.error("MISTRALAI_API_KEY is not set");
    return;
  }

  const model = new ChatMistralAI({
    model: "mistral-small-2603",
    apiKey: Config.apiKey,
    temperature: Number(Config.temperature) ?? 0.7,
  });

  const prompt = ChatPromptTemplate.fromTemplate(`
    You are a {field} teacher who specialised in teaching {subjects}
    `)
  // :One-way of passing variables
  const formatedPrompt = await prompt.formatMessages({
    field:"computer science",
    subjects:"programming"
  })

  //Better Version
  const chain = prompt.pipe(model)

  const res = await chain.invoke({
    field:"computer science",
    subjects:"programming"
  })


  console.log(res.content)






}

await main();
