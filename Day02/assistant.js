import Config from "../config.js";
import { ChatMistralAI } from "@langchain/mistralai";
import {ChatPromptTemplate} from "@langchain/core/prompts"

async function assistant(){
  if(!Config.apiKey) console.log("API Key not found");

  const model = new ChatMistralAI({
    model:"mistral-small-2603",
    apiKey: Config.apiKey,
  })

  const prompt = ChatPromptTemplate.fromMessages([
    ['system','you are a teacher specialised in {field}'],
    ['human','Explain me the {topic} in {limit} words.']
  ])

  const chain = prompt.pipe(model)

  const res = await chain.invoke({
    field: "computer science",
    limit: 50,
    topic: "Closures in JavaScript"
  })
  console.log(res.content);




}

await assistant();
