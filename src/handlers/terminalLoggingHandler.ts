const red = "\x1b[31m";
const yellow = "\x1b[33m";
const blue = "\x1b[34m";
const reset = "\x1b[0m";

export function consoleError(text: string, error?: any) {
  console.log(`${red}[ERROR] ${reset}${text}`);
  if (error) console.log(error);
}

export function consoleWarn(text: string) {
  console.log(`${yellow}[WARNING] ${reset}${text}`);
}

export function consoleLog(text: string) {
  console.log(`${blue}[INFO] ${reset}${text}`);
}

export function consoleDebug(text: string, error?: any) {
  if (process.env.ENABLE_DEBUGGING === 'TRUE') {
    console.log(`${yellow}[DEBUG] ${reset}${text}`);
    if (error) console.log(error);
  }
}
