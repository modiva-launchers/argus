import { EmbedBuilder, Colors, TextChannel, Message } from 'discord.js';
import { client } from '../index';
import { getNextServerCheck } from '../handlers/cronHandler';
import { consoleError } from '../handlers/terminalLoggingHandler';
import { getPbClient } from '../handlers/pbHandler';

const STATUS_CHANNEL_ID = process.env.PANEL_CHANNEL_ID;
let lastStatusMessage: Message | null = null;

interface StatusSection {
  name: string;
  value: string;
  inline?: boolean;
}

/**
 * Updates the status monitor message in the specified channel.
 * If a message already exists, it will be edited. Otherwise, a new one is sent.
 */
export async function updateStatusMonitor() {
  if (!STATUS_CHANNEL_ID) return;

  try {
    const channel = await client.channels.fetch(STATUS_CHANNEL_ID);
    if (!channel || !(channel instanceof TextChannel)) {
      consoleError(`[StatusMonitor] Channel ${STATUS_CHANNEL_ID} not found or not a text channel.`);
      return;
    }

    const sections = await getStatusSections();
    const embed = new EmbedBuilder()
      .setTitle('Modiva Argus - System Control Panel')
      .setThumbnail(client.user?.displayAvatarURL() || null)
      .setColor(0x9b59b6) // Deep Purple
      .setTimestamp()
      .setFooter({
        text: 'Argus Monitoring System • Updates every 60s',
        iconURL: client.user?.displayAvatarURL()
      });

    for (const section of sections) {
      embed.addFields({ name: section.name, value: section.value, inline: section.inline ?? false });
    }

    if (lastStatusMessage) {
      try {
        await lastStatusMessage.edit({ embeds: [embed] });
      } catch (error) {
        lastStatusMessage = await channel.send({ embeds: [embed] });
      }
    } else {
      const messages = await channel.messages.fetch({ limit: 50 });
      const existingMsg = messages.find(m =>
        m.author.id === client.user?.id &&
        m.embeds[0]?.title === 'Modiva Argus - System Control Panel'
      );

      if (existingMsg) {
        lastStatusMessage = existingMsg;
        await lastStatusMessage.edit({ embeds: [embed] });
      } else {
        lastStatusMessage = await channel.send({ embeds: [embed] });
      }
    }
  } catch (error) {
    consoleError('[StatusMonitor] Failed to update status monitor:', error);
  }
}

async function getStatusSections(): Promise<StatusSection[]> {
  const nextCheck = getNextServerCheck();
  const nextCheckRelative = nextCheck ? `<t:${Math.floor(nextCheck.getTime() / 1000)}:R>` : '`Not scheduled`';

  // Fetch PocketBase Statistics
  const pb = await getPbClient();
  let stats: { total: number | string, suspended: number | string, active: number | string, maintenance: number | string } = { 
    total: 'Error', suspended: 'Error', active: 'Error', maintenance: 'Error' 
  };

  try {
    const [total, suspended, active, maintenance] = await Promise.all([
      pb.collection('servers').getList(1, 1, { requestKey: null }),
      pb.collection('servers').getList(1, 1, { filter: 'suspended = true', requestKey: null }),
      pb.collection('servers').getList(1, 1, { filter: 'show_in_server_list = true && suspended=false', requestKey: null }),
      pb.collection('servers').getList(1, 1, { filter: 'maintenance = true && show_in_server_list =true && suspended=false', requestKey: null })
    ]);

    stats = {
      total: total.totalItems,
      suspended: suspended.totalItems,
      active: active.totalItems,
      maintenance: maintenance.totalItems
    };
  } catch (error) {
    consoleError('[StatusMonitor] Statistics fetch error:', error);
  }

  return [
    {
      name: '📡 Connection & Uptime',
      value: `**Status:** \`🟢 Online\`\n**Latency:** \`${client.ws.ping}ms\`\n**Uptime:** \`${formatUptime(client.uptime ?? 0)}\``,
      inline: true
    },
    {
      name: '🕒 Moderation Cycle',
      value: `**Next Scan:** ${nextCheckRelative}\n**Interval:** \`10 Minutes\``,
      inline: true
    },
    {
      name: '📊 Server Inventory',
      value: [
        `> 🌐 **Total Servers:** \`${stats.total}\``,
        `> 📝 **Listed Servers:** \`${stats.active}\``,
        `> 🛠️ **Maintenance:** \`${stats.maintenance}\``,
        `> 🚫 **Suspended:** \`${stats.suspended}\``
      ].join('\n'),
      inline: false
    }
  ];
}

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h % 24 > 0) parts.push(`${h % 24}h`);
  if (m % 60 > 0) parts.push(`${m % 60}m`);
  parts.push(`${s % 60}s`);

  return parts.join(' ');
}
