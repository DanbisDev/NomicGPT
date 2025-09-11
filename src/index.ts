import 'dotenv/config';
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from "discord.js";
import OpenAI from "openai";
import { Octokit } from "@octokit/rest";

// Load env vars
const TOKEN = process.env.DISCORD_TOKEN as string;
const CLIENT_ID = process.env.CLIENT_ID as string;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN as string;


// =================================================================================
// IF YOU WANT TO SEE WHAT OUR DEFAULT PROMPT IS THIS IS WHAT YOU ARE LOOKING FOR
const systemPrompt = `
You are a lawyer helping a set of players play a game of Nomic. Players will come to you to ask your help interpreting the rules as they are, drafting new rules, and aiding with judgement calls and debates.

Ensure that your advice is perfectly in line with the Rules and make sure your reasoning is clear, sound, and easy to understand. Reference rules whenever you use them. Please reference rules as 'Rule ###' where ### is the rule number.

We are using discord so make sure it is easy to read in a chat platform.

Be short and concise and keep your response less than 1000 characters. If your answer is short and simple you do not need to give your reason or make your reasons extremely brief. If it's more complicated you can go into detail.
`
// =================================================================================

// Discord client
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent 
  ] 
});

// GitHub client
const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

// Utility to remove bot mention tokens from message content
function stripBotMentions(input: string, botId?: string | null): string {
  if (!botId) return input;
  const mentionPattern = new RegExp(`<@!?${botId}>`, 'g');
  return input.replace(mentionPattern, '').trim();
}

// Build up to maxDepth ancestor messages from a reply chain (oldest to newest)
// Includes both user and bot messages, continuing until we have at least 6 user messages
async function buildReplyChainContext(message: any, maxDepth: number, botId?: string | null): Promise<Array<{ role: 'user' | 'assistant', content: string }>> {
  const ancestors: any[] = [];
  let current = message;
  let depth = 0;
  let userMessageCount = 0;

  while (current?.reference?.messageId && depth < maxDepth) {
    try {
      const parent = await current.channel.messages.fetch(current.reference.messageId);
      if (!parent) break;
      ancestors.push(parent);
      current = parent;
      depth++;
      
      // Count user messages to ensure we get at least 6
      if (parent.author?.id !== botId) {
        userMessageCount++;
      }
      
      // If we have at least 6 user messages, we can stop early
      if (userMessageCount >= 6) {
        break;
      }
    } catch {
      break;
    }
  }

  // We collected newest->oldest; reverse to oldest->newest
  ancestors.reverse();

  const history = ancestors.map((m: any) => ({
    role: m.author?.id === botId ? 'assistant' as const : 'user' as const,
    content: stripBotMentions(String(m.content ?? ''), botId),
  }));

  return history;
}

// Function to fetch rules from GitHub
async function getNomicRules(): Promise<string> {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner: "SirRender00",
      repo: "nomic",
      path: "rules.md",
    });

    if ("content" in data && data.content) {
      // Decode base64 content
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      return content;
    } else {
      throw new Error("Could not retrieve rules content");
    }
  } catch (error) {
    console.error("Error fetching rules:", error);
    throw new Error("Failed to fetch rules from GitHub");
  }
}

// Function to fetch scores from GitHub
async function getNomicScores(): Promise<string> {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner: "SirRender00",
      repo: "nomic",
      path: "scores.txt",
    });

    if ("content" in data && data.content) {
      // Decode base64 content
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      return content;
    } else {
      throw new Error("Could not retrieve scores content");
    }
  } catch (error) {
    console.error("Error fetching scores:", error);
    throw new Error("Failed to fetch scores from GitHub");
  }
}


// Function to build the complete system prompt with rules and scores
async function buildSystemPrompt(): Promise<string> {
  const rules = await getNomicRules();
  const scores = await getNomicScores();
  return `${systemPrompt}\n\n ----- \n\n ${rules}\n\n ----- ${scores}\n\n`;
}

// Function to convert rule references to markdown citations
function formatRuleCitations(text: string): string {
  // Pattern to match various rule reference formats:
  // - "Rule 123" or "rule 123" or "RULE 123"
  // - "rules 123, 456" (multiple rules)
  // - "rule 123a" or "rule 123.1" (sub-rules)
  const rulePattern = /\b(?:rule|rules)\s+([0-9]+(?:[a-z]|\.[0-9]+)?(?:\s*,\s*[0-9]+(?:[a-z]|\.[0-9]+)?)*)\b/gi;
  
  return text.replace(rulePattern, (match, ruleNumbers) => {
    // Split by comma to handle multiple rules
    const rules = ruleNumbers.split(',').map((rule: string) => rule.trim());
    
    // Convert each rule to a markdown link
    const ruleLinks = rules.map((rule: string) => {
      const cleanRule = rule.trim();
      return `[Rule ${cleanRule}](https://github.com/SirRender00/nomic/blob/main/rules.md#${cleanRule})`;
    });
    
    // Join multiple rules with commas
    return ruleLinks.join(', ');
  });
}

// Function to split long messages into chunks that fit Discord's 2000 character limit
function splitMessage(text: string, maxLength: number = 2000): string[] {
  if (text.length <= maxLength) {
    return [text];
  }
  
  const chunks: string[] = [];
  let currentChunk = '';
  
  // Split by paragraphs first (double newlines)
  const paragraphs = text.split('\n\n');
  
  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed the limit, start a new chunk
    if (currentChunk.length + paragraph.length + 2 > maxLength) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      // If a single paragraph is too long, split it by sentences
      if (paragraph.length > maxLength) {
        const sentences = paragraph.split('. ');
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length + 2 > maxLength) {
            if (currentChunk.length > 0) {
              chunks.push(currentChunk.trim());
              currentChunk = '';
            }
            chunks.push(sentence.trim());
          } else {
            currentChunk += (currentChunk.length > 0 ? '. ' : '') + sentence;
          }
        }
      } else {
        currentChunk = paragraph;
      }
    } else {
      currentChunk += (currentChunk.length > 0 ? '\n\n' : '') + paragraph;
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// No slash commands - bot only responds to @mentions and replies

// OpenAI client
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });


// Handle message replies to bot messages
client.on("messageCreate", async message => {
  // Ignore messages from bots (including our own)
  if (message.author.bot) return;
  
  // Check if this is a reply to the bot (prioritize reply chain context even if also mentioned)
  if (message.reference && message.reference.messageId) {
    try {
      const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
      if (referencedMessage.author.id === client.user?.id) {
        await message.react('🤔');
        // Build up to 6 messages of reply chain context (oldest -> newest)
        const history = await buildReplyChainContext(message, 6, client.user?.id);
        const userTurn = stripBotMentions(String(message.content ?? ''), client.user?.id);
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-5-nano",
            messages: [
              { role: "system", content: await buildSystemPrompt() },
              ...history,
              { role: "user", content: userTurn }
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
        return; // Important: stop here so mention handler below doesn't also run
      }
    } catch (error) {
      console.error("Error handling message reply:", error);
      // fallthrough to mention handler if applicable
    }
  }

  // If the bot is mentioned (and not a reply to the bot), respond using GPT with the message content (minus the mention)
  if (message.mentions.has(client.user?.id || '')) {
    try {
      const cleanContent = message.content.replace(new RegExp(`<@!?${client.user?.id}>`, 'g'), '').trim();
      if (cleanContent.length === 0) {
        await message.reply("Please include a question or message after mentioning me.");
        return;
      }
      await message.react('🤔');
      const response = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: await buildSystemPrompt() },
          { role: "user", content: cleanContent }
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
  }
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user?.tag}`);
});

client.login(TOKEN);
