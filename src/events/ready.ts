import { Events, Client } from 'discord.js';
import type { Event } from '../types';

const event: Event<Events.ClientReady> = {
  name: Events.ClientReady,
  once: true,
  execute(client, readyClient) {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    
  },
};

export default event;
