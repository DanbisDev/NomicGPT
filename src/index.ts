import 'dotenv/config';
import { Client, GatewayIntentBits } from "discord.js";
import OpenAI from "openai";
import { buildChatContext, formatRuleCitations, splitMessage, stripBotMentions } from './discord_util';
import { getNomicRules, getNomicScores, getNomicAgendas } from './github_grabber';

// Load env vars
const TOKEN = process.env.DISCORD_TOKEN as string;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string;

// =================================================================================
// IF YOU WANT TO SEE WHAT OUR DEFAULT PROMPT IS THIS IS WHAT YOU ARE LOOKING FOR
const systemPrompt = `
You are a lawyer helping a set of players play a game of Nomic. Players will come to you to ask your help interpreting the rules as they are, drafting new rules, and aiding with judgement calls and debates.

Ensure that your advice is perfectly in line with the Rules and make sure your reasoning is clear, sound, and easy to understand. Reference rules whenever you use them. Please reference rules as 'Rule ###' where ### is the rule number.

We are using discord so make sure it is easy to read in a chat platform.

Be short and concise and keep your response less than 1000 characters. If you are able to provide a short answer with no explanation then do that. Try to sound natural.
`
// =================================================================================

// OpenAI client
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Discord client
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent 
  ] 
});

// Function to build the complete system prompt with rules, agendas, and scores
async function buildSystemPrompt(): Promise<string> {
  const [rules, agendas, scores] = await Promise.all([
    getNomicRules(),
    getNomicAgendas(),
    getNomicScores(),
  ]);
  return `${systemPrompt}\n\n----- RULES -----\n\n${rules}\n\n----- AGENDAS -----\n\n${agendas}\n\n----- SCORES -----\n\n${scores}\n\n`;
}



client.on("messageCreate", async message => {
  if (message.author.bot) return;

  const isBotMention = message.mentions.has(client.user?.id || '')
  
  let isReplyToBot = false;
  if(message.reference && message.reference.messageId) // Message has a reply
  {
    const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
    if (referencedMessage.author.id === client.user?.id) {
      isReplyToBot = true;
    }
  }


  if (isReplyToBot || isBotMention) {
    await message.react('🤔');

    const history = await buildChatContext(message, 6, 10, client.user?.id);
    const userMessageContent = stripBotMentions(String(message.content ?? ''), client.user?.id);
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: await buildSystemPrompt() },
          ...history,
          { role: "user", content: userMessageContent }
        ],
      });
      const gptResponse = response.choices[0]?.message?.content ?? "I have absolutely no idea. Try using a superior model like claude. Maybe that model can generate a response.";
      const formattedResponse = formatRuleCitations(gptResponse);
      
      // Split long messages into chunks
      const messageChunks = splitMessage(formattedResponse);
      await message.reply(messageChunks[0]);
      
      // Send additional chunks as follow-up messages
      for (let i = 1; i < messageChunks.length; i++) {
        await message.channel.send(messageChunks[i]);
      }
      
      await message.reactions.cache.get('🤔')?.users.remove(client.user?.id);
    } catch (err) {
      console.error(err);
      await message.reply(`Xi Jinping says: ${err instanceof Error ? err.message : 'Unknown error'}`);
      await message.reactions.cache.get('🤔')?.users.remove(client.user?.id);
    }
    return;
  }
})

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user?.tag}`);
});

client.login(TOKEN);
