import { Client, REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import type { Command } from '../types';
import { pathToFileURL } from 'url';
import { consoleDebug, consoleLog, consoleError, consoleWarn } from './terminalLoggingHandler';

export async function loadCommands(client: Client) {
  const commandsPath = join(process.cwd(), 'src/commands');
  const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
  const commandsArray = [];

  for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const fileUrl = pathToFileURL(filePath).href;
    const command: Command = (await import(fileUrl)).default;

    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
      commandsArray.push(command.data.toJSON());
      consoleLog(`Loaded Command: ${command.data.name}`)
    } else {
      consoleWarn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }

  if (process.env.DISCORD_TOKEN && process.env.CLIENT_ID) {
    const rest = new REST().setToken(process.env.DISCORD_TOKEN);
    try {
      consoleLog(`Started refreshing ${commandsArray.length} application (/) commands.`);

      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commandsArray },
      );

      consoleLog(`Successfully reloaded application (/) commands.`);
    } catch (error) {
      consoleError('Error reloading application (/) commands:', error);
    }
  } else {
    consoleWarn(`Missing DISCORD_TOKEN or CLIENT_ID in .env file. Commands won't be registered to Discord API.`);
  }
}
