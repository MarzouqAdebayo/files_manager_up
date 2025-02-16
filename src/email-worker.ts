import * as Queue from 'bull';
import * as dotenv from 'dotenv';

// Loading env vars
dotenv.config();

async function processWelcomeEmail(
  {recipients}: {recipients: string[] | string},
  done: Queue.DoneCallback,
) {
  if (Array.isArray(recipients)) {
    for (const recipient of recipients) {
      console.log('Sent welcome email to: ', recipient);
    }
  } else {
    console.log('Sent welcome email to: ', recipients);
  }
  done(null, 'Email sent');
}

const sendWelcomeEmailQueue = Queue(
  'thumbnail generator',
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
