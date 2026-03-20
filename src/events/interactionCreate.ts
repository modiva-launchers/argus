import { Events, Client, type Interaction } from 'discord.js';
import type { Event } from '../types';
import { consoleError } from '../handlers/terminalLoggingHandler';

const event: Event<Events.InteractionCreate> = {
  name: Events.InteractionCreate,
  execute: async (client: Client, interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
      consoleError(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      consoleError(`Error executing command: ${interaction.commandName}`, error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
    }
  },
};

export default event;
