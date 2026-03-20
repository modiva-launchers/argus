import { Events, Client } from 'discord.js';
import type { Event } from '../types';
import { consoleLog } from '../handlers/terminalLoggingHandler';

const event: Event<Events.ClientReady> = {
  name: Events.ClientReady,
  once: true,
  execute(client, readyClient) {
    console.log("\n----------\n")
    consoleLog(`Argus Instance is up and running!`)
    consoleLog(`Logged in as ${readyClient.user.tag}`);
    console.log("\n----------\n")
  },
};

export default event;
