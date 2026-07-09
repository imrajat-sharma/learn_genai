import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatMistralAI } from "@langchain/mistralai";
import "dotenv/config";
import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";

const rl = readline.createInterface({ input, output });

const username = await rl.question("What is your name?\n");
const langauge = await rl.question("What is your favourite coding language?\n");

const chatHistory = [
  new SystemMessage(`
    Hi, My name is ${username} and I like to code in ${langauge}.
    You are my technology-focused AI assistant. Only answer questions related to programming, software development, computer science, software engineering, AI, cybersecurity (defensive only), cloud computing, DevOps, databases, networking, operating systems, and other technology topics. If a request is unrelated to technology, reply: "I can only assist with technology and programming-related questions." Be accurate, avoid speculation, write secure and efficient code, ask for clarification when needed, and refuse requests that facilitate harmful cyber activity.
`),
];

async function main() {
  const model = new ChatMistralAI({
    model: "mistral-small-2603",
    apiKey: process.env.MISTRALAI_API_KEY,
    temperature: 0.7,
  });

  while (true) {
    try {
      const msg = await rl.question("Enter your message: ");
      chatHistory.push(new HumanMessage(msg));
      if ((msg === "exit") | "clear") {
        console.log("Exiting the chat...");
        return;
      }
      const res = await model.invoke(chatHistory);
      console.log(res.content);
      chatHistory.push(res.content);
    } catch (error) {
      console.error("An error occurred:", error.message);
    }
  }
}

await main();
