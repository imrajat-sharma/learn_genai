import express from "express";
import cors from "cors";
import Config from "../config.js";

import { ChatMistralAI } from "@langchain/mistralai";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";

const app = express();

app.use(cors());
app.use(express.json());

const model = new ChatMistralAI({
  apiKey: Config.apiKey,
  model: Config.llm || "mistral-small-2603",
  temperature: 0.7,
  maxTokens: 2000,
});

const conversations = new Map();

app.post("/chat", async (req, res) => {
  try {
    const { message, conversationId = "default" } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    if (!conversations.has(conversationId)) {
      conversations.set(conversationId, [
        new SystemMessage(
          "You are a helpful AI assistant. Keep answers clear and concise."
        ),
      ]);
    }

    const history = conversations.get(conversationId);

    history.push(new HumanMessage(message));

    const response = await model.invoke(history);

    history.push(new AIMessage(response.content));

    res.json({
      conversationId,
      response: response.content,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to generate AI response",
    });
  }
});

app.listen(7700, () => {
  console.log("Server running at http://localhost:7700");
});
