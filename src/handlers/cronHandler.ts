export async function loadCronJobs() {

}

/*
Cron Jobs can cause severe performance issues if they break
Therefore this functions unregisters them if they fail, while
keeping the rest of the Argus System online


Error -> unregister cron -> throw error on console
*/

import { consoleError, consoleLog } from "./terminalLoggingHandler";

export async function cronError(cronJobName: string, error: any) {
  await Bun.cron.remove(cronJobName);
  consoleError(`Cron job named ${cronJobName} has been stopped due to error`, error)
}
