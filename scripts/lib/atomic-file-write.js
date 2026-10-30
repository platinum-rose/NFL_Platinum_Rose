import * as fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';

// Windows readers/scanners can briefly reject opens or replacement renames.
// Never truncate or unlink the published file to work around a sharing lock.
export async function writeFileAtomic(file, data, {
  encoding = 'utf8', retries = 5, delayMs = 50,
  platform = process.platform, io = fs, wait = sleep,
} = {}) {
  const target = path.resolve(file);
  const temporary = path.join(path.dirname(target), `.${path.basename(target)}.${randomUUID()}.tmp`);
  const retry = async (operation) => {
    for (let attempt = 0; ; attempt++) {
      try { return await operation(); } catch (error) {
        const transient = platform === 'win32'
          && ['UNKNOWN', 'EBUSY', 'EPERM', 'EACCES'].includes(error.code);
        if (!transient || attempt >= retries) throw error;
        await wait(delayMs * (2 ** attempt));
      }
    }
  };
  let published = false;
  let failure;
  try {
    await retry(() => io.writeFile(temporary, data, { encoding, flag: 'wx' }));
    await retry(() => io.rename(temporary, target));
    published = true;
  } catch (error) {
    failure = error;
    throw error;
  } finally {
    if (!published) {
      try { await io.rm(temporary, { force: true }); } catch (error) {
        // Preserve the original failure, with the owned temporary's cleanup detail.
        if (failure) failure.cleanupError = error;
      }
    }
  }
}
