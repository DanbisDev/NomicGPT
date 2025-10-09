import { ChannelType } from "discord.js";
import { findMainChamberChannel } from "../src/channel_util";

describe("findMainChamberChannel", () => {
  it("returns the main chamber text channel when present", () => {
    const channels = [
      { name: "general", type: ChannelType.GuildText },
      null,
      { name: "main-chamber", type: ChannelType.GuildText },
    ] as any;

    const result = findMainChamberChannel(channels);
    expect(result?.name).toBe("main-chamber");
  });

  it("returns null when the channel is absent", () => {
    const channels = [
      { name: "general", type: ChannelType.GuildText },
      { name: "bot-commands", type: ChannelType.GuildText },
    ] as any;

    expect(findMainChamberChannel(channels)).toBeNull();
  });
});
