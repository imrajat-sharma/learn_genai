import { ChatMistralAI } from "@langchain/mistralai";
import Config from "../config.js";

//import MessagePlaceHolder from /core/prompts
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";

//assistant.js
async function assistant() {
  if (!Config.apiKey) console.log("API Key not found");

  const model = new ChatMistralAI({
    model: "mistral-small-2603",
    apiKey: Config.apiKey,
  });

  // OLD:  without history
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "you are a teacher specialised in {field}"],
    ["human", "Explain me the {topic} in {limit} words."],
  ]);

   const chain = prompt.pipe(model);

  const res = await chain.invoke({
    field: "computer science",
    limit: 50,
    topic: "Closures in JavaScript",
  });
  // console.log(res.content);


  // NEW : with history

  const promptTemplate = ChatPromptTemplate.fromMessages([
    ["system", "You are a helpful assistant."],
    new MessagesPlaceholder("history"), //history
    ["human", "{question}"],
  ]);

  //1: way to invoke the model with history
  const msg = await promptTemplate.formatMessages({
    history: [
      { role: "human", content: "Hi!" },
      { role: "assistant", content: "Hello! How can I help?" },
    ],
    question: "Explain async/await.",
  });
  //using the model directly
  const res2 = await model.invoke(msg);
  console.log(res2.content);


  //2: way to invoke the model with history

  const chain = promptTemplate.pipe(model);
  
  //invoke the chain with history
  const response = await chain.invoke({
    history: [
      { role: "human", content: "Hi!" },
      { role: "assistant", content: "Hello! How can I help?" },
    ],
    question: "Explain async/await.",
  })
  console.log(response.content)


}

await assistant();
