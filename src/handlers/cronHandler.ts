import checkServers from "../cron-jobs/serverWatcher";
import { consoleError, consoleLog } from "./terminalLoggingHandler";
import cron, { type ScheduledTask } from "node-cron";
import { updateStatusMonitor } from "../systems/statusMonitor";

let nextServerCheck: Date | null = null;
const tasks: Map<string, ScheduledTask> = new Map();

export function getNextServerCheck() {
  return nextServerCheck;
}

function updateNextServerCheck() {
  const now = new Date();
  const minutes = now.getMinutes();
  const nextMinutes = Math.ceil((minutes + 0.1) / 10) * 10;

  const next = new Date(now);
  next.setMinutes(nextMinutes, 0, 0);

  if (next <= now) {
    next.setMinutes(next.getMinutes() + 10);
  }

  nextServerCheck = next;
}

export async function loadCronJobs() {
  consoleLog('Loaded cron job: checkServers');
  updateNextServerCheck();

  const serverCheckTask = cron.schedule('*/10 * * * *', async () => {
    try {
      await checkServers();
      updateNextServerCheck();
    } catch (error) {
      await cronError('checkServers', error);
    }
  });
  tasks.set('checkServers', serverCheckTask);

  consoleLog('Loaded cron job: statusMonitor');
  const statusMonitorTask = cron.schedule('* * * * *', async () => {
    try {
      await updateStatusMonitor();
    } catch (error) {
      await cronError('statusMonitor', error);
    }
  });
  tasks.set('statusMonitor', statusMonitorTask);
}

export async function cronError(cronJobName: string, error: any) {
  const task = tasks.get(cronJobName);
  if (task) {
    task.stop();
    tasks.delete(cronJobName);
  }
  consoleError(`Cron job named ${cronJobName} has been stopped due to error`, error)
}
