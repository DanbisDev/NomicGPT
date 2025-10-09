export interface ComposePromptOptions {
  basePrompt: string;
  rules: string;
  agendas: string;
  players: string;
  mainChamberTopic?: string | null;
}

/**
 * Produces the system prompt with optional main chamber topic context.
 */
export function composeSystemPrompt({
  basePrompt,
  rules,
  agendas,
  players,
  mainChamberTopic,
}: ComposePromptOptions): string {
  let prompt = `${basePrompt.trim()}\n`;

  if (mainChamberTopic) {
    prompt += `\n----- MAIN CHAMBER TOPIC -----\n\n${mainChamberTopic.trim()}\n`;
  }

  prompt += `\n----- RULES -----\n\n${rules.trim()}\n`;
  prompt += `\n----- AGENDAS -----\n\n${agendas.trim()}\n`;
  prompt += `\n----- PLAYERS -----\n\n${players.trim()}\n`;

  return `${prompt}\n`;
}
