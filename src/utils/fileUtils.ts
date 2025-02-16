import * as fs from 'fs/promises';

export async function pathExists(path: string) {
  try {
    await fs.access(path, fs.constants.R_OK | fs.constants.W_OK);
    return true;
  } catch (error) {
    return false;
  }
}
