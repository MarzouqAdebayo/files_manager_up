import {redisClient} from './utils/redis';

const testRedis = async () => {
  console.log(await redisClient.client.keys('*'));
};

void (async () => {
  await testRedis();
})();
