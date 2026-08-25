import "dotenv/config";
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
  model: Config.llm,
  temperature: 0.7,
});

const conversations = new Map();

function getConversation(conversationId) {
  if (!conversations.has(conversationId)) {
    conversations.set(conversationId, [
      new SystemMessage(
        "You are a helpful AI assistant. Format answers using Markdown."
      ),
    ]);
  }

  return conversations.get(conversationId);
}

app.post("/chat/stream", async (req, res) => {
  const { message, conversationId = "default" } = req.body;

  if (!message) {
    return res.status(400).json({
      error: "Message is required",
    });
  }

  // Configure SSE response headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const history = getConversation(conversationId);

  history.push(new HumanMessage(message));

  let completeResponse = "";

  try {
    const stream = await model.stream(history);

    for await (const chunk of stream) {
      const text = chunk.content || "";

      if (!text) {
        continue;
      }

      completeResponse += text;

      // Send one text chunk to the frontend
      res.write(
        `data: ${JSON.stringify({
          type: "chunk",
          content: text,
        })}\n\n`
      );
    }

    history.push(new AIMessage(completeResponse));

    res.write(
      `data: ${JSON.stringify({
        type: "done",
      })}\n\n`
    );

    res.end();
  } catch (error) {
    console.error(error);

    res.write(
      `data: ${JSON.stringify({
        type: "error",
        error: error.message,
      })}\n\n`
    );

    res.end();
  }
});

app.listen(7700, () => {
  console.log("Server running at http://localhost:3000");
});
