import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { config } from 'dotenv';
import { loadEvents } from './handlers/eventHandler';
import { loadCommands } from './handlers/commandHandler';

config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.commands = new Collection();

async function start() {
    await loadEvents(client);
    await loadCommands(client);
    await client.login(process.env.DISCORD_TOKEN);
}

start();
