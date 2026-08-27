import chat from './mistral.js'

function wait(ms){
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default async function chatwithRetry(options, retries = 3){
  for(let attempt=1; attempt<=retries; attempt++){
    try {
      return await chat(options)
    } catch (error) {
      if(attempt == retries) {
        throw new Error(error)
      }
      const delay = attempt * 1000;

      console.log(`Retrying in ${delay} ms...`);
      await wait(delay);
    }

  }

}
