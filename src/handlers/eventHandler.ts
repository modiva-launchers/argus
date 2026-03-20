import { Client } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import type { Event } from '../types';
import { pathToFileURL } from 'url';
import { consoleLog } from './terminalLoggingHandler';

export async function loadEvents(client: Client) {
  const eventsPath = join(process.cwd(), 'src/events');
  const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

  for (const file of eventFiles) {
    const filePath = join(eventsPath, file);
    const fileUrl = pathToFileURL(filePath).href;
    const event: Event<any> = (await import(fileUrl)).default;

    if (event.once) {
      client.once(event.name, (...args) => event.execute(client, ...args));
    } else {
      client.on(event.name, (...args) => event.execute(client, ...args));
    }
    consoleLog(`Loaded Event: ${event.name}`);
  }
}
