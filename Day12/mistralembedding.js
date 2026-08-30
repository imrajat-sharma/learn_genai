import {MistralAIEmbeddings} from '@langchain/mistralai';
import Config from '../config.js'

//API key check
const apiKey = Config.apiKey
if (!apiKey) {
  throw new Error("Mistral API key is not found!");
}

//Embedding
const embedding = new MistralAIEmbeddings({
  model:'mistral-embed',
  apiKey:apiKey
})

const vector = await embedding.embedQuery("How do i reset my password?")

console.log(vector.length)
