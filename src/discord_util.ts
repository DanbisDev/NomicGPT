import type { Collection, Message, Snowflake } from "discord.js";

export type ChatContextMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

/**
 * Converts plain-text rule references (e.g. "rule 123" or "rules 123, 456")
 * into markdown links that target the nomic rules document.
 */
export function formatRuleCitations(text: string): string {
  // Pattern supports single rules, comma separated lists, and sub-rule suffixes.
  const rulePattern =
    /\b(?:rule|rules)\s+([0-9]+(?:[a-z]|\.[0-9]+)?(?:\s*,\s*[0-9]+(?:[a-z]|\.[0-9]+)?)*)\b/gi;

  return text.replace(rulePattern, (_match: string, ruleNumbers: string) => {
    // Split by comma to handle multiple rules
    const rules = ruleNumbers.split(",").map((rule) => rule.trim());

    // Convert each rule to a markdown link
    const ruleLinks = rules.map((rule) => {
      const cleanRule = rule.trim();
      return `[Rule ${cleanRule}](https://github.com/SirRender00/nomic/blob/main/rules.md#${cleanRule})`;
    });

    // Join multiple rules with commas
    return ruleLinks.join(", ");
  });
}

/**
 * Removes Discord mention tokens for the bot from the text so the model sees a clean prompt.
 */
export function stripBotMentions(input: string, botId?: Snowflake | null): string {
  if (!botId) return input;
  const mentionPattern = new RegExp(`<@!?${botId}>`, "g");
  return input.replace(mentionPattern, "").trim();
}

/**
 * Builds conversational context by combining reply-chain ancestors with recent history.
 * Returns messages ordered oldest → newest to feed into the chat completion request.
 */
export async function buildChatContext(
  message: Message<boolean>,
  maxReplyDepth: number,
  historicalChatDepth: number,
  botId?: Snowflake | null,
): Promise<ChatContextMessage[]> {
  const ancestors: Message<boolean>[] = [];
  let current: Message<boolean> | null = message;
  let depth = 0;
  let userMessageCount = 0;

  // Pull channel metadata so the model knows the conversation space
  const channel = message.channel;
  const channelName =
    channel && typeof (channel as { name?: unknown }).name === "string"
      ? (channel as { name: string }).name
      : null;
  const rawChannelTopic =
    channel && typeof (channel as { topic?: unknown }).topic === "string"
      ? ((channel as { topic: string }).topic ?? null)
      : null;
  const trimmedTopic = rawChannelTopic?.trim();
  const channelTopic = trimmedTopic && trimmedTopic.length > 0 ? trimmedTopic : null;
  const channelContext: ChatContextMessage[] = [];
  if (channelName || channelTopic) {
    const contextParts: string[] = [];
    if (channelName) contextParts.push(`#${channelName}`);
    if (channelTopic) contextParts.push(`Topic: ${channelTopic}`);
    channelContext.push({
      role: "system",
      content: `[Channel context] ${contextParts.join(" - ")}`,
    });
  }

  // Collect reply chains
  while (current?.reference?.messageId && depth < maxReplyDepth) {
    try {
      const referenceId: Snowflake | null = current.reference.messageId;
      if (!referenceId) break;
      const parent: Message<boolean> | null = await current.channel.messages.fetch(referenceId);
      if (!parent) break;
      ancestors.push(parent);
      current = parent;
      depth += 1;

      if (parent.author?.id !== botId) {
        userMessageCount += 1;
      }

      if (userMessageCount >= maxReplyDepth) {
        break;
      }
    } catch {
      break;
    }
  }
  ancestors.reverse();

  // Gather historical chats for additional context
  const historicalMessages: Collection<Snowflake, Message<boolean>> = await message.channel.messages.fetch({
    limit: historicalChatDepth,
  });

  // Filter out messages that are already in the reply chain
  const filteredHistoricalMessages = historicalMessages.filter(
    (historicalMsg) => !ancestors.some((ancestor) => ancestor.id === historicalMsg.id),
  );

  // Convert filtered historical messages to array for easier processing
  const historicalArray = Array.from(filteredHistoricalMessages.values());
  // Sort all messages by timestamp to maintain chronological order
  const combinedHistory = [...historicalArray, ...ancestors];
  combinedHistory.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

  // Process history setting roles based on author id and marking historical context
  const contextualizedHistory = combinedHistory.map<ChatContextMessage>((msg) => {
    const isHistorical = historicalArray.some((historicalMsg) => historicalMsg.id === msg.id);
    const content = stripBotMentions(String(msg.content ?? ""), botId);

    return {
      role: msg.author?.id === botId ? "assistant" : "user",
      content: isHistorical ? `[Historical context] ${content}` : content,
    };
  });

  return [...channelContext, ...contextualizedHistory];
}

/**
 * Splits a message into Discord-safe chunks (<= 2000 chars) while preserving readability.
 */
export function splitMessage(text: string, maxLength: number = 2000): string[] {
  if (text.length <= maxLength) {
    return [text];
  }

  const chunks: string[] = [];
  let currentChunk = "";

  // Split by paragraphs first (double newlines)
  const paragraphs = text.split("\n\n");

  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed the limit, start a new chunk
    if (currentChunk.length + paragraph.length + 2 > maxLength) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }

      // If a single paragraph is too long, split it by sentences
      if (paragraph.length > maxLength) {
        const sentences = paragraph.split(". ");
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length + 2 > maxLength) {
            if (currentChunk.length > 0) {
              chunks.push(currentChunk.trim());
              currentChunk = "";
            }
            chunks.push(sentence.trim());
          } else {
            currentChunk += (currentChunk.length > 0 ? ". " : "") + sentence;
          }
        }
      } else {
        currentChunk = paragraph;
      }
    } else {
      currentChunk += (currentChunk.length > 0 ? "\n\n" : "") + paragraph;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
