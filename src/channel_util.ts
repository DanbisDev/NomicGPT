import { ChannelType, type GuildBasedChannel, type TextChannel } from "discord.js";

function isTextChannel(channel: GuildBasedChannel | null): channel is TextChannel {
  return channel?.type === ChannelType.GuildText;
}

/**
 * Locates the `#main-chamber` text channel within the provided collection.
 */
export function findMainChamberChannel(channels: Iterable<GuildBasedChannel | null>): TextChannel | null {
  for (const channel of channels) {
    if (isTextChannel(channel) && channel.name === "main-chamber") {
      return channel;
    }
  }
  return null;
}
