import * as Queue from 'bull';
import * as dotenv from 'dotenv';
import {dbClient} from './utils/db';
import getIdObject from './utils/getIdObject';

// Loading env vars
dotenv.config();

async function processWelcomeEmail(
  data: {userId: string; email: string},
  done: Queue.DoneCallback,
) {
  if (!data.userId) {
    done(new Error('Missing userId'));
    return;
  }
  const mongoObjectId = getIdObject(data!.userId);
  if (!mongoObjectId) {
    done(new Error('Invalid user id'));
    return;
  }
  const user = await dbClient.userCollection.findOne({
    _id: mongoObjectId!,
  });
  if (!user) {
    done(new Error('User not found'));
    return;
  }
  console.log(`Welcome ${user!.email}!`);
  done(null, 'success');
}

const sendWelcomeEmailQueue = Queue(
  'send email',
  `redis://${process.env.HOST || '127.0.0.1'}:${process.env.PORT || '6379'}`,
);
void sendWelcomeEmailQueue
  .count()
  .then(no => console.log('Number of jobs: ', no));

void sendWelcomeEmailQueue.process((job, done): void => {
  void processWelcomeEmail(job.data, done);
});

void sendWelcomeEmailQueue.on('completed', async job => {
  const result = await job.finished();
  console.log(
    `Job with id ${job.id} has been completed with result: ${result}`,
  );
});

void sendWelcomeEmailQueue.on('failed', (job, error) => {
  console.log(`Job fail - ${job.id}: `, error);
});

void sendWelcomeEmailQueue.on('error', error => {
  console.log('Job error: ', error);
});

export {sendWelcomeEmailQueue};
