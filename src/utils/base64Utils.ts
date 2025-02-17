import * as fs from 'fs/promises';

/**
 * saveBase64File - Saves a base64 string in clear format to file
 *
 * @throws Error
 */
export async function saveBase64File(based64Data: string, filePath: string) {
  const parts = based64Data.split(',');
  const fileData = parts.length > 1 ? parts[1] : parts[0];

  const fileBuffer = Buffer.from(fileData, 'base64');

  await fs.writeFile(filePath, fileBuffer);
}
