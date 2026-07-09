import {
  FewShotPromptTemplate,
  PromptTemplate,
} from "@langchain/core/prompts";

const examples = [
  { input: "2+2", output: "4" },
  { input: "5+3", output: "8" },
];

const examplePrompt = PromptTemplate.fromTemplate(
  "Input: {input}\nOutput: {output}"
);

const prompt = new FewShotPromptTemplate({
  examples,
  examplePrompt,
  suffix: "Input: {input}\nOutput:{output}",
  inputVariables: ["input","output"],
});

const formatted = await prompt.format({
  input: "10+15",
  output: "25"
});

console.log(formatted);
