import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../types';
import { checkServers } from '../cron-jobs/serverWatcher';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  async execute(interaction: ChatInputCommandInteraction) {
    await checkServers();
    await interaction.reply('Pong!!');
  },
};

export default command;
