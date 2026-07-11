import { stdin as input, stdout as output } from "process";
import readline from "readline";

export async function askQuestion(query) {
  const rl = readline.createInterface({ input, output });
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}
