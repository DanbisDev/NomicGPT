// Function to convert rule references to markdown citations
export function formatRuleCitations(text: string): string {
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

  // Utility to remove bot mention tokens from message content
export function stripBotMentions(input: string, botId?: string | null): string {
    if (!botId) return input;
    const mentionPattern = new RegExp(`<@!?${botId}>`, 'g');
    return input.replace(mentionPattern, '').trim();
  }

// Build up to maxDepth ancestor messages from a reply chain (oldest to newest)
// Includes both user and bot messages, continuing until we have at least 6 user messages
export async function buildChatContext(message: any, maxReplyDepth: number, historicalChatDepth: number, botId?: string | null): Promise<Array<{ role: 'user' | 'assistant', content: string }>> {
    const ancestors: any[] = [];
    let current = message;
    let depth = 0;
    let userMessageCount = 0;
  
    // Collect reply chains
    while (current?.reference?.messageId && depth < maxReplyDepth) {
      try {
        const parent = await current.channel.messages.fetch(current.reference.messageId);
        if (!parent) break;
        ancestors.push(parent);
        current = parent;
        depth++;
        
        if (parent.author?.id !== botId) {
          userMessageCount++;
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
    const historicalMessages = await message.channel.messages.fetch({limit: historicalChatDepth})
  
    // Filter out messages that are already in the reply chain
    const filteredHistoricalMessages = historicalMessages.filter((historicalMsg: any) => {
      return !ancestors.some(ancestor => ancestor.id === historicalMsg.id);
    });
  
    // Process ancestors (reply chain) - these are the primary context
    const replyHistory = ancestors.map((m: any) => ({
      role: m.author?.id === botId ? 'assistant' as const : 'user' as const,
      content: stripBotMentions(String(m.content ?? ''), botId),
    }));
  
    // Process historical messages (all messages) - these are secondary context
    const historicalContext = filteredHistoricalMessages.map((m: any) => ({
      role: m.author?.id === botId ? 'assistant' as const : 'spectator' as const,
      content: `[Historical context] ${stripBotMentions(String(m.content ?? ''), botId)}`,
    }));
  
    // Combine: historical messages first (less important), then reply chain (more important)
    const allHistory = [...historicalContext, ...replyHistory];
  
    return allHistory;
  }

  // Function to split long messages into chunks that fit Discord's 2000 character limit
export function splitMessage(text: string, maxLength: number = 2000): string[] {
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