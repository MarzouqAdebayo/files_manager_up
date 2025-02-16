import {dbClient} from './utils/db';
import {redisClient} from './utils/redis';

const testRedis = async () => {
  console.log(redisClient.isAlive());
  console.log(await redisClient.get('myKey'));
  await redisClient.set('myKey', 12, 5);
  console.log(await redisClient.get('myKey'));

  setTimeout(async () => {
    console.log(await redisClient.get('myKey'));
  }, 1000 * 10);
};

const waitConnection = () => {
  return new Promise((resolve, reject) => {
    let i = 0;
    const repeatFct = async () => {
      setTimeout(() => {
        i += 1;
        if (i >= 10) {
          reject();
        } else if (!dbClient.isAlive()) {
          void repeatFct();
        } else {
          resolve(null);
        }
      }, 1000);
    };
    void repeatFct();
  });
};

const testMongo = async () => {
  console.log(dbClient.isAlive());
  await waitConnection();
  console.log(dbClient.isAlive());
  console.log(await dbClient.nbUsers());
  console.log(await dbClient.nbFiles());
};

void (async () => {
  console.log('Running');
  await testRedis();
  console.log('\n==========\n');
  await testMongo();
})();
