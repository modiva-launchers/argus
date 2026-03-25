import PocketBase from 'pocketbase';
import { consoleError } from './terminalLoggingHandler';

const pb = new PocketBase('https://pb.modiva-launcher.xyz');
const pb_email = process.env.PB_EMAIL;
const pb_password = process.env.PB_PASSWORD;

let isAuthed = false;

export async function getPbClient() {
  if (!isAuthed && pb_email && pb_password) {
    try {
      await pb.collection("_superusers").authWithPassword(pb_email, pb_password);
      isAuthed = true;
    } catch (error) {
      consoleError('[PocketBase] Authentication failed:', error);
    }
  }
  return pb;
}
