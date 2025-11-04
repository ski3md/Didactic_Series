import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const now = () => new Date().toISOString();

export async function writeLog(logFile, line) {
  try {
    await fs.mkdir(path.dirname(logFile), { recursive: true });
    await fs.appendFile(logFile, `${line}\n`, 'utf8');
  } catch (e) {
    // don't throw for logging
    // eslint-disable-next-line no-console
    console.error('Logger write failed', e.message);
  }
}

export function info(msg, opts = {}) {
  const line = `[INFO] ${now()} ${msg}`;
  // user-visible
  // eslint-disable-next-line no-console
  console.log(chalk.green(line));
  if (opts.logFile) writeLog(opts.logFile, line);
}
export function warn(msg, opts = {}) {
  const line = `[WARN] ${now()} ${msg}`;
  // eslint-disable-next-line no-console
  console.log(chalk.yellow(line));
  if (opts.logFile) writeLog(opts.logFile, line);
}
export function error(msg, opts = {}) {
  const line = `[ERROR] ${now()} ${msg}`;
  // eslint-disable-next-line no-console
  console.error(chalk.red(line));
  if (opts.logFile) writeLog(opts.logFile, line);
}
export function debug(msg, opts = {}) {
  const line = `[DEBUG] ${now()} ${msg}`;
  if (process.env.DEBUG) {
    // eslint-disable-next-line no-console
    console.log(chalk.gray(line));
  }
  if (opts.logFile) writeLog(opts.logFile, line);
}
