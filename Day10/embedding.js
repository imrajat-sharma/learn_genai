import { Mistral } from "@mistralai/mistralai";

import Config from "../config.js";

const mistral = new Mistral({ apiKey: Config.apiKey });

async function run() {
  const result = await mistral.embeddings.create({
    model: "mistral-embed",
    inputs: [
      "Embed this sentence.",
      "As well as this one.",
    ],
  });

  console.log(result);
}

run();
