import PocketBase from 'pocketbase';
import { consoleDebug, consoleError, consoleLog } from '../handlers/terminalLoggingHandler';
import { analyzeServersWithAI } from '../systems/geminiServerModeration';
import type { aiResponseServerItem, ServerItem, serversForReview } from '../types';

const pb = new PocketBase('https://pb.modiva-launcher.xyz');
const pb_email: string | undefined = process.env.PB_EMAIL
const pb_password: string | undefined = process.env.PB_PASSWORD


export default async function checkServers() {
  try {

    await pb.collection("_superusers").authWithPassword(String(pb_email), String(pb_password));

    // lastModeratedAt returns date in ms format in UTC
    const systemSettingsRecord = await pb.collection('system_settings').getOne('5ya60ctsus4vv2t', {})
    let lastModeratedAt: number | Date = parseInt(systemSettingsRecord.last_moderation_check_at)
    lastModeratedAt = new Date(lastModeratedAt);

    let resultList: any | Array<ServerItem> = await pb.collection('servers').getFullList({
      filter: pb.filter('updated > {:date} && show_in_server_list=true && suspended=false && verified=false', { date: lastModeratedAt })
    });

    let serversForReview: Array<serversForReview> = []

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

      // Check if the results are an array in case AI returns non-json response
      if (Array.isArray(aiResults)) {
        const batch = pb.createBatch();
        aiResults.forEach((server: aiResponseServerItem) => {
          switch (server.status) {
            case 'SPAM':
              const spamServerNewData = {
                "suspended": true,
                "suspension_reason": server.reason
              }
              batch.collection('servers').update(server.id, spamServerNewData);
              break
            case 'PRIVATE':
              const privateServerNewData = {
                "maintenance": true,
              }
              batch.collection('servers').update(server.id, privateServerNewData);
              break
          }
        })
        await batch.send();
      } else {
        consoleError('There was some issue while processing AI Server Analysis', aiResults)
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

  } catch (err) {
    consoleError('An error occured while trying to analyze server data:')
    console.log(err)
  }

}
