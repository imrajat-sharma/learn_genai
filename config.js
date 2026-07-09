import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });

const Config = {
  apiKey: process.env.MISTRALAI_API_KEY,
  temperature: process.env.TEMPERATURE,
};

export default Config;
