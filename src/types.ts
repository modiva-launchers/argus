import { Client, Collection, ChatInputCommandInteraction, SlashCommandBuilder, type ClientEvents } from 'discord.js';

export interface Command {
  data: SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export interface Event<K extends keyof ClientEvents> {
  name: K;
  once?: boolean;
  execute: (client: Client, ...args: ClientEvents[K]) => Promise<void> | void;
}

declare module 'discord.js' {
  export interface Client {
    commands: Collection<string, Command>;
  }
}

export interface aiResponseServerItem {
  id: string,
  status: 'SAFE' | 'SPAM' | 'UNSURE' | 'PRIVATE',
  confidence: number,
  reason: string
}


export interface serversForReview {
  id: String,
  name: String,
  desc: String,
  ip: String,
}


export interface ServerItem {
  id: String,
  updated: String,
  server_name: String,
  description: String,
  ip: String,
  port: String,
  mods_url: String,
  show_in_server_list: Boolean
}
