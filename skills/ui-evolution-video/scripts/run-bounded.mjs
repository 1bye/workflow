import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {cli, isMain} from './io.mjs';

export function runBounded(command, args, {cwd, seconds}) {
  if (!Number.isFinite(seconds) || seconds <= 0) throw new Error('Budget must be a positive number of seconds');
  return new Promise((resolveResult, reject) => {
    const child = spawn(command, args, {cwd, stdio: 'inherit', detached: process.platform !== 'win32'});
    let expired = false;
    let hardStop;
    const stop = (signal) => {
      try {
        if (process.platform === 'win32') child.kill(signal);
        else process.kill(-child.pid, signal);
      } catch (error) { if (error.code !== 'ESRCH') throw error; }
    };
    const timer = setTimeout(() => {
      expired = true;
      stop('SIGTERM');
      hardStop = setTimeout(() => stop('SIGKILL'), 1500);
    }, seconds * 1000);
    child.once('error', (error) => { clearTimeout(timer); clearTimeout(hardStop); reject(error); });
    child.once('close', (code) => {
      clearTimeout(timer);
      if (!expired) clearTimeout(hardStop);
      resolveResult({status: expired ? 'timeout' : code === 0 ? 'succeeded' : 'failed', code: expired ? 124 : code ?? 1});
    });
  });
}
if (isMain(import.meta.url)) cli(async () => {
  const [seconds, cwd, command, ...args] = process.argv.slice(2);
  if (!command) throw new Error('Usage: run-bounded.mjs SECONDS CWD COMMAND [ARGUMENTS...]');
  const result = await runBounded(command, args, {cwd: resolve(cwd), seconds: Number(seconds)});
  console.log(JSON.stringify(result));
  process.exitCode = result.code;
});
