import { Mistral } from '@mistralai/mistralai';

import Config from '../config.js';

const client = new Mistral({apiKey: Config.apiKey});

const chatResponse = await client.chat.complete({
  model: Config.llm || 'mistral-small-2603',
  messages: [{role: 'user', content: 'What is the capital of India?'}],
});

console.log(chatResponse.choices[0].message.content);
