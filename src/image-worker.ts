import * as Queue from 'bull';
import * as imageThumbnail from 'image-thumbnail';
import {ObjectId} from 'mongodb';
import {dbClient} from './utils/db';
import * as fs from 'fs/promises';

const defaultOptions = {failOnError: true, responseType: 'base64'} as const;
const thumbnailOptions = [{width: 500}, {width: 250}, {width: 100}];

async function generateThumbnail(
  base64String: string,
  metadata: {
    filepath: string;
  },
  options?: {
    responseType: 'base64';
  } & imageThumbnail.Options,
) {
  console.log('Generating Thumbnail...');
  try {
    const thumbnail = await imageThumbnail(base64String, options);
    await fs.writeFile(`${metadata.filepath}_${options?.width}`, thumbnail);
    return 'success';
  } catch (err) {
    console.error(err);
    return 'failed';
  }
}

async function processImageThumbnail(
  {
    fileId,
    userId,
  }: {
    fileId: string;
    userId: string;
  },
  done: Queue.DoneCallback,
) {
  console.log('In job, ', fileId, ' ', userId);
  if (!fileId) {
    done(new Error('Missing fileId'));
  }
  if (!userId) {
    done(new Error('Missing userId'));
  }
  const mongoObjectId = new ObjectId(fileId);
  const fileData = await dbClient.fileCollection.findOne({
    _id: mongoObjectId,
    userId,
  });
  if (!fileData) {
    done(new Error('File not found'));
  }
  let contents = '';
  try {
    const decodedfileData = await fs.readFile(fileData!.localPath);
    contents = decodedfileData.toString();
  } catch (error) {
    console.log('file read error!!!  ', error);
    done(error as Error);
  }
  const options = thumbnailOptions.map(
    opts => () =>
      generateThumbnail(
        contents,
        {filepath: fileData!.localPath},
        {...defaultOptions, ...opts},
      ),
  );
  console.log(options);
  const result = await Promise.all(options.map(task => task()));
  console.log(result);
  await new Promise(resolve => setTimeout(resolve, 5000));
  done(null, 'Success');
}

const thumbnailGeneratorQueue = Queue(
  'generate thumbnail',
  `redis://${process.env.HOST || '127.0.0.1'}:${process.env.PORT || '6379'}`,
);
void thumbnailGeneratorQueue
  .count()
  .then(no => console.log('Number of jobs: ', no));

void thumbnailGeneratorQueue.process((job, done): void => {
  void processImageThumbnail(job.data, done);
});

void thumbnailGeneratorQueue.on('completed', async job => {
  const result = await job.finished();
  console.log(
    `Job with id ${job.id} has been completed with result: ${result}`,
  );
});

void thumbnailGeneratorQueue.on('failed', (job, error) => {
  console.log(`Job fail - ${job.id}: `, error);
});

void thumbnailGeneratorQueue.on('error', error => {
  console.log('Job error: ', error);
});

export {thumbnailGeneratorQueue};
