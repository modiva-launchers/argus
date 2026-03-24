import { EmbedBuilder, type ColorResolvable, TextChannel } from 'discord.js';
import { consoleError } from './terminalLoggingHandler';
import { client } from '../index';

export interface DiscordLogOptions {
  /** The ID of the channel to send the log to */
  channelId: string;
  /** The title of the embed */
  title: string;
  /** The color of the embed. Defaults to 'Blue' */
  color?: ColorResolvable;
  /** An array of strings to be joined by newlines for the embed description */
  lines?: string[];
  /** Optional fields to add to the embed */
  fields?: { name: string; value: string; inline?: boolean }[];
  /** Optional footer text */
  footer?: string;
}

/**
 * Sends a dynamically formatted log message as a Discord embed to a specific channel.
 */
export async function sendDiscordLog({
  channelId,
  title,
  color = 'Blue',
  lines,
  fields,
  footer
}: DiscordLogOptions): Promise<void> {
  try {
    // Fetch the channel from the client
    const channel = await client.channels.fetch(channelId);

    // Validate that the channel exists and can receive messages
    if (!channel || !channel.isTextBased()) {
      consoleError(`[DiscordLog] Channel with ID ${channelId} not found or is not a text channel.`);
      return;
    }

    // Initialize the embed
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setColor(color)
      .setTimestamp();

    // Add description if lines are provided
    if (lines && lines.length > 0) {
      embed.setDescription(lines.join('\n'));
    }

    // Add fields if provided
    if (fields && fields.length > 0) {
      embed.addFields(fields);
    }

    // Add footer if provided
    if (footer) {
      embed.setFooter({ text: footer });
    }

    // Send the embed to the channel
    await (channel as TextChannel).send({ embeds: [embed] });
  } catch (error) {
    consoleError(`[DiscordLog] Failed to send Discord log to channel ${channelId}:`, error);
  }
}
