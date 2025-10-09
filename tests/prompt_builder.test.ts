import { composeSystemPrompt } from "../src/prompt_builder";

describe("composeSystemPrompt", () => {
  const basePrompt = "You are the arbiter.";

  it("includes all sections with the main chamber topic when provided", () => {
    const output = composeSystemPrompt({
      basePrompt,
      rules: "Rule content",
      agendas: "Agenda content",
      players: "Player roster",
      mainChamberTopic: "Debate on Rule 42",
    });

    expect(output).toContain(basePrompt);
    expect(output).toContain("----- MAIN CHAMBER TOPIC -----");
    expect(output).toContain("Debate on Rule 42");
    expect(output).toContain("----- RULES -----");
    expect(output).toContain("Rule content");
    expect(output).toContain("----- AGENDAS -----");
    expect(output).toContain("Agenda content");
    expect(output).toContain("----- PLAYERS -----");
    expect(output).toContain("Player roster");
  });

  it("omits the main chamber section when not provided", () => {
    const output = composeSystemPrompt({
      basePrompt,
      rules: "Rules only",
      agendas: "Agendas only",
      players: "Players only",
    });

    expect(output).not.toContain("----- MAIN CHAMBER TOPIC -----");
  });
});
