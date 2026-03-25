import { consoleDebug, consoleError, consoleLog } from '../handlers/terminalLoggingHandler';
import { analyzeServersWithAI } from '../systems/geminiServerModeration';
import type { aiResponseServerItem, ServerItem, serversForReview } from '../types';
import { sendDiscordLog } from '../handlers/discordLoggingHandler';
import { Colors } from 'discord.js';
import { getPbClient } from '../handlers/pbHandler';

const logChannelId = process.env.LOG_CHANNEL_ID as string;

export default async function checkServers() {
  consoleDebug('AI Server Moderation Check Triggered')
  try {
    const pb = await getPbClient();

    // lastModeratedAt returns date in ms format in UTC
    const systemSettingsRecord = await pb.collection('system_settings').getOne('5ya60ctsus4vv2t', {});
    let lastModeratedAt: number | Date = parseInt(systemSettingsRecord.last_moderation_check_at);
    lastModeratedAt = new Date(lastModeratedAt);

    let resultList: any | Array<ServerItem> = await pb.collection('servers').getFullList({
      filter: pb.filter('updated > {:date} && show_in_server_list=true && suspended=false && verified=false', { date: lastModeratedAt })
    });

    let serversForReview: Array<serversForReview> = [];

    if (resultList.length > 0) {

      // Keep track of how many servers are going to be
      // changed on the database to cancel batch request
      // in case there are none
      let moderatedServers: number = 0

      resultList.forEach((server: ServerItem) => {
        if (server.show_in_server_list === true) {
          serversForReview.push({
            id: server.id,
            name: server.server_name,
            desc: server.description,
            ip: server.ip
          });
        }
      });

      let aiResults = await analyzeServersWithAI(JSON.stringify(serversForReview));
      aiResults = JSON.parse(String(aiResults)).results;

      // Check if the results are an array in case AI returns non-json response
      if (Array.isArray(aiResults)) {
        const batch = pb.createBatch();

        for (const server of aiResults) {
          const originalServer = serversForReview.find(s => s.id === server.id);
          const serverName = originalServer?.name || 'Unknown Server';

          switch (server.status) {
            case 'SPAM':
              const spamServerNewData = {
                "suspended": true,
                "suspension_reason": server.reason
              };
              moderatedServers++
              batch.collection('servers').update(server.id, spamServerNewData);

              if (logChannelId) {
                await sendDiscordLog({
                  channelId: logChannelId,
                  title: '🛑 Server Suspended (SPAM)',
                  color: Colors.Red,
                  fields: [
                    { name: 'Server Name', value: serverName, inline: true },
                    { name: 'Server ID', value: server.id, inline: true },
                    { name: 'Reason', value: server.reason || 'No reason provided' }
                  ],
                  footer: 'Argus AI Moderation'
                });
              }
              break;

            case 'PRIVATE':
              const privateServerNewData = {
                "maintenance": true,
              };

              batch.collection('servers').update(server.id, privateServerNewData);
              moderatedServers++

              if (logChannelId) {
                await sendDiscordLog({
                  channelId: logChannelId,
                  title: '🔒 Server Set to Private',
                  color: Colors.Orange,
                  fields: [
                    { name: 'Server Name', value: serverName, inline: true },
                    { name: 'Server ID', value: server.id, inline: true },
                    { name: 'Reason', value: server.reason || 'Marked as private/development' }
                  ],
                  footer: 'Argus AI Moderation'
                });
              }
              break;
          }
        }
        if (moderatedServers > 0) {
          await batch.send();
        }
      } else {
        consoleError('There was some issue while processing AI Server Analysis', aiResults);

        if (logChannelId) {
          await sendDiscordLog({
            channelId: logChannelId,
            title: '⚠️ AI Analysis Error',
            color: Colors.Yellow,
            lines: [
              'The AI returned an invalid response format.',
              '```json\n' + JSON.stringify(aiResults).substring(0, 1000) + '\n```'
            ],
            footer: 'Argus System Alert'
          });
        }
      }

      // Log the date of this check in the database
      const data = {
        "last_moderation_check_at": String(Date.now())
      };
      await pb.collection('system_settings').update(systemSettingsRecord.id, data);

      consoleDebug('Server Moderation check is finished.');
    } else {
      consoleDebug('No servers updated since the last moderation check.');
    }

  } catch (err) {
    consoleError('An error occured while trying to analyze server data:');
    console.log(err);

    if (logChannelId) {
      await sendDiscordLog({
        channelId: logChannelId,
        title: '❌ Moderation Check Exception',
        color: Colors.DarkRed,
        lines: [
          'An error occurred during the cron job execution:',
          `\`\`\`\n${err instanceof Error ? err.message : String(err)}\n\`\`\``
        ],
        footer: 'Argus System Error'
      });
    }
  }
}
