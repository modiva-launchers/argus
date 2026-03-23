import PocketBase from 'pocketbase';
import { consoleDebug, consoleLog } from '../handlers/terminalLoggingHandler';
import { analyzeServersWithAI } from '../systems/geminiServerModeration';

const pb = new PocketBase('https://pb.modiva-launcher.xyz');
const pb_email: string | undefined = process.env.PB_EMAIL
const pb_password: string | undefined = process.env.PB_PASSWORD

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

interface serversForReviewInterface {
  id: String,
  name: String,
  desc: String,
  ip: String,
}

export async function checkServers() {
  try {

    await pb.collection("_superusers").authWithPassword(String(pb_email), String(pb_password));

    // lastModeratedAt returns date in ms format in UTC
    const systemSettingsRecord = await pb.collection('system_settings').getOne('5ya60ctsus4vv2t', {})
    let lastModeratedAt: number | Date = parseInt(systemSettingsRecord.last_moderation_check_at)
    // lastModeratedAt = new Date(lastModeratedAt);
    lastModeratedAt = new Date(0);

    let resultList: any | Array<ServerItem> = await pb.collection('servers').getFullList({
      filter: pb.filter('updated > {:date} && show_in_server_list=true && suspended=false', { date: lastModeratedAt })
    });

    let serversForReview: Array<serversForReviewInterface> = []

    if (resultList.length > 0) {
      resultList.forEach((server: ServerItem) => {
        if (server.show_in_server_list === true) {
          serversForReview.push({
            id: server.id,
            name: server.server_name,
            desc: server.description,
            ip: server.ip
          })
        }
      })
      let aiResults = await analyzeServersWithAI(JSON.stringify(serversForReview));
      aiResults = JSON.parse(String(aiResults)).results

      console.log(aiResults)

      // Check if the results are an array in case AI returns non-json response
      if (Array.isArray(aiResults)) {
        console.log('AI Results are in json format')
      }


      // Log the date of this check in the database
      const data = {
        "last_moderation_check_at": String(Date.now())
      }
      await pb.collection('system_settings').update(systemSettingsRecord.id, data);


      consoleDebug('Server Moderation check is finished.')
    } else {
      consoleDebug('No servers updated since the last moderation check.')
    }



    // TODO add logic in case the list exceeds 50 servers

    console.log(lastModeratedAt)

  } catch (err) {
    console.log(err)
  }

}
