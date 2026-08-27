import chat from './mistral.js'
import chatWithRetry from "./retryLogic.js";

const assistantMessage = await chat({
  messages:[
    {role: 'system', content:'You are helpul AI assistant'},
    {role: 'user', content:'What is capital of Delhi?'},
  ]
})

console.log(assistantMessage)

const answer = await chatWithRetry({
  messages: [
    {
      role: "user",
      content: "Explain event loops in JavaScript.",
    },
  ],
});

console.log(answer)
