import {MistralAIEmbeddings} from '@langchain/mistralai';
import {RecursiveCharacterTextSplitter} from '@langchain/textsplitters'
import Config from '../config.js'

const DocumentText =
`Q1: How do I register a new account?
Click Sign Up on the home page, enter your email address, create a secure password, and complete the required profile fields. Open the confirmation link sent to your email to activate your account.

Q2: How do I reset my password?
Select Forgot Password? on the login screen, enter your registered email address, and open the password reset link sent to your inbox to set a new password.

Q3: How do I update my profile details or email address?
Log in, go to Account Settings > Profile, update your information, and select Save Changes. Changing your email address will require confirming a verification link sent to your new inbox.

Q4: How do I enable Two-Factor Authentication (2FA)?
Go to Account Settings > Security, toggle on Two-Factor Authentication, and follow the prompts to link an authenticator app or register your phone number for SMS codes.

Q5: How do I delete my account?
Go to Account Settings > Account Management, select Delete Account, and re-enter your password to confirm. Account deletion is permanent and wipes all associated data.`

//API key check
const apiKey = Config.apiKey
if (!apiKey) {
  throw new Error("Mistral API key is not found!");
}

//TextSplitter for chunks
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 50,
})

export const chunks = await splitter.splitText(DocumentText)

//Embedding
const embedding = new MistralAIEmbeddings({
  model:'mistral-embed',
  apiKey:apiKey
})

const vector = await embedding.embedQuery("How do i reset my password?")

console.log(vector.length)
