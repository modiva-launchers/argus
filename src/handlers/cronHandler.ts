import checkServers from "../cron-jobs/serverWatcher";
import { consoleError, consoleLog } from "./terminalLoggingHandler";
import cron from "node-cron";

export async function loadCronJobs() {
  consoleLog('Loaded cron job: checkServers')
  cron.schedule('*/10 * * * *', async () => {
    await checkServers();
  });
}

/*
Cron Jobs can cause severe performance issues if they break
Therefore this functions unregisters them if they fail, while
keeping the rest of the Argus System online


Error -> unregister cron -> throw error on console
*/

export async function cronError(cronJobName: string, error: any) {
  await Bun.cron.remove(cronJobName);
  consoleError(`Cron job named ${cronJobName} has been stopped due to error`, error)
}
