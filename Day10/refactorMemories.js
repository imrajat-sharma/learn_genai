import { Mistral } from "@mistralai/mistralai";
import Config from "../config.js";

if (!Config.apiKey) {
  throw new Error("Mistral API key not found!");
}

const mistral = new Mistral({apiKey:Config.apiKey});

const conversations = new Map()

async function chat(conversationId, userText){
  if (!conversationId || typeof conversationId !== 'string') {
    throw new Error('conversationId is required');
  }

  if (!userText || typeof userText !== "string") {
    throw new Error("message must be a non-empty string.");
  }

  if(!conversations.has(conversationId)){
    conversations.set(conversationId,[])
  }


  const history = conversations.get(conversationId)

  history.push({
    role:'user',
    content:userText
  })
  console.log("User:",userText)

  const response = await mistral.chat.complete({
    model:Config.llm,
    messages:[
      {
        role:'system',
        content:'You are a helpful assistant, be polite and respectful.'
      },
      ...history.slice(-10)
    ]
  })

  const assistantMessage = response.choices[0].message.content

  history.push({
    role:'assistant',
    content:assistantMessage
  })
  console.log("AI: ",assistantMessage)
}

await chat("abc123","Hey, my name is rajat")
await chat("abc123","Today is special day.")
await chat("abc123","What should i do")
