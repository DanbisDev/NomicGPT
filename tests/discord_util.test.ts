import { formatRuleCitations, splitMessage, stripBotMentions } from "../src/discord_util";

describe("formatRuleCitations", () => {
  it("converts single rule references into markdown links", () => {
    const input = "According to Rule 123 the vote passes.";
    const result = formatRuleCitations(input);
    expect(result).toContain("[Rule 123](https://github.com/SirRender00/nomic/blob/main/rules.md#123)");
    expect(result).not.toContain("Rule 123 ");
  });

  it("handles multiple rule references separated by commas", () => {
    const input = "See rules 101, 102 for guidance.";
    const result = formatRuleCitations(input);
    expect(result).toContain("[Rule 101](https://github.com/SirRender00/nomic/blob/main/rules.md#101)");
    expect(result).toContain("[Rule 102](https://github.com/SirRender00/nomic/blob/main/rules.md#102)");
    expect(result).not.toContain("rules 101, 102");
  });
});

describe("stripBotMentions", () => {
  it("removes direct bot mentions and trims whitespace", () => {
    const input = "<@123456789>  Hello there!";
    expect(stripBotMentions(input, "123456789")).toBe("Hello there!");
  });

  it("returns the original string when bot id is missing", () => {
    const input = "No mentions here.";
    expect(stripBotMentions(input, null)).toBe(input);
  });
});

describe("splitMessage", () => {
  it("returns the original message when within the limit", () => {
    const input = "Short message";
    expect(splitMessage(input)).toEqual([input]);
  });

  it("splits long messages along paragraph boundaries", () => {
    const paragraph = "a".repeat(1500);
    const input = `${paragraph}\n\n${paragraph}`;
    const chunks = splitMessage(input);
    expect(chunks).toHaveLength(2);
    expect(chunks[0].length).toBeLessThanOrEqual(2000);
    expect(chunks[1].length).toBeLessThanOrEqual(2000);
  });
});
